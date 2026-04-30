import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pacientesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const usePacientes = (params) => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['pacientes', usuario?._id, params],
    queryFn: () => pacientesAPI.getAll(params).then(r => r.data),
    enabled: !!usuario
  });
};

export const usePaciente = (id) => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['pacientes', usuario?._id, id],
    queryFn: () => pacientesAPI.getById(id).then(r => r.data.data),
    enabled: !!id && !!usuario
  });
};

export const useTurnosDePaciente = (id) => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['pacientes', usuario?._id, id, 'turnos'],
    queryFn: () => pacientesAPI.getTurnos(id).then(r => r.data.data),
    enabled: !!id && !!usuario
  });
};

export const useCrearPaciente = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacientesAPI.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacientes', usuario?._id] })
  });
};

export const useActualizarPaciente = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => pacientesAPI.actualizar(id, data),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['pacientes', usuario?._id, id] })
  });
};

export const useAgregarHistorial = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => pacientesAPI.agregarHistorial(id, data),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['pacientes', usuario?._id, id] })
  });
};

export const useActualizarHistorial = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, historialId, data }) => pacientesAPI.actualizarHistorial(id, historialId, data),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['pacientes', usuario?._id, id] })
  });
};
