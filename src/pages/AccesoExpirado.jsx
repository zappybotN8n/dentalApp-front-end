import { useAuth } from '../context/AuthContext';

export default function AccesoExpirado() {
  const { usuario, logout } = useAuth();

  return (
    <div className="acceso-expirado-wrap">
      <div className="acceso-expirado-card">

        {/* Ícono */}
        <div className="acceso-expirado-icon">
          🔒
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="acceso-expirado-title">
            Tu período de acceso venció
          </h1>
          <p className="acceso-expirado-desc">
            Hola <strong>{usuario?.nombre}</strong>, el período de prueba gratuito finalizó.
            Para continuar usando DentalApp suscribite al plan mensual.
          </p>
        </div>

        {/* Beneficios */}
        <ul className="text-left text-sm text-gray-600 space-y-2 bg-gray-50 rounded-xl px-5 py-4">
          {[
            'Gestión ilimitada de turnos y pacientes',
            'Recordatorios automáticos por WhatsApp',
            'Fichas clínicas completas por paciente',
            'Soporte prioritario',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="space-y-3">
          <a
            href="mailto:soporte@dentalapp.com?subject=Quiero suscribirme a DentalApp"
            className="btn btn-md btn-primary w-full"
          >
            Contactar para suscribirme
          </a>
          <button
            onClick={logout}
            className="btn btn-md btn-secondary w-full"
          >
            Cerrar sesión
          </button>
        </div>

        <p className="text-xs text-gray-400">
          ¿Tenés un problema? Escribinos a{' '}
          <a href="mailto:soporte@dentalapp.com" className="text-blue-500 hover:underline">
            soporte@dentalapp.com
          </a>
        </p>

      </div>
    </div>
  );
}
