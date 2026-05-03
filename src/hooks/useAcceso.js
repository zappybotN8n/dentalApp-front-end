import { useQuery } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Retorna el estado de acceso del usuario autenticado.
 * estadoAcceso: 'trial' | 'suscripto' | 'gracia' | 'expirado' | 'exento' | 'libre' | 'superadmin'
 * diasRestantes: número o null
 * enGracia: boolean
 */
export const useAcceso = () => {
  const { usuario } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['acceso', usuario?._id],
    queryFn: async () => {
      const res = await authAPI.getAcceso();
      return res.data.data;
    },
    enabled: !!usuario && usuario.rol !== 'superadmin',
    staleTime: 5 * 60 * 1000, // 5 min — no cambia seguido
  });

  return {
    acceso: data ?? null,
    isLoading,
    estadoAcceso: data?.estadoAcceso ?? null,
    diasRestantes: data?.diasRestantes ?? null,
    enGracia: data?.enGracia ?? false,
    estaExpirado: data?.estadoAcceso === 'expirado',
    enTrial: data?.estadoAcceso === 'trial',
    enGraciaActivo: data?.estadoAcceso === 'gracia',
  };
};
