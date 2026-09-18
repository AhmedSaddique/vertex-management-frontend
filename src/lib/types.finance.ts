import type { ClassMode, Installment, Partner, PartnerKind, PartnerRef, PartnerTotals, PaymentMethod, Student, StudentStatus } from "./types";

export interface PaymentShare {
  partnerId: string;
  partnerName: string;
  percent: number;
  amount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  teacherId: string;
  installmentId: string | null;
  amount: number;
  method: PaymentMethod;
  note: string | null;
  paidAt: string;
  shares: PaymentShare[];
  partnerShare: number;
  companyShare: number;
  installment?: { id: string; dueDate: string } | null;
  student?: { id: string; admissionNo?: number; name: string; phone?: string; classMode?: ClassMode; subject?: { name: string } };
  teacher?: { id: string; user: { name: string } };
}

export interface Payout {
  id: string;
  partnerId: string;
  amount: number;
  note: string | null;
  paidAt: string;
  partner?: PartnerRef;
}

export interface Expense {
  id: string;
  title: string;
  category: string | null;
  amount: number;
  spentAt: string;
  note: string | null;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  summary: { count: number; filteredTotal: number; total: number; thisMonth: number };
  categories: string[];
}

export interface MonthlyPoint {
  month: string;
  label: string;
  collected: number;
  partnerShare: number;
  companyShare: number;
  payouts: number;
  expenses: number;
}

export interface PartnerStudentRow {
  id: string;
  admissionNo: number;
  name: string;
  phone: string;
  status: StudentStatus;
  classMode: ClassMode;
  enrolledAt: string;
  subject: { id: string; name: string };
  teacher: { id: string; user: { name: string } };
  finalPrice: number;
  paid: number;
  remaining: number;
  percent: number;
  earned: number;
  projected: number;
}

export interface PartnerPaymentRow {
  id: string;
  paidAt: string;
  method: PaymentMethod;
  amount: number;
  student: { id: string; admissionNo?: number; name: string };
  percent: number;
  share: number;
}

export interface PartnerSummary {
  partner: Partner;
  totals: PartnerTotals;
  students: PartnerStudentRow[];
  payouts: Payout[];
  recentPayments: PartnerPaymentRow[];
  monthly: MonthlyPoint[];
}

export interface CompanyTotals {
  totalFinalPrice: number;
  totalCollected: number;
  totalOutstanding: number;
  partnerShare: number;
  companyShare: number;
  totalExpenses: number;
  companyBalance: number;
  totalPayouts: number;
  partnerBalanceOwed: number;
  netCash: number;
}

export interface DueList {
  items: Installment[];
  summary: { overdue: number; dueToday: number; upcoming: number; totalDue: number };
}

export interface SubjectStat {
  id: string;
  name: string;
  students: number;
  finalPrice: number;
  collected: number;
  remaining: number;
}

export interface DashboardPartner {
  id: string;
  name: string;
  kind: PartnerKind;
  isActive: boolean;
  teacherId: string | null;
  subjects: string[];
  totals: PartnerTotals;
}

export interface Dashboard {
  finance: CompanyTotals;
  students: { total: number; active: number; completed: number; dropped: number };
  bySubject: SubjectStat[];
  partners: DashboardPartner[];
  recentPayments: Payment[];
  recentStudents: Student[];
  monthly: MonthlyPoint[];
  due: DueList;
}

export interface StudentListResponse {
  students: Student[];
  summary: { count: number; totalFinalPrice: number; totalPaid: number; totalRemaining: number };
}

export interface PaymentListResponse {
  payments: Payment[];
  summary: { count: number; total: number; partnerShare: number; companyShare: number };
}
