import { useState } from 'react';
import { useTurnos, useCrearTurno, useCambiarEstado, useEliminarTurno } from '../hooks/useTurnos';
import { usePacientes } from '../hooks/usePacientes';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { formatFechaCorta, formatFechaInput, ESTADOS_TURNO, generarSlots } from '../utils/fechas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { turnoSchema } from '../validations/schemas';
import { toast } from 'sonner';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';
import dayjs from 'dayjs';

const Badge = ({ estado }) => {
  const { label, color } = ESTADOS_TURNO[estado] || {};
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
};

export default function Turnos() {
  const [fecha, setFecha] = useState(formatFechaInput(new Date()));
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [turnoACancelar, setTurnoACancelar] = useState(null);

  const { data: turnosResp, isLoading } = useTurnos({
    fecha,
    estado: filtroEstado || undefined,
    busqueda: busqueda || undefined,
    page,
    limit: 20,
  });
  const turnos = turnosResp?.data ?? [];
  const pagination = turnosResp?.pagination;
  const { data: pacientesResp } = usePacientes({ limit: 100 });
  const { data: config } = useConfiguracion();
  const pacientes = pacientesResp?.data || [];

  const horarios = config
    ? generarSlots(config.horarioInicio, config.horarioFin, config.intervalo)
    : [];

  const diaSeleccionado = dayjs(fecha).day(); // 0=Dom ... 6=Sáb
  const diaHabilitado = !config || config.diasAtencion.includes(diaSeleccionado);

  const crearTurno = useCrearTurno();
  const cambiarEstado = useCambiarEstado();
  const eliminarTurno = useEliminarTurno();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(turnoSchema),
  });

  const onSubmit = async (data) => {
    try {
      await crearTurno.mutateAsync(data);
      toast.success('Turno creado correctamente');
      reset();
      setModalAbierto(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear turno');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Turnos</h2>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo turno
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="date"
          value={fecha}
          onChange={(e) => { setFecha(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_TURNO).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px]"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : turnos.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No hay turnos para {formatFechaCorta(fecha)}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Hora', 'Paciente', 'Motivo', 'Duración', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {turnos.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{t.hora}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">
                      {t.paciente?.nombre} {t.paciente?.apellido}
                    </p>
                    <p className="text-xs text-gray-400">{t.paciente?.obraSocial || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.motivo || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.duracion}min</td>
                  <td className="px-4 py-3"><Badge estado={t.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {t.estado === 'pendiente' && (
                        <button
                          onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'confirmado' })}
                          className="text-xs text-blue-600 hover:underline"
                        >Confirmar</button>
                      )}
                      {['pendiente', 'confirmado'].includes(t.estado) && (
                        <button
                          onClick={() => cambiarEstado.mutate({ id: t._id, estado: 'completado' })}
                          className="text-xs text-green-600 hover:underline"
                        >Completar</button>
                      )}
                      {t.estado !== 'cancelado' && (
                        <button
                          onClick={() => setTurnoACancelar(t)}
                          className="text-xs text-red-500 hover:underline"
                        >Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">{pagination.total} turno{pagination.total !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >← Anterior</button>
            <span className="text-xs text-gray-500 px-2 py-1">{page} / {pagination.pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="text-xs px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >Siguiente →</button>
          </div>
        </div>
      )}

      {/* Modal confirmación cancelar turno */}
      {turnoACancelar && (
        <ModalConfirmacion
          titulo="¿Cancelar turno?"
          mensaje={`Se cancelará el turno de ${turnoACancelar.paciente?.nombre} ${turnoACancelar.paciente?.apellido} a las ${turnoACancelar.hora}. Esta acción no se puede deshacer.`}
          labelConfirmar="Sí, cancelar turno"
          cargando={cambiarEstado.isPending}
          onConfirmar={() => {
            cambiarEstado.mutate(
              { id: turnoACancelar._id, estado: 'cancelado' },
              { onSuccess: () => setTurnoACancelar(null) }
            );
          }}
          onCancelar={() => setTurnoACancelar(null)}
        />
      )}

      {/* Modal nuevo turno */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">Nuevo turno</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!diaHabilitado && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg px-3 py-2">
                  El día seleccionado no es un día de atención configurado.
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Paciente</label>
                <select
                  {...register('paciente')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Seleccionar...</option>
                  {pacientes.map(p => (
                    <option key={p._id} value={p._id}>{p.apellido}, {p.nombre}</option>
                  ))}
                </select>
                {errors.paciente && <p className="text-red-500 text-xs mt-1">{errors.paciente.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    defaultValue={fecha}
                    {...register('fecha')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
                  <select
                    {...register('hora')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Seleccionar...</option>
                    {horarios.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {errors.hora && <p className="text-red-500 text-xs mt-1">{errors.hora.message}</p>}
                </div>
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
                    defaultValue={config?.duracionDefault ?? 30}
                    step={15}
                    min={15}
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
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crearTurno.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
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
