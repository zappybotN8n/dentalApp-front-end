import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosAPI } from '../services/api';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';

const ESTADOS_BADGE = {
  activo: 'bg-green-100 text-green-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  rechazado: 'bg-red-100 text-red-700',
  inactivo: 'bg-gray-100 text-gray-600',
};

const ROLES_LABEL = {
  usuario: 'Usuario',
  superadmin: 'Superadmin',
};

export default function Usuarios() {
  const qc = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalEliminar, setModalEliminar] = useState(null);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', filtroEstado, busqueda],
    queryFn: async () => {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (busqueda) params.busqueda = busqueda;
      const { data } = await usuariosAPI.getAll(params);
      return data.data;
    },
  });

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }) => usuariosAPI.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Estado actualizado');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al cambiar estado'),
  });

  const mutEliminar = useMutation({
    mutationFn: (id) => usuariosAPI.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario eliminado');
      setModalEliminar(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al eliminar'),
  });

  const pendientes = usuarios.filter((u) => u.estado === 'pendiente').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de usuarios</h2>
        <p className="text-sm text-gray-500 mt-1">
          Aprobá solicitudes y administrá los accesos al sistema
        </p>
      </div>

      {pendientes > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <span className="text-yellow-600 font-medium text-sm">
            {pendientes} solicitud{pendientes > 1 ? 'es' : ''} pendiente{pendientes > 1 ? 's' : ''} de aprobación
          </span>
          <button
            onClick={() => setFiltroEstado('pendiente')}
            className="ml-auto text-xs text-yellow-700 underline hover:no-underline"
          >
            Ver
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="rechazado">Rechazado</option>
        </select>
        {(filtroEstado || busqueda) && (
          <button
            onClick={() => { setFiltroEstado(''); setBusqueda(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">
                    No hay usuarios que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{u.nombre}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADOS_BADGE[u.estado]}`}>
                        {u.estado.charAt(0).toUpperCase() + u.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.creadoEn).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {u.estado === 'pendiente' && (
                          <button
                            onClick={() => mutEstado.mutate({ id: u._id, estado: 'activo' })}
                            disabled={mutEstado.isPending}
                            className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Aprobar
                          </button>
                        )}
                        {u.estado === 'activo' && (
                          <button
                            onClick={() => mutEstado.mutate({ id: u._id, estado: 'inactivo' })}
                            disabled={mutEstado.isPending}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Desactivar
                          </button>
                        )}
                        {(u.estado === 'inactivo' || u.estado === 'rechazado') && (
                          <button
                            onClick={() => mutEstado.mutate({ id: u._id, estado: 'activo' })}
                            disabled={mutEstado.isPending}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Activar
                          </button>
                        )}
                        <button
                          onClick={() => setModalEliminar(u)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalEliminar && (
        <ModalConfirmacion
          titulo="¿Eliminar usuario?"
          mensaje={`Se eliminará permanentemente la cuenta de ${modalEliminar.nombre} (${modalEliminar.email}). Esta acción no se puede deshacer.`}
          labelConfirmar="Sí, eliminar"
          cargando={mutEliminar.isPending}
          onConfirmar={() => mutEliminar.mutate(modalEliminar._id)}
          onCancelar={() => setModalEliminar(null)}
        />
      )}
    </div>
  );
}
