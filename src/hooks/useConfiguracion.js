import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useConfiguracion = () => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['configuracion', usuario?._id],
    queryFn: () => configuracionAPI.get().then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!usuario
  });
};

export const useActualizarConfiguracion = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: configuracionAPI.actualizar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracion', usuario?._id] })
  });
};
