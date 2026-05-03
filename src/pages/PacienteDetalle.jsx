import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePaciente, useTurnosDePaciente, useAgregarHistorial, useActualizarHistorial } from '../hooks/usePacientes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { historialSchema } from '../validations/schemas';
import { toast } from 'sonner';
import { formatFechaCorta, ESTADOS_TURNO } from '../utils/fechas';

const Badge = ({ estado }) => {
  const { label, color } = ESTADOS_TURNO[estado] || {};
  return <span className={`badge badge-status ${color}`}>{label}</span>;
};

export default function PacienteDetalle() {
  const { id } = useParams();
  const [tab, setTab]                       = useState('info');
  const [modalHistorial, setModalHistorial] = useState(false);
  const [registroAEditar, setRegistroAEditar] = useState(null);

  const { data: paciente, isLoading } = usePaciente(id);
  const { data: turnosResp }          = useTurnosDePaciente(id);
  const turnos = Array.isArray(turnosResp) ? turnosResp : (turnosResp?.data ?? []);
  const agregarHistorial   = useAgregarHistorial();
  const actualizarHistorial = useActualizarHistorial();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(historialSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm({
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

  const abrirEditar = (registro) => {
    setRegistroAEditar(registro);
    resetEdit({
      tratamiento: registro.tratamiento,
      notas:       registro.notas  || '',
      costo:       registro.costo  || 0,
      pagado:      registro.pagado || false,
    });
  };

  const onSubmitEditar = async (data) => {
    try {
      await actualizarHistorial.mutateAsync({ id, historialId: registroAEditar._id, data });
      toast.success('Registro actualizado');
      setRegistroAEditar(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    }
  };

  if (isLoading) return <div className="p-8 text-gray-400 text-sm">Cargando ficha...</div>;
  if (!paciente) return <div className="p-8 text-red-500 text-sm">Paciente no encontrado</div>;

  const historial = [...(paciente.historiaClinica || [])].reverse();

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">

      {/* Breadcrumb */}
      <Link to="/pacientes" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
        ← Volver a pacientes
      </Link>

      {/* Header paciente */}
      <div className="card-p">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="page-title break-words">{paciente.apellido}, {paciente.nombre}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
              {paciente.dni   && <span>DNI: {paciente.dni}</span>}
              <span>Tel: {paciente.telefono}</span>
              {paciente.email && <span className="break-all">{paciente.email}</span>}
            </div>
            {paciente.obraSocial && (
              <p className="mt-1 text-xs text-gray-400">
                {paciente.obraSocial}{paciente.numeroAfiliado ? ` · N° ${paciente.numeroAfiliado}` : ''}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">Paciente desde</p>
            <p className="text-sm font-semibold text-gray-600 mt-0.5">{formatFechaCorta(paciente.creadoEn)}</p>
          </div>
        </div>
        {paciente.notas && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
            {paciente.notas}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[['info', 'Historia clínica'], ['turnos', 'Turnos']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Historia clínica */}
      {tab === 'info' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-600">
              Historia clínica
              <span className="ml-1.5 text-gray-400 font-normal">({historial.length} registros)</span>
            </p>
            <button onClick={() => setModalHistorial(true)} className="btn btn-sm btn-primary">
              + Agregar registro
            </button>
          </div>

          {historial.length === 0 ? (
            <div className="card p-10 text-center text-gray-400 text-sm">
              Sin registros clínicos aún
            </div>
          ) : (
            <div className="space-y-2.5">
              {historial.map((h) => (
                <div key={h._id} className="card-p">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 break-words">{h.tratamiento}</p>
                      {h.notas && <p className="text-xs text-gray-500 mt-1 break-words">{h.notas}</p>}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatFechaCorta(h.fecha)}</span>
                        <button
                          onClick={() => abrirEditar(h)}
                          className="btn btn-xs btn-secondary"
                          title="Editar registro"
                        >
                          Editar
                        </button>
                      </div>
                      {h.costo > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-700">
                            ${h.costo.toLocaleString('es-AR')}
                          </span>
                          <span className={`badge ${h.pagado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
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
        <div className="card overflow-hidden">
          {turnos.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Sin turnos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Fecha', 'Hora', 'Motivo', 'Estado'].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {turnos.map((t) => (
                    <tr key={t._id} className="table-row">
                      <td className="table-td text-sm text-gray-600 whitespace-nowrap">{formatFechaCorta(t.fecha)}</td>
                      <td className="table-td text-sm font-mono text-gray-600 whitespace-nowrap">{t.hora}</td>
                      <td className="table-td text-sm text-gray-600">{t.motivo || '—'}</td>
                      <td className="table-td whitespace-nowrap"><Badge estado={t.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal editar registro */}
      {registroAEditar && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="modal-header">
              <h3 className="modal-title">Editar registro clínico</h3>
              <button onClick={() => setRegistroAEditar(null)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmitEdit(onSubmitEditar)} className="modal-form">
              <div className="modal-body">
                <div>
                  <label className="form-label">Tratamiento *</label>
                  <input type="text" {...registerEdit('tratamiento')} className="input-field" maxLength={300} />
                  {errorsEdit.tratamiento && <p className="form-error">{errorsEdit.tratamiento.message}</p>}
                </div>
                <div>
                  <label className="form-label">Notas</label>
                  <textarea rows={3} {...registerEdit('notas')} className="input-field resize-none" maxLength={500} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Costo ($)</label>
                    <input type="number" min={0} step={100} {...registerEdit('costo')} className="input-field" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                      <input type="checkbox" {...registerEdit('pagado')} className="rounded border-gray-300 text-blue-600" />
                      Pagado
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setRegistroAEditar(null)} className="btn btn-md btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={actualizarHistorial.isPending} className="btn btn-md btn-primary flex-1">
                  {actualizarHistorial.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nuevo registro */}
      {modalHistorial && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="modal-header">
              <h3 className="modal-title">Nuevo registro clínico</h3>
              <button onClick={() => setModalHistorial(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmitHistorial)} className="modal-form">
              <div className="modal-body">
                <div>
                  <label className="form-label">Tratamiento *</label>
                  <input
                    type="text"
                    placeholder="Ej: Limpieza, Extracción, Ortodoncia"
                    {...register('tratamiento')}
                    className="input-field"
                    maxLength={300}
                  />
                  {errors.tratamiento && <p className="form-error">{errors.tratamiento.message}</p>}
                </div>
                <div>
                  <label className="form-label">Notas</label>
                  <textarea rows={3} {...register('notas')} className="input-field resize-none" maxLength={500} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Costo ($)</label>
                    <input type="number" min={0} step={100} {...register('costo')} className="input-field" />
                    {errors.costo && <p className="form-error">{errors.costo.message}</p>}
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                      <input type="checkbox" {...register('pagado')} className="rounded border-gray-300 text-blue-600" />
                      Pagado
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setModalHistorial(false)} className="btn btn-md btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={agregarHistorial.isPending} className="btn btn-md btn-primary flex-1">
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
