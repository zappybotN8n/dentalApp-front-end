import { z } from 'zod';

export const turnoSchema = z.object({
  paciente: z.string().min(1, 'Seleccioná un paciente'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  hora: z.string().min(1, 'La hora es obligatoria'),
  motivo: z.string().max(200, 'Máximo 200 caracteres').optional(),
  duracion: z.coerce.number().min(15, 'Mínimo 15 minutos').optional(),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

export const pacienteSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .max(15, 'Máximo 15 caracteres')
    .regex(/^\d{10,15}$/, 'Solo números sin espacios. Ej: 5493815551234'),
  dni: z
    .string()
    .max(8, 'Máximo 8 dígitos')
    .refine((v) => v === '' || /^\d{7,8}$/.test(v), 'DNI inválido (7 u 8 dígitos)')
    .optional(),
  email: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email inválido')
    .optional(),
  fechaNacimiento: z.string().optional(),
  obraSocial: z.string().max(80, 'Máximo 80 caracteres').optional(),
  numeroAfiliado: z.string().max(30, 'Máximo 30 caracteres').optional(),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

export const historialSchema = z.object({
  tratamiento: z.string().min(2, 'Descripción obligatoria (mínimo 2 caracteres)').max(300, 'Máximo 300 caracteres'),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
  costo: z.coerce.number().min(0, 'El costo no puede ser negativo').optional(),
  pagado: z.boolean().optional(),
});

export const recuperarPasswordSchema = z.object({
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres'),
});

export const nuevaPasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100, 'Máximo 100 caracteres'),
  confirmarPassword: z.string().max(100, 'Máximo 100 caracteres'),
}).refine((d) => d.password === d.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

export const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60, 'Máximo 60 caracteres'),
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100, 'Máximo 100 caracteres'),
  confirmarPassword: z.string().max(100, 'Máximo 100 caracteres'),
}).refine((d) => d.password === d.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});
