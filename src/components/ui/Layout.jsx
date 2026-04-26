import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Agenda', icon: '📅' },
  { to: '/turnos', label: 'Turnos', icon: '🕐' },
  { to: '/pacientes', label: 'Pacientes', icon: '👥' },
  { to: '/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const cerrarSidebar = () => setSidebarAbierto(false);

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
        w-56 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-blue-700">🦷 DentalApp</h1>
            <p className="text-xs text-gray-500 mt-0.5">{usuario?.nombre}</p>
          </div>
          {/* Botón cerrar sidebar en mobile */}
          <button
            onClick={cerrarSidebar}
            className="lg:hidden text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Cerrar menú"
          >
            &times;
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={cerrarSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarAbierto(true)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-blue-700">🦷 DentalApp</h1>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
