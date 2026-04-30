import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const DIAS_CABECERA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export default function CalendarioInput({ value, onChange, diasHabilitados = [0,1,2,3,4,5,6], fechasBloqueadas = [] }) {
  const hoy = dayjs().startOf('day');
  const seleccionado = value ? dayjs(value) : null;
  const [mes, setMes] = useState(seleccionado ?? hoy);

  const inicioMes = mes.startOf('month');
  const totalDias = mes.daysInMonth();
  const offsetInicio = inicioMes.day(); // 0=Dom

  const celdas = [];
  for (let i = 0; i < offsetInicio; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(inicioMes.date(d));

  const bloqueadasSet = new Set(fechasBloqueadas);

  const esBloqueado = (dia) =>
    dia.isBefore(hoy) ||
    !diasHabilitados.includes(dia.day()) ||
    bloqueadasSet.has(dia.format('YYYY-MM-DD'));

  const irMesAnterior = () => {
    const anterior = mes.subtract(1, 'month');
    // No navegar a meses completamente pasados
    if (anterior.endOf('month').isBefore(hoy)) return;
    setMes(anterior);
  };

  const puedeMesAnterior = !mes.subtract(1, 'month').endOf('month').isBefore(hoy);

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white select-none">
      {/* Navegación mes */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={irMesAnterior}
          disabled={!puedeMesAnterior}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-gray-700 capitalize">
          {mes.format('MMMM YYYY')}
        </span>
        <button
          type="button"
          onClick={() => setMes(m => m.add(1, 'month'))}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_CABECERA.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`v-${i}`} />;

          const bloqueado = esBloqueado(dia);
          const esSeleccionado = seleccionado?.isSame(dia, 'day');
          const esHoyDia = dia.isSame(hoy, 'day');

          return (
            <button
              key={dia.format('YYYY-MM-DD')}
              type="button"
              disabled={bloqueado}
              onClick={() => onChange(dia.format('YYYY-MM-DD'))}
              className={[
                'text-xs w-full aspect-square flex items-center justify-center rounded-lg font-medium transition-colors',
                bloqueado
                  ? 'text-gray-200 cursor-not-allowed line-through'
                  : 'cursor-pointer',
                esSeleccionado
                  ? 'bg-blue-600 text-white'
                  : bloqueado
                  ? ''
                  : 'text-gray-700 hover:bg-blue-50',
                esHoyDia && !esSeleccionado
                  ? 'ring-1 ring-blue-400'
                  : '',
              ].join(' ')}
            >
              {dia.date()}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-3 px-1">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm ring-1 ring-blue-400" />
          <span className="text-xs text-gray-400">Hoy</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm text-gray-200 text-center leading-3 text-xs line-through font-bold">7</span>
          <span className="text-xs text-gray-400">Sin atención</span>
        </div>
      </div>
    </div>
  );
}
