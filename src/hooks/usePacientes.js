import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pacientesAPI } from '../services/api';

export const usePacientes = (params) =>
  useQuery({ queryKey: ['pacientes', params], queryFn: () => pacientesAPI.getAll(params).then(r => r.data) });

export const usePaciente = (id) =>
  useQuery({ queryKey: ['pacientes', id], queryFn: () => pacientesAPI.getById(id).then(r => r.data.data), enabled: !!id });

export const useTurnosDePaciente = (id) =>
  useQuery({ queryKey: ['pacientes', id, 'turnos'], queryFn: () => pacientesAPI.getTurnos(id).then(r => r.data.data), enabled: !!id });

export const useCrearPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacientesAPI.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacientes'] })
  });
};

export const useActualizarPaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => pacientesAPI.actualizar(id, data),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['pacientes', id] })
  });
};

export const useAgregarHistorial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => pacientesAPI.agregarHistorial(id, data),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['pacientes', id] })
  });
};
