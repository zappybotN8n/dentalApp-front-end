import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes, useCrearPaciente, useActualizarPaciente } from '../hooks/usePacientes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pacienteSchema } from '../validations/schemas';
import { toast } from 'sonner';

const camposFormulario = [
  { name: 'nombre',          label: 'Nombre *',            type: 'text',  col: 1, maxLength: 60  },
  { name: 'apellido',        label: 'Apellido *',           type: 'text',  col: 1, maxLength: 60  },
  { name: 'dni',             label: 'DNI',                  type: 'text',  col: 1, maxLength: 8   },
  { name: 'telefono',        label: 'Teléfono *',           type: 'text',  col: 1, maxLength: 15, hint: 'ej: 5493815551234' },
  { name: 'email',           label: 'Email',                type: 'email', col: 1, maxLength: 100 },
  { name: 'fechaNacimiento', label: 'Fecha de nacimiento',  type: 'date',  col: 1 },
  { name: 'obraSocial',      label: 'Obra social',          type: 'text',  col: 1, maxLength: 80  },
  { name: 'numeroAfiliado',  label: 'N° afiliado',          type: 'text',  col: 1, maxLength: 30  },
];

function ModalPaciente({ paciente, onClose, onCreate, onUpdate, isPending }) {
  const esEdicion = !!paciente;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente || {},
  });

  useEffect(() => { reset(paciente || {}); }, [paciente, reset]);

  const onSubmit = async (data) => {
    if (esEdicion) await onUpdate(data);
    else           await onCreate(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-lg">
        <div className="modal-header">
          <h3 className="modal-title">{esEdicion ? 'Editar paciente' : 'Nuevo paciente'}</h3>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="modal-body">
            <div className="grid grid-cols-2 gap-3">
              {camposFormulario.map(({ name, label, type, hint, maxLength }) => (
                <div key={name}>
                  <label className="form-label">
                    {label}
                    {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
                  </label>
                  <input type={type} {...register(name)} className="input-field" maxLength={maxLength} />
                  {errors[name] && <p className="form-error">{errors[name].message}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className="form-label">Notas</label>
              <textarea rows={2} {...register('notas')} className="input-field resize-none" maxLength={500} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-md btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn btn-md btn-primary flex-1">
              {isPending ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pacientes() {
  const [search, setSearch]               = useState('');
  const [modalAbierto, setModalAbierto]   = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [page, setPage]                   = useState(1);

  const { data, isLoading } = usePacientes({ search: search || undefined, page, limit: 20 });
  const pacientes  = data?.data || [];
  const pagination = data?.pagination;

  const crearPaciente    = useCrearPaciente();
  const actualizarPaciente = useActualizarPaciente();
  const isPending = crearPaciente.isPending || actualizarPaciente.isPending;

  const abrirNuevo = () => { setPacienteEditando(null); setModalAbierto(true); };

  const abrirEdicion = (p) => {
    setPacienteEditando({
      _id: p._id,
      nombre:          p.nombre          || '',
      apellido:        p.apellido        || '',
      dni:             p.dni             || '',
      telefono:        p.telefono        || '',
      email:           p.email           || '',
      fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.slice(0, 10) : '',
      obraSocial:      p.obraSocial      || '',
      numeroAfiliado:  p.numeroAfiliado  || '',
      notas:           p.notas           || '',
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setPacienteEditando(null); };

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
    <div className="p-4 lg:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Pacientes</h2>
          {pagination && (
            <p className="page-subtitle">{pagination.total} paciente{pagination.total !== 1 ? 's' : ''} registrados</p>
          )}
        </div>
        <button onClick={abrirNuevo} className="btn btn-md btn-primary">
          + Nuevo paciente
        </button>
      </div>

      {/* ── Búsqueda ── */}
      <input
        type="text"
        placeholder="Buscar por nombre, apellido, DNI o teléfono..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="input-field max-w-md"
        maxLength={100}
      />

      {/* ── Tabla ── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Cargando...</div>
        ) : pacientes.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-gray-400 text-sm">
              {search ? `Sin resultados para "${search}"` : 'No hay pacientes registrados'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-th">Paciente</th>
                    <th className="table-th">DNI</th>
                    <th className="table-th">Teléfono</th>
                    <th className="table-th">Obra social</th>
                    <th className="table-th" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pacientes.map((p) => (
                    <tr key={p._id} className="table-row">
                      <td className="table-td">
                        <p className="text-sm font-semibold text-gray-800">{p.apellido}, {p.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.email || '—'}</p>
                      </td>
                      <td className="table-td text-sm text-gray-600">{p.dni || '—'}</td>
                      <td className="table-td text-sm text-gray-600">{p.telefono}</td>
                      <td className="table-td text-sm text-gray-600">{p.obraSocial || '—'}</td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEdicion(p)}
                            className="btn btn-xs btn-secondary"
                          >
                            Editar
                          </button>
                          <Link
                            to={`/pacientes/${p._id}`}
                            className="btn btn-xs btn-ghost-blue"
                          >
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
                <p className="text-xs text-gray-400">{pagination.total} paciente{pagination.total !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="pagination-btn">← Anterior</button>
                  <span className="text-xs text-gray-400">{page} / {pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="pagination-btn">Siguiente →</button>
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
