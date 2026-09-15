export type Role = "ADMIN" | "TEACHER";
export type StudentStatus = "ACTIVE" | "COMPLETED" | "DROPPED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ONLINE" | "OTHER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  teacherId: string | null;
}

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  teachers: { id: string; user: { name: string } }[];
  _count: { students: number };
}

export interface TeacherTotals {
  studentCount: number;
  activeStudentCount: number;
  totalFinalPrice: number;
  totalCollected: number;
  totalRemaining: number;
  projectedCommission: number;
  earnedCommission: number;
  pendingCommission: number;
  totalPaidOut: number;
  balance: number;
}

export interface Teacher {
  id: string;
  phone: string | null;
  defaultCommissionPercent: number;
  user: { id: string; name: string; email: string; isActive: boolean };
  subjects: { id: string; name: string }[];
  _count: { students: number };
  totals: TeacherTotals;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string | null;
  phone: string;
  fatherPhone: string | null;
  email: string | null;
  address: string | null;
  subjectId: string;
  teacherId: string;
  fee: number;
  discount: number;
  finalPrice: number;
  commissionPercent: number;
  status: StudentStatus;
  enrolledAt: string;
  notes: string | null;
  availableSlots: string[];
  createdAt: string;
  subject: { id: string; name: string };
  teacher: { id: string; user: { name: string }; defaultCommissionPercent?: number };
  paid: number;
  remaining: number;
  teacherShareEarned: number;
  teacherShareProjected: number;
}

export interface Payment {
  id: string;
  studentId: string;
  teacherId: string;
  amount: number;
  commissionPercent: number;
  method: PaymentMethod;
  note: string | null;
  paidAt: string;
  teacherShare: number;
  companyShare?: number;
  student?: { id: string; name: string; phone?: string; subject?: { name: string } };
  teacher?: { id: string; user: { name: string } };
}

export interface StudentDetail extends Student {
  payments: Payment[];
  classSlots: StudentClassSlot[];
}

export interface Payout {
  id: string;
  teacherId: string;
  amount: number;
  note: string | null;
  paidAt: string;
  teacher?: { id: string; user: { name: string } };
}

export interface MonthlyPoint {
  month: string;
  label: string;
  collected: number;
  teacherShare: number;
  companyShare: number;
  payouts: number;
}

export interface TeacherSummary {
  teacher: Teacher;
  totals: TeacherTotals;
  students: Student[];
  payouts: Payout[];
  recentPayments: Payment[];
  monthly: MonthlyPoint[];
}

export interface CompanyTotals {
  totalFinalPrice: number;
  totalCollected: number;
  totalOutstanding: number;
  teacherShare: number;
  companyShare: number;
  totalPayouts: number;
  teacherBalanceOwed: number;
  netCash: number;
}

export interface SubjectStat {
  id: string;
  name: string;
  students: number;
  finalPrice: number;
  collected: number;
  remaining: number;
}

export interface Dashboard {
  finance: CompanyTotals;
  students: { total: number; active: number; completed: number; dropped: number };
  bySubject: SubjectStat[];
  teachers: {
    id: string;
    name: string;
    subjects: string[];
    defaultCommissionPercent: number;
    totals: TeacherTotals;
  }[];
  recentPayments: Payment[];
  recentStudents: Student[];
  monthly: MonthlyPoint[];
}

export interface StudentListResponse {
  students: Student[];
  summary: { count: number; totalFinalPrice: number; totalPaid: number; totalRemaining: number };
}

export interface PaymentListResponse {
  payments: Payment[];
  summary: { count: number; total: number; teacherShare: number; companyShare: number };
}

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface ClassSlotStudent {
  id: string;
  name: string;
  fatherName: string | null;
  phone: string;
  fatherPhone: string | null;
  email: string | null;
  status: StudentStatus;
  teacherId: string;
  availableSlots: string[];
}

export interface ClassSlot {
  id: string;
  title: string | null;
  teacherId: string;
  subjectId: string;
  days: Weekday[];
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  teacher: { id: string; phone: string | null; user: { name: string; email: string } };
  subject: { id: string; name: string };
  students: ClassSlotStudent[];
}

export interface StudentClassSlot {
  id: string;
  title: string | null;
  days: Weekday[];
  startTime: string;
  endTime: string;
  location: string | null;
  isActive: boolean;
  teacher: { user: { name: string } };
  subject: { name: string };
}

export interface TimeSlot {
  start: string;
  end: string;
}
