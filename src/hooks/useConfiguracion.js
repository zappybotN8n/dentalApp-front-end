import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracionAPI } from '../services/api';

export const useConfiguracion = () =>
  useQuery({
    queryKey: ['configuracion'],
    queryFn: () => configuracionAPI.get().then(r => r.data.data),
    staleTime: 1000 * 60 * 5
  });

export const useActualizarConfiguracion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: configuracionAPI.actualizar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracion'] })
  });
};
