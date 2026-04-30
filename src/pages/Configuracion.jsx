import { useEffect, useState, useMemo } from 'react';
import { useConfiguracion, useActualizarConfiguracion } from '../hooks/useConfiguracion';
import { DIAS_SEMANA, generarSlots } from '../utils/fechas';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const INTERVALOS = [
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
];

const DIAS_CAB = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

function CalendarioBloqueo({ bloqueadas, onToggle }) {
  const hoy = dayjs().startOf('day');
  const [mes, setMes] = useState(hoy);

  const inicioMes  = mes.startOf('month');
  const totalDias  = mes.daysInMonth();
  const offset     = inicioMes.day();

  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(inicioMes.date(d));

  const puedePrev = !mes.subtract(1, 'month').endOf('month').isBefore(hoy);

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white select-none max-w-xs">
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={() => puedePrev && setMes(m => m.subtract(1, 'month'))}
          disabled={!puedePrev}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >‹</button>
        <span className="text-xs font-semibold text-gray-700 capitalize">{mes.format('MMMM YYYY')}</span>
        <button
          type="button"
          onClick={() => setMes(m => m.add(1, 'month'))}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DIAS_CAB.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`v-${i}`} />;
          const pasado    = dia.isBefore(hoy);
          const fechaStr  = dia.format('YYYY-MM-DD');
          const bloqueado = bloqueadas.includes(fechaStr);
          const esHoy     = dia.isSame(hoy, 'day');

          return (
            <button
              key={fechaStr}
              type="button"
              disabled={pasado}
              onClick={() => onToggle(fechaStr)}
              title={bloqueado ? 'Click para desbloquear' : 'Click para bloquear'}
              className={[
                'text-xs w-full aspect-square flex items-center justify-center rounded-lg font-medium transition-colors',
                pasado
                  ? 'text-gray-200 cursor-not-allowed'
                  : bloqueado
                  ? 'bg-red-500 text-white'
                  : 'text-gray-700 hover:bg-red-50 cursor-pointer',
                esHoy && !bloqueado && !pasado ? 'ring-1 ring-blue-400' : '',
              ].join(' ')}
            >
              {dia.date()}
            </button>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-xs text-gray-400">Bloqueado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm ring-1 ring-blue-400" />
          <span className="text-xs text-gray-400">Hoy</span>
        </div>
      </div>
    </div>
  );
}

export default function Configuracion() {
  const { data: config, isLoading } = useConfiguracion();
  const actualizar = useActualizarConfiguracion();

  const [diasAtencion, setDiasAtencion]         = useState([1, 2, 3, 4, 5]);
  const [horarioInicio, setHorarioInicio]       = useState('08:00');
  const [horarioFin, setHorarioFin]             = useState('18:00');
  const [intervalo, setIntervalo]               = useState(30);
  const [duracionDefault, setDuracionDefault]   = useState(30);
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);

  useEffect(() => {
    if (config) {
      setDiasAtencion(config.diasAtencion);
      setHorarioInicio(config.horarioInicio);
      setHorarioFin(config.horarioFin);
      setIntervalo(config.intervalo);
      setDuracionDefault(config.duracionDefault);
      setFechasBloqueadas(
        (config.fechasBloqueadas || []).map(f => dayjs(f).format('YYYY-MM-DD'))
      );
    }
  }, [config]);

  const toggleDia = (val) =>
    setDiasAtencion(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    );

  const toggleFechaBloqueada = (fechaStr) =>
    setFechasBloqueadas(prev =>
      prev.includes(fechaStr) ? prev.filter(f => f !== fechaStr) : [...prev, fechaStr]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (horarioInicio >= horarioFin) {
      toast.error('El horario de inicio debe ser anterior al de fin.');
      return;
    }
    if (diasAtencion.length === 0) {
      toast.error('Seleccioná al menos un día de atención.');
      return;
    }
    try {
      await actualizar.mutateAsync({
        diasAtencion, horarioInicio, horarioFin, intervalo, duracionDefault, fechasBloqueadas
      });
      toast.success('Configuración guardada correctamente');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar la configuración.');
    }
  };

  const slotsPreview = horarioInicio < horarioFin
    ? generarSlots(horarioInicio, horarioFin, intervalo)
    : [];

  const bloqueadasOrdenadas = useMemo(
    () => [...fechasBloqueadas].sort(),
    [fechasBloqueadas]
  );

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Cargando configuración...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Configuración de atención</h2>
        <p className="text-sm text-gray-500 mt-0.5">Definí los días, horarios y fechas bloqueadas.</p>
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

        {/* Fechas bloqueadas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Fechas bloqueadas</h3>
          <p className="text-xs text-gray-400 mb-4">Hacé click en un día para bloquearlo (vacaciones, feriados). Click nuevamente para desbloquear.</p>
          <CalendarioBloqueo bloqueadas={fechasBloqueadas} onToggle={toggleFechaBloqueada} />
          {bloqueadasOrdenadas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {bloqueadasOrdenadas.map(f => (
                <span key={f} className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded-full">
                  {dayjs(f).format('D MMM YYYY')}
                  <button
                    type="button"
                    onClick={() => toggleFechaBloqueada(f)}
                    className="ml-0.5 text-red-400 hover:text-red-600"
                  >×</button>
                </span>
              ))}
            </div>
          )}
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
