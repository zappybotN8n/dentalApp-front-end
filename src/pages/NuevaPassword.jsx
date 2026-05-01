import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { nuevaPasswordSchema } from '../validations/schemas';
import { authAPI } from '../services/api';

export default function NuevaPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [errorServidor, setErrorServidor] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(nuevaPasswordSchema) });

  const onSubmit = async (data) => {
    setErrorServidor('');
    try {
      await authAPI.nuevaPassword(token, data.password);
      toast.success('Contraseña actualizada. Ya podés ingresar.');
      navigate('/login');
    } catch (err) {
      setErrorServidor(err.response?.data?.message || 'El enlace es inválido o ya expiró.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🦷</div>
          <h1 className="text-xl font-semibold text-gray-800">Nueva contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">Creá una nueva contraseña para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                {...register('password')}
                type={verPassword ? 'text' : 'password'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                tabIndex={-1}
              >
                {verPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <div className="relative">
              <input
                {...register('confirmarPassword')}
                type={verConfirmar ? 'text' : 'password'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repetí la contraseña"
              />
              <button
                type="button"
                onClick={() => setVerConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                tabIndex={-1}
              >
                {verConfirmar ? 'Ocultar' : 'Ver'}
              </button>
            </div>
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
            {isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
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
