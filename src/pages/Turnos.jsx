import { useState, useEffect } from 'react';
import { useTurnos, useCrearTurno, useActualizarTurno, useCambiarEstado, useEliminarTurno } from '../hooks/useTurnos';
import { usePacientes } from '../hooks/usePacientes';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { formatFechaInput, ESTADOS_TURNO, ESTADO_BORDER_CLS, generarSlots } from '../utils/fechas';
import { turnosAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { turnoSchema } from '../validations/schemas';
import { toast } from 'sonner';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';
import CalendarioInput from '../components/ui/CalendarioInput';
import PacienteCombobox from '../components/ui/PacienteCombobox';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const Badge = ({ estado }) => {
  const { label, color } = ESTADOS_TURNO[estado] || {};
  return <span className={`badge badge-status ${color}`}>{label}</span>;
};

const ESTADOS_FILTRO = [
  { value: '',           label: 'Todos'      },
  { value: 'pendiente',  label: 'Pendiente'  },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado',  label: 'Cancelado'  },
  { value: 'ausente',    label: 'Ausente'    },
];

export default function Turnos() {
  const hoy = formatFechaInput(new Date());
  const [fecha, setFecha]               = useState(hoy);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda]         = useState('');
  const [page, setPage]                 = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaModal, setFechaModal]     = useState(hoy);
  const [turnoACancelar, setTurnoACancelar] = useState(null);
  const [turnoAEditar, setTurnoAEditar] = useState(null);
  const [fechaEditar, setFechaEditar]   = useState(hoy);
  const [exportando, setExportando]     = useState(false);

  const { data: turnosResp, isLoading } = useTurnos({
    fecha,
    estado: filtroEstado || undefined,
    busqueda: busqueda || undefined,
    page,
    limit: 20,
  });
  const turnos     = turnosResp?.data ?? [];
  const pagination = turnosResp?.pagination;

  const { data: turnosFechaModalResp } = useTurnos({ fecha: fechaModal, limit: 100 });
  const { data: turnosFechaEditarResp } = useTurnos({ fecha: fechaEditar, limit: 100 });
  const turnosFechaModal = turnosFechaModalResp?.data ?? [];

  const { data: config } = useConfiguracion();

  const slotsBloqueados = new Set(
    turnosFechaModal.filter(t => t.estado !== 'cancelado').map(t => t.hora)
  );
  const esHoyModal = fechaModal === hoy;
  const horaActual = dayjs().format('HH:mm');
  const horarios = config
    ? generarSlots(config.horarioInicio, config.horarioFin, config.intervalo).filter(slot => {
        if (slotsBloqueados.has(slot)) return false;
        if (esHoyModal && slot <= horaActual) return false;
        return true;
      })
    : [];

  const crearTurno    = useCrearTurno();
  const actualizarTurno = useActualizarTurno();
  const cambiarEstado = useCambiarEstado();
  const eliminarTurno = useEliminarTurno();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(turnoSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, watch: watchEdit, formState: { errors: errorsEdit } } = useForm({
    resolver: zodResolver(turnoSchema),
  });

  const horaSeleccionada     = watch('hora');
  const horaEditarSeleccionada = watchEdit('hora');

  const navDia = (dir) => {
    const nueva = dayjs(fecha).add(dir, 'day').format('YYYY-MM-DD');
    setFecha(nueva);
    setPage(1);
  };

  const irHoy = () => { setFecha(hoy); setPage(1); };

  const exportarPDF = async () => {
    setExportando(true);
    try {
      const resp = await turnosAPI.exportarPDF(fecha);
      const url  = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `agenda-${fecha}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al exportar el PDF');
    } finally {
      setExportando(false);
    }
  };

  const labelFecha = dayjs(fecha).isSame(dayjs(), 'day')
    ? 'Hoy — ' + dayjs(fecha).format('D [de] MMMM')
    : dayjs(fecha).format('dddd D [de] MMMM YYYY');

  const abrirModal = () => {
    setFechaModal(fecha);
    reset({ fecha, duracion: config?.duracionDefault ?? 30 });
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); reset(); };

  const abrirEditar = (turno) => {
    const f = dayjs(turno.fecha).format('YYYY-MM-DD');
    setTurnoAEditar(turno);
    setFechaEditar(f);
    resetEdit({
      paciente: turno.paciente?._id || turno.paciente,
      fecha: f,
      hora: turno.hora,
      duracion: turno.duracion,
      motivo: turno.motivo || '',
      notas: turno.notas || '',
    });
  };

  const cerrarEditar = () => { setTurnoAEditar(null); resetEdit(); };

  const onSubmitEditar = async (data) => {
    try {
      await actualizarTurno.mutateAsync({ id: turnoAEditar._id, data });
      toast.success('Turno reprogramado correctamente');
      cerrarEditar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reprogramar turno');
    }
  };

  const handleFechaModal = (nuevaFecha) => {
    setFechaModal(nuevaFecha);
    setValue('fecha', nuevaFecha, { shouldValidate: true });
    setValue('hora', '');
  };

  const onSubmit = async (data) => {
    try {
      await crearTurno.mutateAsync(data);
      toast.success('Turno creado correctamente');
      cerrarModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear turno');
    }
  };

  const pendientes  = turnos.filter(t => ['pendiente', 'confirmado'].includes(t.estado)).length;
  const completados = turnos.filter(t => t.estado === 'completado').length;
  const cancelados  = turnos.filter(t => ['cancelado', 'ausente'].includes(t.estado)).length;

  return (
    <div className="p-4 lg:p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="page-title capitalize">{labelFecha}</h2>
          <p className="page-subtitle">
            {turnos.length} turno{turnos.length !== 1 ? 's' : ''}
            {pendientes  > 0 && ` · ${pendientes} pendiente${pendientes !== 1 ? 's' : ''}`}
            {completados > 0 && ` · ${completados} completado${completados !== 1 ? 's' : ''}`}
            {cancelados  > 0 && ` · ${cancelados} cancelado${cancelados !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="btn btn-md btn-secondary"
            title="Exportar agenda del día como PDF"
          >
            {exportando ? '...' : '⬇ PDF'}
          </button>
          <button onClick={abrirModal} className="btn btn-md btn-primary">
            + Nuevo turno
          </button>
        </div>
      </div>

      {/* ── Navegación + filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="day-nav">
          <button onClick={() => navDia(-1)} className="day-nav-btn">←</button>
          <button onClick={irHoy}            className="day-nav-today">Hoy</button>
          <button onClick={() => navDia(1)}  className="day-nav-btn">→</button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => { setFecha(e.target.value); setPage(1); }}
            className="text-xs text-gray-600 border-0 focus:outline-none focus:ring-0 bg-transparent px-1 cursor-pointer"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS_FILTRO.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setFiltroEstado(value); setPage(1); }}
              className={`filter-pill ${filtroEstado === value ? 'filter-pill-active' : 'filter-pill-idle'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar paciente..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
          className="input-field max-w-[200px]"
        />
      </div>

      {/* ── Lista de turnos ── */}
      {isLoading ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Cargando...</div>
      ) : turnos.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 font-medium text-sm">No hay turnos para este día</p>
          <p className="text-gray-400 text-xs mt-1">
            {filtroEstado ? 'Probá quitando el filtro de estado' : 'Creá un nuevo turno con el botón de arriba'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {turnos.map((t) => {
            const opacidad = ['cancelado', 'ausente'].includes(t.estado) ? 'opacity-60' : '';
            return (
              <div
                key={t._id}
                className={`card-interactive px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 border-l-[3px] overflow-hidden ${ESTADO_BORDER_CLS[t.estado] || 'border-l-gray-200'} ${opacidad}`}
              >
                {/* Hora */}
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-base font-mono font-bold text-gray-800">{t.hora}</p>
                  <p className="text-xs text-gray-400">{t.duracion}min</p>
                </div>

                <div className="hidden sm:block w-px h-10 bg-gray-100 flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">
                      {t.paciente?.apellido}, {t.paciente?.nombre}
                    </p>
                    <Badge estado={t.estado} />
                    {(t.recordatorioEnviado || t.recordatorio2hEnviado) && (
                      <span
                        title={[
                          t.recordatorioEnviado   ? 'Recordatorio noche enviado' : '',
                          t.recordatorio2hEnviado ? 'Recordatorio 2hs enviado'   : '',
                        ].filter(Boolean).join(' · ')}
                        className="badge-reminder"
                      >
                        💬 {t.recordatorioEnviado && t.recordatorio2hEnviado ? '×2' : '×1'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    {t.motivo && <p className="text-xs text-gray-500">{t.motivo}</p>}
                    {t.paciente?.obraSocial && <p className="text-xs text-gray-400">{t.paciente.obraSocial}</p>}
                    {t.paciente?.telefono   && <p className="text-xs text-gray-400">📞 {t.paciente.telefono}</p>}
                  </div>
                  {t.notas && <p className="text-xs text-gray-400 mt-0.5 italic">"{t.notas}"</p>}
                </div>

                {/* Acciones */}
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap sm:justify-end">
                  {['pendiente', 'confirmado'].includes(t.estado) && (
                    <button onClick={() => abrirEditar(t)} className="btn btn-sm btn-ghost-yellow">
                      Reprogramar
                    </button>
                  )}
                  {t.estado === 'pendiente' && (
                    <button
                      onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'confirmado' }, { onSuccess: () => toast.success('Turno confirmado') })}
                      className="btn btn-sm btn-ghost-blue"
                    >Confirmar</button>
                  )}
                  {['pendiente', 'confirmado'].includes(t.estado) && (
                    <button
                      onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'completado' }, { onSuccess: () => toast.success('Turno completado') })}
                      className="btn btn-sm btn-ghost-green"
                    >Completar</button>
                  )}
                  {['pendiente', 'confirmado'].includes(t.estado) && (
                    <button
                      onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'ausente' }, { onSuccess: () => toast.success('Marcado como ausente') })}
                      className="btn btn-sm btn-ghost-gray"
                    >Ausente</button>
                  )}
                  {!['cancelado', 'completado', 'ausente'].includes(t.estado) && (
                    <button onClick={() => setTurnoACancelar(t)} className="btn btn-sm btn-ghost-red">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Paginación ── */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">{pagination.total} turno{pagination.total !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="pagination-btn">← Anterior</button>
            <span className="text-xs text-gray-400">{page} / {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="pagination-btn">Siguiente →</button>
          </div>
        </div>
      )}

      {/* ── Modal cancelar ── */}
      {turnoACancelar && (
        <ModalConfirmacion
          titulo="¿Cancelar turno?"
          mensaje={`Se cancelará el turno de ${turnoACancelar.paciente?.nombre} ${turnoACancelar.paciente?.apellido} a las ${turnoACancelar.hora}hs.`}
          labelConfirmar="Sí, cancelar turno"
          cargando={cambiarEstado.isPending}
          onConfirmar={() =>
            cambiarEstado.mutate(
              { id: turnoACancelar._id, estado: 'cancelado' },
              { onSuccess: () => { toast.success('Turno cancelado'); setTurnoACancelar(null); } }
            )
          }
          onCancelar={() => setTurnoACancelar(null)}
        />
      )}

      {/* ── Modal reprogramar ── */}
      {turnoAEditar && (() => {
        const turnosFechaEditar    = turnosFechaEditarResp?.data ?? [];
        const slotsBloqueadosEditar = new Set(
          turnosFechaEditar.filter(t => t.estado !== 'cancelado' && t._id !== turnoAEditar._id).map(t => t.hora)
        );
        const esHoyEditar   = fechaEditar === hoy;
        const horariosEditar = config
          ? generarSlots(config.horarioInicio, config.horarioFin, config.intervalo).filter(slot => {
              if (slotsBloqueadosEditar.has(slot)) return false;
              if (esHoyEditar && slot <= horaActual) return false;
              return true;
            })
          : [];

        return (
          <div className="modal-overlay">
            <div className="modal-box max-w-lg">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Reprogramar turno</h3>
                  <p className="modal-subtitle">
                    {turnoAEditar.paciente?.apellido}, {turnoAEditar.paciente?.nombre}
                  </p>
                </div>
                <button onClick={cerrarEditar} className="modal-close">&times;</button>
              </div>

              <form onSubmit={handleSubmitEdit(onSubmitEditar)} className="modal-form">
                <div className="modal-body">
                  <input type="hidden" {...registerEdit('paciente')} />
                  <input type="hidden" {...registerEdit('fecha')} />

                  <div className="modal-fecha-hora">
                    <div>
                      <label className="form-label">Nueva fecha</label>
                      <CalendarioInput
                        value={fechaEditar}
                        onChange={(f) => {
                          setFechaEditar(f);
                          setValueEdit('fecha', f, { shouldValidate: true });
                          setValueEdit('hora', '');
                        }}
                        diasHabilitados={config?.diasAtencion ?? [0,1,2,3,4,5,6]}
                        fechasBloqueadas={config?.fechasBloqueadas ?? []}
                      />
                    </div>

                    <div className="modal-hora-col">
                      <div>
                        <label className="form-label">Hora *</label>
                        <input type="hidden" {...registerEdit('hora')} />
                        {horariosEditar.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">Sin horarios disponibles para este día</p>
                        ) : (
                          <div className="time-pill-grid">
                            {horariosEditar.map(h => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setValueEdit('hora', h, { shouldValidate: true })}
                                className={`time-pill ${horaEditarSeleccionada === h ? 'time-pill-active' : 'time-pill-idle'}`}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        )}
                        {errorsEdit.hora && <p className="form-error mt-1">{errorsEdit.hora.message}</p>}
                      </div>

                      <div>
                        <label className="form-label">Motivo</label>
                        <input type="text" {...registerEdit('motivo')} className="input-field" />
                      </div>

                      <div>
                        <label className="form-label">Duración (min)</label>
                        <input type="number" step={15} min={15} {...registerEdit('duracion')} className="input-field" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Notas</label>
                    <textarea rows={2} {...registerEdit('notas')} className="input-field resize-none" />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={cerrarEditar} className="btn btn-md btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={actualizarTurno.isPending} className="btn btn-md btn-warning flex-1">
                    {actualizarTurno.isPending ? 'Guardando...' : 'Reprogramar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── Modal nuevo turno ── */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-box max-w-lg">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Nuevo turno</h3>
                <p className="modal-subtitle">Completá los datos para agendar</p>
              </div>
              <button onClick={cerrarModal} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
              <div className="modal-body">
                <input type="hidden" {...register('fecha')} />

                {/* Paciente */}
                <div>
                  <label className="form-label">Paciente *</label>
                  <input type="hidden" {...register('paciente')} />
                  <PacienteCombobox
                    value={undefined}
                    onChange={(id) => setValue('paciente', id, { shouldValidate: true })}
                    error={!!errors.paciente}
                  />
                  {errors.paciente && <p className="form-error">{errors.paciente.message}</p>}
                </div>

                <div className="modal-fecha-hora">
                  <div>
                    <label className="form-label">Fecha</label>
                    <CalendarioInput
                      value={fechaModal}
                      onChange={handleFechaModal}
                      diasHabilitados={config?.diasAtencion ?? [0,1,2,3,4,5,6]}
                      fechasBloqueadas={config?.fechasBloqueadas ?? []}
                    />
                    {errors.fecha && <p className="form-error mt-1">{errors.fecha.message}</p>}
                  </div>

                  <div className="modal-hora-col">
                    <div>
                      <label className="form-label">Hora *</label>
                      <input type="hidden" {...register('hora')} />
                      {horarios.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">Sin horarios disponibles para este día</p>
                      ) : (
                        <div className="time-pill-grid">
                          {horarios.map(h => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setValue('hora', h, { shouldValidate: true })}
                              className={`time-pill ${horaSeleccionada === h ? 'time-pill-active' : 'time-pill-idle'}`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.hora && <p className="form-error mt-1">{errors.hora.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Motivo</label>
                      <input type="text" placeholder="Ej: Limpieza" {...register('motivo')} className="input-field" />
                    </div>

                    <div>
                      <label className="form-label">Duración (min)</label>
                      <input type="number" step={15} min={15} defaultValue={config?.duracionDefault ?? 30} {...register('duracion')} className="input-field" />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="form-label">Notas</label>
                  <textarea rows={2} {...register('notas')} className="input-field resize-none" />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cerrarModal} className="btn btn-md btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={crearTurno.isPending} className="btn btn-md btn-primary flex-1">
                  {crearTurno.isPending ? 'Guardando...' : 'Guardar turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
