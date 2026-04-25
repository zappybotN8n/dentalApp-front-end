import { useEffect, useState } from 'react';
import { useConfiguracion, useActualizarConfiguracion } from '../hooks/useConfiguracion';
import { DIAS_SEMANA, generarSlots } from '../utils/fechas';

const INTERVALOS = [
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
];

export default function Configuracion() {
  const { data: config, isLoading } = useConfiguracion();
  const actualizar = useActualizarConfiguracion();

  const [diasAtencion, setDiasAtencion] = useState([1, 2, 3, 4, 5]);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFin, setHorarioFin] = useState('18:00');
  const [intervalo, setIntervalo] = useState(30);
  const [duracionDefault, setDuracionDefault] = useState(30);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config) {
      setDiasAtencion(config.diasAtencion);
      setHorarioInicio(config.horarioInicio);
      setHorarioFin(config.horarioFin);
      setIntervalo(config.intervalo);
      setDuracionDefault(config.duracionDefault);
    }
  }, [config]);

  const toggleDia = (val) =>
    setDiasAtencion(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (horarioInicio >= horarioFin) {
      setError('El horario de inicio debe ser anterior al de fin.');
      return;
    }
    if (diasAtencion.length === 0) {
      setError('Seleccioná al menos un día de atención.');
      return;
    }
    try {
      await actualizar.mutateAsync({ diasAtencion, horarioInicio, horarioFin, intervalo, duracionDefault });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la configuración.');
    }
  };

  const slotsPreview = horarioInicio < horarioFin
    ? generarSlots(horarioInicio, horarioFin, intervalo)
    : [];

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Cargando configuración...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Configuración de atención</h2>
        <p className="text-sm text-gray-500 mt-0.5">Definí los días y horarios en que se pueden reservar turnos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Días de atención */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Días de atención</h3>
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map(({ value, label }) => {
              const activo = diasAtencion.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDia(value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    activo
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horario */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Horario de atención</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
              <input
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
              <input
                type="time"
                value={horarioFin}
                onChange={(e) => setHorarioFin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Turnos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Configuración de turnos</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Intervalo entre turnos</label>
              <select
                value={intervalo}
                onChange={(e) => setIntervalo(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {INTERVALOS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duración por defecto (min)</label>
              <input
                type="number"
                value={duracionDefault}
                min={15}
                max={120}
                step={15}
                onChange={(e) => setDuracionDefault(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Preview de slots */}
        {slotsPreview.length > 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Vista previa — {slotsPreview.length} turnos disponibles por día
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {slotsPreview.map(slot => (
                <span key={slot} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded font-mono">
                  {slot}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}

        {guardado && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            Configuración guardada correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={actualizar.isPending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {actualizar.isPending ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
