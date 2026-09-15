import { dateInput } from "@/lib/format";
import type { Student } from "@/lib/types";

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
  commissionPercent: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  enrolledAt: string;
  notes: string;
  availableSlots: string[];
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
    commissionPercent: initial ? String(initial.commissionPercent) : "",
    status: initial?.status ?? "ACTIVE",
    enrolledAt: dateInput(initial?.enrolledAt),
    notes: initial?.notes ?? "",
    availableSlots: initial?.availableSlots ?? [],
  };
}

export function toPayload(v: StudentFormValues) {
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
    commissionPercent: v.commissionPercent === "" ? null : Number(v.commissionPercent),
    status: v.status,
    enrolledAt: v.enrolledAt ? new Date(v.enrolledAt).toISOString() : undefined,
    notes: v.notes || null,
    availableSlots: v.availableSlots,
  };
}
