import dayjs from 'dayjs';
import 'dayjs/locale/es';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('es');

const TZ = 'America/Argentina/Buenos_Aires';

export const formatFecha = (fecha) => dayjs(fecha).tz(TZ).format('DD/MM/YYYY');
export const formatFechaCorta = (fecha) => dayjs(fecha).tz(TZ).format('DD/MM');
export const formatFechaInput = (fecha) => dayjs(fecha).tz(TZ).format('YYYY-MM-DD');
export const formatFechaLarga = (fecha) => dayjs(fecha).tz(TZ).format('dddd D [de] MMMM');
export const formatHora = (hora) => hora; // ya viene como "HH:mm"
export const formatFechaHora = (fecha, hora) => `${formatFecha(fecha)} ${hora}hs`;
export const esHoy = (fecha) => dayjs(fecha).tz(TZ).isSame(dayjs().tz(TZ), 'day');
export const fechaParaAPI = (fecha) => dayjs(fecha).tz(TZ).toISOString();
export const ahora = () => dayjs().tz(TZ);

export const generarSlots = (inicio, fin, intervalo) => {
  const slots = [];
  let [h, m] = inicio.split(':').map(Number);
  const [hFin, mFin] = fin.split(':').map(Number);
  const finMin = hFin * 60 + mFin;
  while (h * 60 + m < finMin) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += intervalo;
    h += Math.floor(m / 60);
    m = m % 60;
  }
  return slots;
};

export const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export const ESTADOS_TURNO = {
  pendiente:  { label: 'Pendiente',  color: 'bg-orange-100 text-orange-700' },
  confirmado: { label: 'Confirmado', color: 'bg-cyan-100   text-cyan-700'   },
  completado: { label: 'Completado', color: 'bg-green-100  text-green-700'  },
  cancelado:  { label: 'Cancelado',  color: 'bg-red-100    text-red-600'    },
  ausente:    { label: 'Ausente',    color: 'bg-gray-100   text-gray-500'   },
};

/* Borde izquierdo de color para tarjetas de turno */
export const ESTADO_BORDER_CLS = {
  pendiente:  'border-l-orange-400',
  confirmado: 'border-l-cyan-500',
  completado: 'border-l-green-500',
  cancelado:  'border-l-gray-300',
  ausente:    'border-l-gray-300',
};
