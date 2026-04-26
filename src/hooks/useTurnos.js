import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turnosAPI } from '../services/api';

export const useTurnosHoy = () =>
  useQuery({ queryKey: ['turnos', 'hoy'], queryFn: () => turnosAPI.getHoy().then(r => r.data.data) });

export const useTurnosSemana = () =>
  useQuery({ queryKey: ['turnos', 'semana'], queryFn: () => turnosAPI.getSemana().then(r => r.data.data) });

// Devuelve { data: turnos[], pagination: { total, page, limit, pages } }
export const useTurnos = (params) =>
  useQuery({
    queryKey: ['turnos', params],
    queryFn: () => turnosAPI.getAll(params).then(r => r.data)
  });

export const useTurno = (id) =>
  useQuery({ queryKey: ['turnos', id], queryFn: () => turnosAPI.getById(id).then(r => r.data.data), enabled: !!id });

export const useCrearTurno = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: turnosAPI.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] })
  });
};

export const useActualizarTurno = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => turnosAPI.actualizar(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] })
  });
};

export const useCambiarEstado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }) => turnosAPI.cambiarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] })
  });
};

export const useEliminarTurno = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: turnosAPI.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] })
  });
};
