
export type TransactionType = 'income' | 'expense' | 'investment' | 'transfer';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currency: string;
  theme: 'dark' | 'light';
  password?: string;
}

export interface HealthThresholds {
  critical: number;
  attention: number;
  moderate: number;
  good: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon?: string;
}

export interface Bank {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'credit';
  balance: number;
  color: string;
  isActive?: boolean;
  cardBrand?: 'visa' | 'mastercard';
  creditCardDueDay?: number;
  creditCardClosingDay?: number;
  limit?: number;
}

export interface Investment {
  id: string;
  bankId: string;
  name: string;
  principal: number;
  rate: number;
  frequency: 'daily' | 'monthly' | 'yearly';
  startDate: string;
  color?: string;
  currentValue?: number; 
}

export interface Subscription {
  id: string;
  bankId: string;
  categoryId: string;
  name: string;
  amount: number;
  billingDay: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO String
  type: TransactionType;
  categoryId: string;
  bankId: string;
  toBankId?: string;
  
  // Credit Card & Installment Logic
  isCreditCard: boolean;
  isReconciled: boolean;
  installments?: number;
  installmentNumber?: number;
  originalTransactionId?: string;
  
  // Recurrence Logic
  recurrenceGroupId?: string;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // Invoice Reference (Competência)
  invoiceReference?: string; // Format: "YYYY-MM"
  isInvoicePayment?: boolean; // Flag to identify the payment transaction itself
  isChargeback?: boolean; // Identifies a refund/chargeback transaction
  
  isSubscriptionCharge?: boolean; // Flag to identify auto-generated subscription charges
  notes?: string;
}

export interface InvoiceStats {
  status: 'open' | 'closed' | 'paid' | 'partial' | 'future' | 'overdue';
  total: number;
  paidAmount: number;
  items: Transaction[];
  closingDate: Date;
  dueDate: Date;
  referenceMonth: string; // "YYYY-MM"
}

export interface DashboardStats {
  income: number;
  expenses: number;
  balance: number;
  investments: number;
  creditCardBill: number;
}

// Declarações para elementos JSX do React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      extrudeGeometry: any;
      meshPhysicalMaterial: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
    }
  }
}
