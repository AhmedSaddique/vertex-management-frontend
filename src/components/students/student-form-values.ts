import { dateInput } from "@/lib/format";
import type { Student } from "@/lib/types";
import type { ShareValue } from "./share-split-editor";
import type { InstallmentValue } from "./installment-plan-editor";

export interface StudentFormValues {
  name: string;
  fatherName: string;
  phone: string;
  fatherPhone: string;
  email: string;
  address: string;
  subjectId: string;
  teacherId: string;
  fee: string;
  discount: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  enrolledAt: string;
  notes: string;
  availableSlots: string[];
  shares: ShareValue[];
  installments: InstallmentValue[];
}

export function initialValues(initial?: Student): StudentFormValues {
  return {
    name: initial?.name ?? "",
    fatherName: initial?.fatherName ?? "",
    phone: initial?.phone ?? "",
    fatherPhone: initial?.fatherPhone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    subjectId: initial?.subjectId ?? "",
    teacherId: initial?.teacherId ?? "",
    fee: initial ? String(initial.fee) : "",
    discount: initial ? String(initial.discount) : "0",
    status: initial?.status ?? "ACTIVE",
    enrolledAt: dateInput(initial?.enrolledAt),
    notes: initial?.notes ?? "",
    availableSlots: initial?.availableSlots ?? [],
    shares: initial?.shares.map((s) => ({ partnerId: s.partnerId, percent: String(s.percent) })) ?? [],
    installments: [],
  };
}

export function finalPriceOf(v: StudentFormValues): number {
  return Math.max(0, (Number(v.fee) || 0) - (Number(v.discount) || 0));
}

export function toPayload(v: StudentFormValues, opts: { includeInstallments: boolean }) {
  return {
    name: v.name,
    fatherName: v.fatherName || null,
    phone: v.phone,
    fatherPhone: v.fatherPhone || null,
    email: v.email || null,
    address: v.address || null,
    subjectId: v.subjectId,
    teacherId: v.teacherId,
    fee: Number(v.fee) || 0,
    discount: Number(v.discount) || 0,
    status: v.status,
    enrolledAt: v.enrolledAt ? new Date(v.enrolledAt).toISOString() : undefined,
    notes: v.notes || null,
    availableSlots: v.availableSlots,
    shares: v.shares.map((s) => ({ partnerId: s.partnerId, percent: Number(s.percent) || 0 })).filter((s) => s.percent > 0),
    ...(opts.includeInstallments
      ? {
          installments: v.installments
            .filter((i) => i.dueDate && Number(i.amount) > 0)
            .map((i) => ({ dueDate: new Date(i.dueDate).toISOString(), amount: Number(i.amount), note: i.note || null })),
        }
      : {}),
  };
}
