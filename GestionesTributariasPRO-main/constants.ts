import { Client, Task, DeclarationStatus, ClientCategory, TaskStatus, Declaration, TaxRegime, RentaCategory } from './types';
import { v4 as uuidv4 } from 'uuid';

export const SRI_DUE_DATES: { [key: number]: number } = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18,
  6: 20,
  7: 22,
  8: 24,
  9: 26,
  0: 28,
};

// Months for annual income tax declarations (0-indexed)
export const SRI_RENTA_GENERAL_MARCH = 2; // March
export const SRI_RENTA_NP_MAY = 4;        // May


export const mockClients: Client[] = [];

export const mockTasks: Task[] = [];