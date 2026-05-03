import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { usuariosAPI } from '../services/api';
import { useConfigGlobal, useActualizarConfigGlobal } from '../hooks/useConfigGlobal';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADOS_BADGE = {
  activo:    'bg-green-100 text-green-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  rechazado: 'bg-red-100 text-red-700',
  inactivo:  'bg-gray-100 text-gray-600',
};

const ACCESO_CONFIG = {
  trial:     { label: 'Trial',     cls: 'badge-acceso-trial'     },
  suscripto: { label: 'Suscripto', cls: 'badge-acceso-suscripto' },
  gracia:    { label: 'Gracia',    cls: 'badge-acceso-gracia'    },
  expirado:  { label: 'Expirado',  cls: 'badge-acceso-expirado'  },
  exento:    { label: 'Exento',    cls: 'badge-acceso-exento'    },
  sin_trial: { label: 'Sin trial', cls: 'bg-gray-100 text-gray-500' },
};

function calcularAcceso(u, config) {
  const diasTrial  = config?.diasTrial  ?? 14;
  const diasGracia = config?.diasGracia ?? 3;

  if (u.exento) return { estadoAcceso: 'exento', diasRestantes: null };
  const ahora = new Date();
  if (u.suscripcionActiva && u.suscripcionVence && new Date(u.suscripcionVence) > ahora) {
    const dias = Math.ceil((new Date(u.suscripcionVence) - ahora) / (1000 * 60 * 60 * 24));
    return { estadoAcceso: 'suscripto', diasRestantes: dias };
  }
  if (u.trialInicio) {
    const diasDisp = diasTrial + (u.diasTrialExtra || 0);
    const vence = new Date(u.trialInicio);
    vence.setDate(vence.getDate() + diasDisp);
    if (ahora <= vence) {
      return { estadoAcceso: 'trial', diasRestantes: Math.ceil((vence - ahora) / (1000 * 60 * 60 * 24)) };
    }
    const gracia = new Date(vence);
    gracia.setDate(gracia.getDate() + diasGracia);
    if (ahora <= gracia) return { estadoAcceso: 'gracia', diasRestantes: Math.ceil((gracia - ahora) / (1000 * 60 * 60 * 24)) };
    return { estadoAcceso: 'expirado', diasRestantes: 0 };
  }
  return { estadoAcceso: 'sin_trial', diasRestantes: null };
}

// ─── Modal de suscripción ────────────────────────────────────────────────────

const hoyISO = () => new Date().toISOString().slice(0, 10);

function ModalSuscripcion({ usuario, onClose, onSaved }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      exento:            usuario.exento            ?? false,
      diasTrialExtra:    usuario.diasTrialExtra    ?? 0,
      trialInicio:       usuario.trialInicio
        ? new Date(usuario.trialInicio).toISOString().slice(0, 10)
        : hoyISO(),  // default: hoy (para usuarios sin trial aún)
      suscripcionActiva: usuario.suscripcionActiva ?? false,
      suscripcionVence:  usuario.suscripcionVence
        ? new Date(usuario.suscripcionVence).toISOString().slice(0, 10)
        : '',
    },
  });

  const mut = useMutation({
    mutationFn: (data) => usuariosAPI.gestionarSuscripcion(usuario._id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Suscripción actualizada');
      onSaved?.();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al guardar'),
  });

  const exento     = watch('exento');
  const suscActiva = watch('suscripcionActiva');

  const onSubmit = (data) => {
    mut.mutate({
      exento:            data.exento,
      diasTrialExtra:    Number(data.diasTrialExtra),
      trialInicio:       data.trialInicio || null,
      suscripcionActiva: data.suscripcionActiva,
      suscripcionVence:  data.suscripcionVence || null,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-sm">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Gestionar suscripción</h3>
            <p className="text-xs text-gray-400 mt-0.5">{usuario.nombre} · {usuario.email}</p>
          </div>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="modal-body space-y-5">

            {/* Exento */}
            <div className="config-field-row">
              <div>
                <p className="config-field-label font-medium">Exento de pago</p>
                <p className="config-field-desc">Acceso permanente sin restricciones</p>
              </div>
              <label className={`config-toggle ${exento ? 'config-toggle-on' : 'config-toggle-off'}`}>
                <input type="checkbox" {...register('exento')} className="sr-only" />
                <span className="config-toggle-thumb" />
              </label>
            </div>

            {!exento && (
              <>
                {/* Inicio de trial */}
                <div className="config-field-row">
                  <div>
                    <p className="config-field-label">Inicio de trial</p>
                    <p className="config-field-desc">
                      {usuario.trialInicio ? 'Fecha original de aprobación' : '⚠️ Sin trial — se iniciará en la fecha indicada'}
                    </p>
                  </div>
                  <input
                    type="date"
                    {...register('trialInicio')}
                    className="config-field-input w-36"
                  />
                </div>

                {/* Días extra de trial */}
                <div className="config-field-row">
                  <div>
                    <p className="config-field-label">Días extra de trial</p>
                    <p className="config-field-desc">Se suman a los días base del sistema</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    {...register('diasTrialExtra')}
                    className="config-field-input"
                  />
                </div>

                {/* Suscripción activa */}
                <div className="config-field-row">
                  <div>
                    <p className="config-field-label font-medium">Suscripción activa</p>
                    <p className="config-field-desc">Marcar si el usuario pagó</p>
                  </div>
                  <label className={`config-toggle ${suscActiva ? 'config-toggle-on' : 'config-toggle-off'}`}>
                    <input type="checkbox" {...register('suscripcionActiva')} className="sr-only" />
                    <span className="config-toggle-thumb" />
                  </label>
                </div>

                {suscActiva && (
                  <div className="config-field-row">
                    <div>
                      <p className="config-field-label">Vence el</p>
                    </div>
                    <input
                      type="date"
                      {...register('suscripcionVence')}
                      className="config-field-input w-36"
                    />
                  </div>
                )}
              </>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-md btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={mut.isPending} className="btn btn-md btn-primary flex-1">
              {mut.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panel de configuración global ──────────────────────────────────────────

function PanelConfigGlobal() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useConfigGlobal();
  const actualizar = useActualizarConfigGlobal();
  const [form, setForm] = useState(null);

  // Inicializar form cuando llega config (solo la primera vez)
  if (config && form === null) {
    setForm({
      precioMensual: config.precioMensual,
      diasTrial:     config.diasTrial,
      diasGracia:    config.diasGracia,
      cobroActivo:   config.cobroActivo,
      moneda:        config.moneda,
    });
  }

  const handleGuardar = async () => {
    try {
      await actualizar.mutateAsync(form);
      // Invalidar usuarios para recalcular badges de acceso con los nuevos días
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Configuración actualizada');
    } catch {
      toast.error('Error al guardar configuración');
    }
  };

  if (isLoading || !form) return null;

  return (
    <div className="config-panel">
      <div className="config-panel-header">
        <div>
          <p className="config-panel-title">⚙️ Configuración del sistema</p>
          <p className="text-xs text-gray-400 mt-0.5">Precios, trial y cobro global</p>
        </div>
        <button
          onClick={handleGuardar}
          disabled={actualizar.isPending}
          className="btn btn-sm btn-primary"
        >
          {actualizar.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="config-panel-body">
        {/* Cobro activo — toggle prominente */}
        <div className="config-field-row">
          <div>
            <p className="config-field-label font-semibold text-gray-800">Cobro activo</p>
            <p className="config-field-desc">
              {form.cobroActivo ? 'Los usuarios deben tener suscripción o trial vigente' : 'Todos los usuarios tienen acceso libre'}
            </p>
          </div>
          <label className={`config-toggle ${form.cobroActivo ? 'config-toggle-on' : 'config-toggle-off'}`}>
            <input
              type="checkbox"
              className="sr-only"
              checked={form.cobroActivo}
              onChange={(e) => setForm((f) => ({ ...f, cobroActivo: e.target.checked }))}
            />
            <span className="config-toggle-thumb" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-4">
          {/* Precio mensual */}
          <div className="config-field-row sm:flex-col sm:items-start sm:gap-1 sm:py-4">
            <div className="flex-1">
              <p className="config-field-label">Precio mensual</p>
              <p className="config-field-desc">{form.moneda}</p>
            </div>
            <input
              type="number"
              min="0"
              value={form.precioMensual}
              onChange={(e) => setForm((f) => ({ ...f, precioMensual: parseInt(e.target.value, 10) || 0 }))}
              onFocus={(e) => e.target.select()}
              className="config-field-input sm:w-full sm:text-left"
            />
          </div>

          {/* Días de trial */}
          <div className="config-field-row sm:flex-col sm:items-start sm:gap-1 sm:py-4">
            <div className="flex-1">
              <p className="config-field-label">Días de trial</p>
              <p className="config-field-desc">Desde aprobación</p>
            </div>
            <input
              type="number"
              min="1"
              max="365"
              value={form.diasTrial}
              onChange={(e) => setForm((f) => ({ ...f, diasTrial: parseInt(e.target.value, 10) || 0 }))}
              onFocus={(e) => e.target.select()}
              className="config-field-input sm:w-full sm:text-left"
            />
          </div>

          {/* Días de gracia */}
          <div className="config-field-row sm:flex-col sm:items-start sm:gap-1 sm:py-4">
            <div className="flex-1">
              <p className="config-field-label">Días de gracia</p>
              <p className="config-field-desc">Tras vencimiento</p>
            </div>
            <input
              type="number"
              min="0"
              max="30"
              value={form.diasGracia}
              onChange={(e) => setForm((f) => ({ ...f, diasGracia: parseInt(e.target.value, 10) || 0 }))}
              onFocus={(e) => e.target.select()}
              className="config-field-input sm:w-full sm:text-left"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function Usuarios() {
  const qc = useQueryClient();
  const [filtroEstado, setFiltroEstado]   = useState('');
  const [busqueda, setBusqueda]           = useState('');
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalSusc, setModalSusc]         = useState(null);

  // Config global para calcular acceso correctamente en la tabla
  const { data: configGlobal } = useConfigGlobal();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', filtroEstado, busqueda],
    queryFn: async () => {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (busqueda)     params.busqueda = busqueda;
      const { data } = await usuariosAPI.getAll(params);
      return data.data;
    },
  });

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }) => usuariosAPI.cambiarEstado(id, estado),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Estado actualizado'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al cambiar estado'),
  });

  const mutEliminar = useMutation({
    mutationFn: (id) => usuariosAPI.eliminar(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario eliminado'); setModalEliminar(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al eliminar'),
  });

  const pendientes = usuarios.filter((u) => u.estado === 'pendiente').length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h2 className="page-title">Gestión de usuarios</h2>
        <p className="page-subtitle">Aprobá solicitudes y administrá accesos y suscripciones</p>
      </div>

      {/* Panel de configuración global */}
      <PanelConfigGlobal />

      {/* Aviso pendientes */}
      {pendientes > 0 && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
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
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-field sm:max-w-xs"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="input-field sm:w-44 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="rechazado">Rechazado</option>
        </select>
        {(filtroEstado || busqueda) && (
          <button onClick={() => { setFiltroEstado(''); setBusqueda(''); }} className="text-sm text-gray-400 hover:text-gray-600 underline self-center">
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Usuario</th>
                <th className="table-th">Estado</th>
                <th className="table-th hidden sm:table-cell">Acceso</th>
                <th className="table-th hidden md:table-cell">Registrado</th>
                <th className="table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">Cargando...</td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                    No hay usuarios que coincidan
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const { estadoAcceso, diasRestantes } = calcularAcceso(u, configGlobal);
                  const accesoCfg = ACCESO_CONFIG[estadoAcceso] ?? ACCESO_CONFIG.sin_trial;

                  return (
                    <tr key={u._id} className="table-row">
                      <td className="table-td">
                        <p className="text-sm font-semibold text-gray-800">{u.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                      </td>

                      <td className="table-td">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADOS_BADGE[u.estado]}`}>
                          {u.estado.charAt(0).toUpperCase() + u.estado.slice(1)}
                        </span>
                      </td>

                      <td className="table-td hidden sm:table-cell">
                        <span className={`badge-acceso ${accesoCfg.cls}`}>
                          {accesoCfg.label}
                          {diasRestantes !== null && (
                            <span className="opacity-70">· {diasRestantes}d</span>
                          )}
                        </span>
                      </td>

                      <td className="table-td text-xs text-gray-400 hidden md:table-cell">
                        {new Date(u.creadoEn).toLocaleDateString('es-AR')}
                      </td>

                      <td className="table-td">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Estado */}
                          {u.estado === 'pendiente' && (
                            <button onClick={() => mutEstado.mutate({ id: u._id, estado: 'activo' })} disabled={mutEstado.isPending} className="btn btn-xs btn-success">
                              Aprobar
                            </button>
                          )}
                          {u.estado === 'activo' && (
                            <button onClick={() => mutEstado.mutate({ id: u._id, estado: 'inactivo' })} disabled={mutEstado.isPending} className="btn btn-xs btn-secondary">
                              Desactivar
                            </button>
                          )}
                          {(u.estado === 'inactivo' || u.estado === 'rechazado') && (
                            <button onClick={() => mutEstado.mutate({ id: u._id, estado: 'activo' })} disabled={mutEstado.isPending} className="btn btn-xs btn-ghost-blue">
                              Activar
                            </button>
                          )}

                          {/* Suscripción */}
                          <button onClick={() => setModalSusc(u)} className="btn btn-xs btn-ghost-gray">
                            💳 Susc.
                          </button>

                          {/* Eliminar */}
                          <button onClick={() => setModalEliminar(u)} className="btn btn-xs btn-ghost-red">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal suscripción */}
      {modalSusc && (
        <ModalSuscripcion
          usuario={modalSusc}
          onClose={() => setModalSusc(null)}
        />
      )}

      {/* Modal eliminar */}
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
