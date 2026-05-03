import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAcceso } from '../../hooks/useAcceso';
import BannerTrial from './BannerTrial';

const IconCalendar = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const IconClock = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconTooth = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C9.5 2 7.5 3.5 6 5c-1 1-1.5 2-1.5 3.5 0 1.2.3 2.3.8 3.3L6.5 18c.3 1.2 1.3 2 2.5 2 .8 0 1.5-.4 2-1 .3-.4.7-.6 1-.6s.7.2 1 .6c.5.6 1.2 1 2 1 1.2 0 2.2-.8 2.5-2l1.2-6.2c.5-1 .8-2.1.8-3.3C19.5 5.2 16.5 2 12 2z" />
  </svg>
);

const navItems = [
  { to: '/dashboard', label: 'Agenda',        Icon: IconCalendar },
  { to: '/turnos',    label: 'Turnos',         Icon: IconClock    },
  { to: '/pacientes', label: 'Pacientes',      Icon: IconUsers    },
  { to: '/configuracion', label: 'Configuración', Icon: IconSettings },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const { estaExpirado, isLoading: cargandoAcceso } = useAcceso();

  // Redirigir si el acceso expiró (esperar a que cargue para no flashear)
  if (!cargandoAcceso && estaExpirado) {
    return <Navigate to="/acceso-expirado" replace />;
  }

  const handleLogout = () => { logout(); navigate('/login'); };
  const cerrarSidebar = () => setSidebarAbierto(false);

  const iniciales = usuario?.nombre
    ? usuario.nombre.charAt(0).toUpperCase() + (usuario.apellido?.charAt(0).toUpperCase() || '')
    : '?';

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Overlay mobile */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={cerrarSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-56 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>

        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <IconTooth />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-none">DentalApp</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-none">Gestión dental</p>
            </div>
          </div>
          <button
            onClick={cerrarSidebar}
            className="lg:hidden text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded"
          >
            ×
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={cerrarSidebar}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuario + Logout */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {iniciales}
            </div>
            <p className="text-xs text-gray-600 font-medium truncate">{usuario?.nombre}</p>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item nav-item-inactive text-gray-400 hover:text-red-600 hover:bg-red-50 w-full"
          >
            <IconLogout />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setSidebarAbierto(true)}
            className="text-gray-500 hover:text-gray-700 p-0.5"
            aria-label="Abrir menú"
          >
            <IconMenu />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white">
              <IconTooth />
            </div>
            <p className="text-sm font-bold text-gray-800">DentalApp</p>
          </div>
        </header>

        {/* Banner de trial/gracia — visible solo cuando aplica */}
        <BannerTrial />

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
