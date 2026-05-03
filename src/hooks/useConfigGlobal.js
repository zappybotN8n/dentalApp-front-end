import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configGlobalAPI } from '../services/api';

export const useConfigGlobal = () => {
  return useQuery({
    queryKey: ['config-global'],
    queryFn: async () => {
      const { data } = await configGlobalAPI.get();
      return data.data;
    },
  });
};

export const useActualizarConfigGlobal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => configGlobalAPI.actualizar(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config-global'] }),
  });
};
