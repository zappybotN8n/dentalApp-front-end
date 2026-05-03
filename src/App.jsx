import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import NuevaPassword from './pages/NuevaPassword';
import Dashboard from './pages/Dashboard';
import Turnos from './pages/Turnos';
import Pacientes from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import Layout from './components/ui/Layout';
import LayoutSuperAdmin from './components/ui/LayoutSuperAdmin';
import Configuracion from './pages/Configuracion';
import Usuarios from './pages/Usuarios';
import AccesoExpirado from './pages/AccesoExpirado';
import ErrorBoundary from './components/ui/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } }
});

const Cargando = () => (
  <div className="flex items-center justify-center h-screen text-gray-500">Cargando...</div>
);

// Solo usuarios normales (no superadmin)
const PrivateRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol === 'superadmin') return <Navigate to="/usuarios" replace />;
  return children;
};

// Solo superadmin
const SuperAdminRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar" element={<RecuperarPassword />} />
            <Route path="/nueva-password/:token" element={<NuevaPassword />} />

            {/* Rutas superadmin — layout propio, solo gestión de usuarios */}
            <Route path="/" element={<SuperAdminRoute><LayoutSuperAdmin /></SuperAdminRoute>}>
              <Route path="usuarios" element={<Usuarios />} />
            </Route>

            {/* Pantalla de acceso expirado — autenticado pero sin Layout */}
            <Route path="/acceso-expirado" element={<PrivateRoute><AccesoExpirado /></PrivateRoute>} />

            {/* Rutas de consultorio — usuarios normales */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="turnos" element={<Turnos />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="pacientes/:id" element={<PacienteDetalle />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
