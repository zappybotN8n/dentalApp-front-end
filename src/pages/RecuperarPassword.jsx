import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recuperarPasswordSchema } from '../validations/schemas';
import { authAPI } from '../services/api';
import Logo from '../components/ui/Logo';

export default function RecuperarPassword() {
  const [enviado, setEnviado] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(recuperarPasswordSchema) });

  const onSubmit = async (data) => {
    setErrorServidor('');
    try {
      await authAPI.recuperarPassword(data.email);
      setEnviado(true);
    } catch {
      setErrorServidor('Ocurrió un error. Intentá de nuevo más tarde.');
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Revisá tu email</h2>
          <p className="text-sm text-gray-500 mb-6">
            Si tu email está registrado, recibirás un enlace para restablecer tu contraseña.
            El enlace expira en <strong>1 hora</strong>.
          </p>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <Logo tagline="Ingresá tu email y te enviamos un enlace para restablecer tu contraseña" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              autoFocus
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
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
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
