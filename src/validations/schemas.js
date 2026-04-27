import { z } from 'zod';

export const turnoSchema = z.object({
  paciente: z.string().min(1, 'Seleccioná un paciente'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  hora: z.string().min(1, 'La hora es obligatoria'),
  motivo: z.string().optional(),
  duracion: z.coerce.number().min(15, 'Mínimo 15 minutos').optional(),
  notas: z.string().optional(),
});

export const pacienteSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres'),
  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^\d{10,15}$/, 'Solo números sin espacios. Ej: 5493815551234'),
  dni: z
    .string()
    .refine((v) => v === '' || /^\d{7,8}$/.test(v), 'DNI inválido (7 u 8 dígitos)')
    .optional(),
  email: z
    .string()
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email inválido')
    .optional(),
  fechaNacimiento: z.string().optional(),
  obraSocial: z.string().optional(),
  numeroAfiliado: z.string().optional(),
  notas: z.string().optional(),
});

export const historialSchema = z.object({
  tratamiento: z.string().min(2, 'Descripción obligatoria (mínimo 2 caracteres)'),
  notas: z.string().optional(),
  costo: z.coerce.number().min(0, 'El costo no puede ser negativo').optional(),
  pagado: z.boolean().optional(),
});

export const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmarPassword: z.string(),
  rol: z.enum(['admin', 'dentista', 'recepcion'], { errorMap: () => ({ message: 'Seleccioná un rol' }) }),
}).refine((d) => d.password === d.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});
