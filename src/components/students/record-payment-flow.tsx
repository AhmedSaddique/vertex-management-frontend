"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { money } from "@/lib/format";
import type { Student, StudentListResponse } from "@/lib/types";
import { Button, Field, Select } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { PaymentDialog } from "./payment-dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Pick a student with an outstanding balance, then record a payment for them. */
export function RecordPaymentFlow({ open, onClose, onSaved }: Props) {
  const [pickId, setPickId] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const students = useFetch(
    () => (open ? api<StudentListResponse>("/students", { query: { status: "ACTIVE" } }) : Promise.resolve(null)),
    [open],
  );
  const unpaid = (students.data?.students ?? []).filter((s) => s.remaining > 0);

  function close() {
    setPickId("");
    setStudent(null);
    onClose();
  }

  if (student) {
    return (
      <PaymentDialog
        open
        onClose={close}
        onSaved={onSaved}
        student={{ id: student.id, name: student.name, remaining: student.remaining, shares: student.shares.map((sh) => ({ partnerName: sh.partner.name, percent: sh.percent })) }}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Record payment"
      description="Choose the student who is paying."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button disabled={!pickId} onClick={() => setStudent(unpaid.find((s) => s.id === pickId) ?? null)}>Continue</Button>
        </>
      }
    >
      <Field label="Student" hint={students.data && unpaid.length === 0 ? "All active students are fully paid." : undefined}>
        <Select value={pickId} onChange={(e) => setPickId(e.target.value)} disabled={students.loading}>
          <option value="">{students.loading ? "Loading students..." : "Select student"}</option>
          {unpaid.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.subject.name} · remaining {money(s.remaining)}</option>
          ))}
        </Select>
      </Field>
    </Dialog>
  );
}
