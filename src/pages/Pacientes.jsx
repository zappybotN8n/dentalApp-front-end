import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes, useCrearPaciente, useActualizarPaciente } from '../hooks/usePacientes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pacienteSchema } from '../validations/schemas';
import { toast } from 'sonner';

const camposFormulario = [
  { name: 'nombre',          label: 'Nombre *',         type: 'text',  col: 1 },
  { name: 'apellido',        label: 'Apellido *',        type: 'text',  col: 1 },
  { name: 'dni',             label: 'DNI',               type: 'text',  col: 1 },
  { name: 'telefono',        label: 'Teléfono *',        type: 'text',  col: 1, hint: 'ej: 5493815551234' },
  { name: 'email',           label: 'Email',             type: 'email', col: 1 },
  { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', col: 1 },
  { name: 'obraSocial',      label: 'Obra social',       type: 'text',  col: 1 },
  { name: 'numeroAfiliado',  label: 'N° afiliado',       type: 'text',  col: 1 },
];

function ModalPaciente({ paciente, onClose, onCreate, onUpdate, isPending }) {
  const esEdicion = !!paciente;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente || {}
  });

  useEffect(() => {
    reset(paciente || {});
  }, [paciente, reset]);

  const onSubmit = async (data) => {
    if (esEdicion) {
      await onUpdate(data);
    } else {
      await onCreate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-800">
            {esEdicion ? 'Editar paciente' : 'Nuevo paciente'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {camposFormulario.map(({ name, label, type, hint }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}{hint && <span className="text-gray-400 font-normal"> ({hint})</span>}
                </label>
                <input
                  type={type}
                  {...register(name)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
              </div>
            ))}
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
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {isPending ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pacientes() {
  const [search, setSearch] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePacientes({ search: search || undefined, page, limit: 20 });
  const pacientes = data?.data || [];
  const pagination = data?.pagination;

  const crearPaciente = useCrearPaciente();
  const actualizarPaciente = useActualizarPaciente();

  const isPending = crearPaciente.isPending || actualizarPaciente.isPending;

  const abrirNuevo = () => {
    setPacienteEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (p) => {
    setPacienteEditando({
      _id: p._id,
      nombre: p.nombre || '',
      apellido: p.apellido || '',
      dni: p.dni || '',
      telefono: p.telefono || '',
      email: p.email || '',
      fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.slice(0, 10) : '',
      obraSocial: p.obraSocial || '',
      numeroAfiliado: p.numeroAfiliado || '',
      notas: p.notas || '',
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPacienteEditando(null);
  };

  const handleCrear = async (formData) => {
    try {
      await crearPaciente.mutateAsync(formData);
      toast.success('Paciente creado correctamente');
      cerrarModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear paciente');
    }
  };

  const handleActualizar = async (formData) => {
    try {
      await actualizarPaciente.mutateAsync({ id: pacienteEditando._id, data: formData });
      toast.success('Paciente actualizado correctamente');
      cerrarModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar paciente');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Pacientes</h2>
        <button
          onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo paciente
        </button>
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, DNI o teléfono..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : pacientes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {search ? `Sin resultados para "${search}"` : 'No hay pacientes registrados'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Nombre', 'DNI', 'Teléfono', 'Obra social', ''].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pacientes.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{p.apellido}, {p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.dni || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.telefono}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.obraSocial || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => abrirEdicion(p)}
                            className="text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <Link to={`/pacientes/${p._id}`} className="text-xs text-blue-600 hover:underline font-medium">
                            Ver ficha →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">{pagination.total} paciente{pagination.total !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40">← Anterior</button>
                  <span className="text-xs text-gray-500 px-2 py-1">{page} / {pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="text-xs px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-40">Siguiente →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalAbierto && (
        <ModalPaciente
          paciente={pacienteEditando}
          onClose={cerrarModal}
          onCreate={handleCrear}
          onUpdate={handleActualizar}
          isPending={isPending}
        />
      )}
    </div>
  );
}
