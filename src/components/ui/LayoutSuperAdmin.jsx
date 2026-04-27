import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LayoutSuperAdmin() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🦷</span>
          <div>
            <h1 className="text-base font-semibold text-gray-800">DentalApp</h1>
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
              Superadmin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{usuario?.nombre}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
}
