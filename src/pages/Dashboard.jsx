import { useTurnosHoy } from '../hooks/useTurnos';
import { useCambiarEstado } from '../hooks/useTurnos';
import { formatFechaLarga, ESTADOS_TURNO } from '../utils/fechas';

const BADGE = ({ estado }) => {
  const { label, color } = ESTADOS_TURNO[estado] || {};
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
};

export default function Dashboard() {
  const { data: turnos = [], isLoading, error } = useTurnosHoy();
  const cambiarEstado = useCambiarEstado();

  const hoy = formatFechaLarga(new Date());
  const pendientes = turnos.filter(t => ['pendiente', 'confirmado'].includes(t.estado)).length;
  const completados = turnos.filter(t => t.estado === 'completado').length;

  const handleEstado = (id, estado) => cambiarEstado.mutate({ id, estado });

  if (isLoading) return <div className="p-8 text-gray-500">Cargando agenda...</div>;
  if (error) return <div className="p-8 text-red-500">Error al cargar la agenda</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 capitalize">{hoy}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{pendientes} pendiente{pendientes !== 1 ? 's' : ''} · {completados} completado{completados !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Turnos hoy', value: turnos.length, color: 'text-blue-600' },
          { label: 'Pendientes', value: pendientes, color: 'text-yellow-600' },
          { label: 'Completados', value: completados, color: 'text-green-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Lista de turnos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">Agenda del día</h3>
        </div>

        {turnos.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay turnos para hoy</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {turnos.map((turno) => (
              <li key={turno._id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-mono text-gray-500 w-12">{turno.hora}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {turno.paciente?.nombre} {turno.paciente?.apellido}
                  </p>
                  <p className="text-xs text-gray-500">{turno.motivo || 'Sin motivo'} · {turno.duracion}min</p>
                </div>
                <BADGE estado={turno.estado} />
                {turno.estado === 'confirmado' && (
                  <button
                    onClick={() => handleEstado(turno._id, 'completado')}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Completar
                  </button>
                )}
                {turno.estado === 'pendiente' && (
                  <button
                    onClick={() => handleEstado(turno._id, 'confirmado')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Confirmar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
