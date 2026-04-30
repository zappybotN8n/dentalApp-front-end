import { useState } from 'react';
import { useTurnos, useCrearTurno, useCambiarEstado, useEliminarTurno } from '../hooks/useTurnos';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { formatFechaInput, ESTADOS_TURNO, generarSlots } from '../utils/fechas';
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
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
};

const ESTADOS_FILTRO = [
  { value: '',           label: 'Todos' },
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado',  label: 'Cancelado' },
  { value: 'ausente',    label: 'Ausente' },
];

export default function Turnos() {
  const hoy = formatFechaInput(new Date());
  const [fecha, setFecha]             = useState(hoy);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda]       = useState('');
  const [page, setPage]               = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaModal, setFechaModal]   = useState(hoy);
  const [turnoACancelar, setTurnoACancelar] = useState(null);

  // ── Datos ──────────────────────────────────────────────────────────
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
  const turnosFechaModal = turnosFechaModalResp?.data ?? [];

  const { data: config } = useConfiguracion();

  const slotsBloqueados = new Set(
    turnosFechaModal.filter(t => t.estado !== 'cancelado').map(t => t.hora)
  );
  const esHoyModal  = fechaModal === hoy;
  const horaActual  = dayjs().format('HH:mm');
  const horarios = config
    ? generarSlots(config.horarioInicio, config.horarioFin, config.intervalo).filter(slot => {
        if (slotsBloqueados.has(slot)) return false;
        if (esHoyModal && slot <= horaActual) return false;
        return true;
      })
    : [];

  // ── Mutations ──────────────────────────────────────────────────────
  const crearTurno   = useCrearTurno();
  const cambiarEstado = useCambiarEstado();
  const eliminarTurno = useEliminarTurno();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(turnoSchema),
  });

  // ── Navegación de fecha ────────────────────────────────────────────
  const navDia = (dir) => {
    const nueva = dayjs(fecha).add(dir, 'day').format('YYYY-MM-DD');
    setFecha(nueva);
    setPage(1);
  };

  const irHoy = () => { setFecha(hoy); setPage(1); };

  const labelFecha = dayjs(fecha).isSame(dayjs(), 'day')
    ? 'Hoy — ' + dayjs(fecha).format('D [de] MMMM')
    : dayjs(fecha).format('dddd D [de] MMMM YYYY');

  // ── Modal nuevo turno ──────────────────────────────────────────────
  const abrirModal = () => {
    setFechaModal(fecha);
    reset({ fecha, duracion: config?.duracionDefault ?? 30 });
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); reset(); };

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

  const handleEstado = (id, estado, confirmMsg) => {
    if (confirmMsg) return; // manejado por ModalConfirmacion
    cambiarEstado.mutate({ id, estado }, {
      onSuccess: () => toast.success('Estado actualizado'),
      onError:   () => toast.error('Error al actualizar'),
    });
  };

  // ── Resumen del día ────────────────────────────────────────────────
  const pendientes  = turnos.filter(t => ['pendiente','confirmado'].includes(t.estado)).length;
  const completados = turnos.filter(t => t.estado === 'completado').length;
  const cancelados  = turnos.filter(t => ['cancelado','ausente'].includes(t.estado)).length;

  return (
    <div className="p-4 lg:p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 capitalize">{labelFecha}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {turnos.length} turno{turnos.length !== 1 ? 's' : ''}
            {pendientes  > 0 && ` · ${pendientes} pendiente${pendientes !== 1 ? 's' : ''}`}
            {completados > 0 && ` · ${completados} completado${completados !== 1 ? 's' : ''}`}
            {cancelados  > 0 && ` · ${cancelados} cancelado${cancelados !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={abrirModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          + Nuevo turno
        </button>
      </div>

      {/* ── Navegación fecha + filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Navegación día */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => navDia(-1)}
            className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm transition-colors"
          >←</button>
          <button
            onClick={irHoy}
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >Hoy</button>
          <button
            onClick={() => navDia(1)}
            className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm transition-colors"
          >→</button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => { setFecha(e.target.value); setPage(1); }}
            className="text-xs text-gray-600 border-0 focus:outline-none focus:ring-0 bg-transparent px-1 cursor-pointer"
          />
        </div>

        {/* Pills de estado */}
        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS_FILTRO.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setFiltroEstado(value); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                filtroEstado === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[180px] bg-white"
        />
      </div>

      {/* ── Lista de turnos ── */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
          Cargando...
        </div>
      ) : turnos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 font-medium text-sm">No hay turnos para este día</p>
          <p className="text-gray-400 text-xs mt-1">
            {filtroEstado ? 'Probá quitando el filtro de estado' : 'Creá un nuevo turno con el botón de arriba'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {turnos.map((t) => {
            const opacidad = ['cancelado','ausente'].includes(t.estado) ? 'opacity-60' : '';
            const recordatorioNoche = t.recordatorioEnviado;
            const recordatorio2h    = t.recordatorio2hEnviado;

            return (
              <div
                key={t._id}
                className={`bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors hover:border-gray-300 ${opacidad}`}
              >
                {/* Hora + duración */}
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-base font-mono font-bold text-gray-800">{t.hora}</p>
                  <p className="text-xs text-gray-400">{t.duracion}min</p>
                </div>

                {/* Separador vertical */}
                <div className="hidden sm:block w-px h-10 bg-gray-100 flex-shrink-0" />

                {/* Info paciente */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">
                      {t.paciente?.apellido}, {t.paciente?.nombre}
                    </p>
                    <Badge estado={t.estado} />
                    {/* Indicadores de recordatorio */}
                    {(recordatorioNoche || recordatorio2h) && (
                      <span
                        title={[
                          recordatorioNoche ? 'Recordatorio noche enviado' : '',
                          recordatorio2h    ? 'Recordatorio 2hs enviado'   : '',
                        ].filter(Boolean).join(' · ')}
                        className="text-xs text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full cursor-default"
                      >
                        💬 {recordatorioNoche && recordatorio2h ? '×2' : '×1'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    {t.motivo && <p className="text-xs text-gray-500">{t.motivo}</p>}
                    {t.paciente?.obraSocial && (
                      <p className="text-xs text-gray-400">{t.paciente.obraSocial}</p>
                    )}
                    {t.paciente?.telefono && (
                      <p className="text-xs text-gray-400">📞 {t.paciente.telefono}</p>
                    )}
                  </div>
                  {t.notas && (
                    <p className="text-xs text-gray-400 mt-0.5 italic">"{t.notas}"</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap sm:justify-end">
                  {t.estado === 'pendiente' && (
                    <button
                      onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'confirmado' }, { onSuccess: () => toast.success('Turno confirmado') })}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >Confirmar</button>
                  )}
                  {['pendiente','confirmado'].includes(t.estado) && (
                    <button
                      onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'completado' }, { onSuccess: () => toast.success('Turno completado') })}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    >Completar</button>
                  )}
                  {['pendiente','confirmado'].includes(t.estado) && (
                    <button
                      onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'ausente' }, { onSuccess: () => toast.success('Marcado como ausente') })}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    >Ausente</button>
                  )}
                  {!['cancelado','completado','ausente'].includes(t.estado) && (
                    <button
                      onClick={() => setTurnoACancelar(t)}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >Cancelar</button>
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
          <p className="text-xs text-gray-500">{pagination.total} turno{pagination.total !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white"
            >← Anterior</button>
            <span className="text-xs text-gray-500 px-2 py-1">{page} / {pagination.pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="text-xs px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white"
            >Siguiente →</button>
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

      {/* ── Modal nuevo turno ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">Nuevo turno</h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('fecha')} />

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Paciente *</label>
                <input type="hidden" {...register('paciente')} />
                <PacienteCombobox
                  value={undefined}
                  onChange={(id) => setValue('paciente', id, { shouldValidate: true })}
                  error={!!errors.paciente}
                />
                {errors.paciente && <p className="text-red-500 text-xs mt-1">{errors.paciente.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha
                  {config && <span className="ml-1 font-normal text-gray-400">— días habilitados según configuración</span>}
                </label>
                <CalendarioInput
                  value={fechaModal}
                  onChange={handleFechaModal}
                  diasHabilitados={config?.diasAtencion ?? [0,1,2,3,4,5,6]}
                />
                {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hora disponible *</label>
                <select
                  {...register('hora')}
                  disabled={horarios.length === 0}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  {horarios.length === 0
                    ? <option value="">Sin horarios disponibles</option>
                    : <><option value="">Seleccionar...</option>{horarios.map(h => <option key={h} value={h}>{h}</option>)}</>
                  }
                </select>
                {errors.hora && <p className="text-red-500 text-xs mt-1">{errors.hora.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Limpieza, Control"
                    {...register('motivo')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    step={15}
                    min={15}
                    defaultValue={config?.duracionDefault ?? 30}
                    {...register('duracion')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                <textarea
                  rows={2}
                  {...register('notas')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >Cancelar</button>
                <button
                  type="submit"
                  disabled={crearTurno.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >{crearTurno.isPending ? 'Guardando...' : 'Guardar turno'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
