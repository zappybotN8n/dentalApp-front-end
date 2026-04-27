import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registroSchema } from '../validations/schemas';
import { authAPI } from '../services/api';

export default function Registro() {
  const [enviado, setEnviado] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registroSchema) });

  const onSubmit = async (data) => {
    setErrorServidor('');
    try {
      await authAPI.registro({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
      });
      setEnviado(true);
    } catch (err) {
      setErrorServidor(err.response?.data?.message || 'Error al enviar la solicitud');
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Solicitud enviada</h2>
          <p className="text-sm text-gray-500 mb-6">
            Tu solicitud fue recibida. El administrador la revisará y recibirás un email cuando sea aprobada.
          </p>
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🦷</div>
          <h1 className="text-xl font-semibold text-gray-800">Solicitar acceso</h1>
          <p className="text-sm text-gray-500 mt-1">Completá el formulario para pedir acceso a DentalApp</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              {...register('nombre')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan García"
            />
            {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="juan@ejemplo.com"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              {...register('confirmarPassword')}
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Repetí la contraseña"
            />
            {errors.confirmarPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.confirmarPassword.message}</p>
            )}
          </div>

          {errorServidor && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errorServidor}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg transition-colors text-sm"
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar acceso'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
