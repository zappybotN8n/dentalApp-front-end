import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turnosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useTurnosHoy = () => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['turnos', usuario?._id, 'hoy'],
    queryFn: () => turnosAPI.getHoy().then(r => r.data.data),
    enabled: !!usuario
  });
};

export const useTurnosSemana = () => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['turnos', usuario?._id, 'semana'],
    queryFn: () => turnosAPI.getSemana().then(r => r.data.data),
    enabled: !!usuario
  });
};

// Devuelve { data: turnos[], pagination: { total, page, limit, pages } }
export const useTurnos = (params) => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['turnos', usuario?._id, params],
    queryFn: () => turnosAPI.getAll(params).then(r => r.data),
    enabled: !!usuario
  });
};

export const useTurno = (id) => {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['turnos', usuario?._id, id],
    queryFn: () => turnosAPI.getById(id).then(r => r.data.data),
    enabled: !!id && !!usuario
  });
};

export const useCrearTurno = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: turnosAPI.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos', usuario?._id] })
  });
};

export const useActualizarTurno = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => turnosAPI.actualizar(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos', usuario?._id] })
  });
};

export const useCambiarEstado = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }) => turnosAPI.cambiarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos', usuario?._id] })
  });
};

export const useEliminarTurno = () => {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: turnosAPI.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos', usuario?._id] })
  });
};
