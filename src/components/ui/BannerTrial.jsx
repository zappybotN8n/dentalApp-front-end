import { useAcceso } from '../../hooks/useAcceso';

const TEXTOS = {
  trial: (dias) => ({
    icono: '🕐',
    texto: dias === 1
      ? 'Último día de prueba gratuita'
      : `Prueba gratuita: ${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
    variante: dias <= 3 ? 'banner-trial-warn' : 'banner-trial-info',
  }),
  gracia: (dias) => ({
    icono: '⚠️',
    texto: dias === 1
      ? 'Período de gracia: último día'
      : `Período de gracia: ${dias} día${dias !== 1 ? 's' : ''} para suscribirte`,
    variante: 'banner-trial-grace',
  }),
};

export default function BannerTrial() {
  const { estadoAcceso, diasRestantes } = useAcceso();

  const config = TEXTOS[estadoAcceso]?.(diasRestantes ?? 0);
  if (!config) return null;

  return (
    <div className={`banner-trial ${config.variante}`}>
      <span className="banner-trial-text">
        <span>{config.icono}</span>
        <span>{config.texto}</span>
      </span>
      <a
        href="mailto:soporte@dentalapp.com?subject=Suscripción DentalApp"
        className="banner-trial-btn"
      >
        Suscribirme
      </a>
    </div>
  );
}
