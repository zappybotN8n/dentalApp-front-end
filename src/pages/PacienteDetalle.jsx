import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePaciente, useTurnosDePaciente, useAgregarHistorial } from '../hooks/usePacientes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { historialSchema } from '../validations/schemas';
import { toast } from 'sonner';
import { formatFechaCorta, ESTADOS_TURNO } from '../utils/fechas';

const Badge = ({ estado }) => {
  const { label, color } = ESTADOS_TURNO[estado] || {};
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
};

export default function PacienteDetalle() {
  const { id } = useParams();
  const [tab, setTab] = useState('info');
  const [modalHistorial, setModalHistorial] = useState(false);

  const { data: paciente, isLoading } = usePaciente(id);
  const { data: turnos = [] } = useTurnosDePaciente(id);
  const agregarHistorial = useAgregarHistorial();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(historialSchema),
  });

  const onSubmitHistorial = async (data) => {
    try {
      await agregarHistorial.mutateAsync({ id, data });
      toast.success('Registro clínico guardado');
      reset();
      setModalHistorial(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    }
  };

  if (isLoading) return <div className="p-8 text-gray-400 text-sm">Cargando ficha...</div>;
  if (!paciente) return <div className="p-8 text-red-500 text-sm">Paciente no encontrado</div>;

  const historial = [...(paciente.historiaClinica || [])].reverse();

  return (
    <div className="p-6 max-w-3xl">
      {/* Breadcrumb */}
      <Link to="/pacientes" className="text-xs text-blue-600 hover:underline mb-4 block">← Volver a pacientes</Link>

      {/* Header paciente */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{paciente.apellido}, {paciente.nombre}</h2>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              {paciente.dni && <span>DNI: {paciente.dni}</span>}
              <span>Tel: {paciente.telefono}</span>
              {paciente.email && <span>{paciente.email}</span>}
            </div>
            {paciente.obraSocial && (
              <p className="mt-1 text-xs text-gray-400">
                {paciente.obraSocial}{paciente.numeroAfiliado ? ` · N° ${paciente.numeroAfiliado}` : ''}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Paciente desde</p>
            <p className="font-medium text-gray-600">{formatFechaCorta(paciente.creadoEn)}</p>
          </div>
        </div>
        {paciente.notas && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800">
            {paciente.notas}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {[['info', 'Historia clínica'], ['turnos', 'Turnos']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Historia clínica */}
      {tab === 'info' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Historia clínica ({historial.length} registros)</h3>
            <button
              onClick={() => setModalHistorial(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + Agregar registro
            </button>
          </div>
          {historial.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              Sin registros clínicos aún
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((h) => (
                <div key={h._id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{h.tratamiento}</p>
                      {h.notas && <p className="text-xs text-gray-500 mt-1">{h.notas}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-400">{formatFechaCorta(h.fecha)}</p>
                      {h.costo > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-gray-700">${h.costo.toLocaleString('es-AR')}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${h.pagado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {h.pagado ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Turnos */}
      {tab === 'turnos' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {turnos.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Sin turnos registrados</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Fecha', 'Hora', 'Motivo', 'Estado'].map(h => <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {turnos.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFechaCorta(t.fecha)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{t.hora}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.motivo || '—'}</td>
                    <td className="px-4 py-3"><Badge estado={t.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal historial */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">Nuevo registro clínico</h3>
              <button onClick={() => setModalHistorial(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmitHistorial)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tratamiento *</label>
                <input type="text" placeholder="Ej: Limpieza, Extracción, Ortodoncia" {...register('tratamiento')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                {errors.tratamiento && <p className="text-red-500 text-xs mt-1">{errors.tratamiento.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                <textarea rows={3} {...register('notas')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Costo ($)</label>
                  <input type="number" min={0} step={100} {...register('costo')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  {errors.costo && <p className="text-red-500 text-xs mt-1">{errors.costo.message}</p>}
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" {...register('pagado')} className="rounded" />
                    Pagado
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalHistorial(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg">Cancelar</button>
                <button type="submit" disabled={agregarHistorial.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  {agregarHistorial.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
