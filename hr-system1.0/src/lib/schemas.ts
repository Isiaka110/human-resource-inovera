// src/lib/schemas.ts

import * as z from 'zod';

// =========================================================
// 1. STAFF MANAGEMENT SCHEMAS
// =========================================================

export const StaffRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required.'),
  email: z.string().email('Invalid email address.').min(1, 'Email is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  roleId: z.string().min(1, 'Role selection is required.'), 
  jobTitle: z.string().optional().nullable().transform(e => e === '' ? null : e),
  department: z.string().optional().nullable().transform(e => e === '' ? null : e),
  phoneNumber: z.string().optional().nullable().transform(e => e === '' ? null : e),
});

export type StaffRegistrationFormValues = z.infer<typeof StaffRegistrationSchema>;


export const StaffEditSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required.'),
  roleId: z.string().min(1, 'Role selection is required.'), 
  jobTitle: z.string().optional().nullable().transform(e => e === '' ? null : e),
  department: z.string().optional().nullable().transform(e => e === '' ? null : e),
  phoneNumber: z.string().optional().nullable().transform(e => e === '' ? null : e),
  isActive: z.boolean(),
});

export type StaffEditFormValues = z.infer<typeof StaffEditSchema>;


// =========================================================
// 2. LEAVE MANAGEMENT SCHEMAS
// =========================================================

export const LeaveRequestSchema = z.object({
  typeId: z.string().min(1, 'Leave type is required.'),
  
  // FIX APPLIED: Using .nullable().refine() to resolve required_error TypeScript issue
  dateRange: z.object({
    from: z.date().nullable().refine(val => val !== null, {
        message: 'Start date is required.', 
    }),
    to: z.date().nullable().refine(val => val !== null, {
        message: 'End date is required.', 
    }),
  }).refine((data) => {
      if (!data.from || !data.to) return true;
      return data.from <= data.to;
  }, {
    message: 'End date cannot be before the start date.',
    path: ['to'],
  }),

  reason: z.string()
    .min(10, 'A detailed reason (min 10 characters) is required.')
    .max(500, 'Reason must be under 500 characters.'),
});

export type LeaveRequestFormValues = z.infer<typeof LeaveRequestSchema>;


// =========================================================
// 3. PROJECT & TASK SCHEMAS
// =========================================================

export const ProjectSchema = z.object({
  name: z.string().min(3, 'Project name is required.'),
  description: z.string().optional().nullable().transform(e => e === '' ? null : e),
  managerId: z.string().min(1, 'A Project Manager must be assigned.'), // MongoDB ID
  
  // FIX APPLIED: Using .nullable().refine() to resolve required_error TypeScript issue
  startDate: z.date().nullable().refine(val => val !== null, {
      message: 'Start date is required.',
  }),
  
  endDate: z.date().optional().nullable(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']), 
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;

export const TaskSchema = z.object({
  title: z.string().min(5, 'Task title is required.'),
  description: z.string().optional().nullable().transform(e => e === '' ? null : e),
  projectId: z.string().min(1, 'Project ID is required.'), // MongoDB ID
  assignedToUserId: z.string().min(1, 'An assignee is required.'), // MongoDB ID
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  status: z.enum(['To_Do', 'In_Progress', 'Testing', 'Done']).default('To_Do'), 
  dueDate: z.date().optional().nullable(),
});

export type TaskFormValues = z.infer<typeof TaskSchema>;