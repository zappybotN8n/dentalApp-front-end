import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const DIAS_CAB = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export default function CalendarioInput({
  value,
  onChange,
  diasHabilitados = [0, 1, 2, 3, 4, 5, 6],
  fechasBloqueadas = [],
}) {
  const hoy         = dayjs().startOf('day');
  const seleccionado = value ? dayjs(value) : null;
  const [mes, setMes] = useState(seleccionado ?? hoy);

  const inicioMes    = mes.startOf('month');
  const totalDias    = mes.daysInMonth();
  const offsetInicio = inicioMes.day();

  const celdas = [];
  for (let i = 0; i < offsetInicio; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(inicioMes.date(d));

  const bloqueadasSet = new Set(fechasBloqueadas);
  const esBloqueado = (dia) =>
    dia.isBefore(hoy) ||
    !diasHabilitados.includes(dia.day()) ||
    bloqueadasSet.has(dia.format('YYYY-MM-DD'));

  const puedePrev = !mes.subtract(1, 'month').endOf('month').isBefore(hoy);

  return (
    <div className="select-none w-full">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => puedePrev && setMes(m => m.subtract(1, 'month'))}
          disabled={!puedePrev}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400
                     hover:text-gray-700 hover:bg-gray-100 disabled:opacity-25
                     disabled:cursor-not-allowed transition-colors text-base leading-none"
        >
          ‹
        </button>

        <span className="text-xs font-semibold text-gray-700 capitalize tracking-wide">
          {mes.format('MMMM YYYY')}
        </span>

        <button
          type="button"
          onClick={() => setMes(m => m.add(1, 'month'))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400
                     hover:text-gray-700 hover:bg-gray-100 transition-colors text-base leading-none"
        >
          ›
        </button>
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_CAB.map(d => (
          <div key={d} className="flex items-center justify-center h-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`v-${i}`} className="aspect-square" />;

          const bloqueado     = esBloqueado(dia);
          const esSeleccionado = seleccionado?.isSame(dia, 'day');
          const esHoyDia       = dia.isSame(hoy, 'day');

          return (
            <div key={dia.format('YYYY-MM-DD')} className="flex items-center justify-center aspect-square">
              <button
                type="button"
                disabled={bloqueado}
                onClick={() => onChange(dia.format('YYYY-MM-DD'))}
                className={[
                  'w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-100',
                  esSeleccionado
                    ? 'bg-blue-600 text-white shadow-sm'
                    : bloqueado
                    ? 'text-gray-300 cursor-not-allowed'
                    : esHoyDia
                    ? 'text-blue-600 font-bold hover:bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer',
                  !esSeleccionado && esHoyDia ? 'underline decoration-blue-400 underline-offset-2' : '',
                ].join(' ')}
              >
                {dia.date()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Fecha seleccionada */}
      {seleccionado && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-center">
          <span className="text-xs text-blue-600 font-medium capitalize">
            {seleccionado.format('dddd D [de] MMMM')}
          </span>
        </div>
      )}
    </div>
  );
}
