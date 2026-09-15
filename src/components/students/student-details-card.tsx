"use client";

import { Field, Input } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/display";
import type { StudentFormValues } from "./student-form-values";

interface Props {
  v: StudentFormValues;
  set: <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => void;
}

export function StudentDetailsCard({ v, set }: Props) {
  return (
    <Card>
      <CardHeader title="Student details" description="Personal and contact information." />
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="Father name">
          <Input value={v.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
        </Field>
        <Field label="Student phone" required>
          <Input value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03xx-xxxxxxx" required />
        </Field>
        <Field label="Father phone">
          <Input value={v.fatherPhone} onChange={(e) => set("fatherPhone", e.target.value)} placeholder="03xx-xxxxxxx" />
        </Field>
        <Field label="Email">
          <Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Address">
          <Input value={v.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
      </div>
    </Card>
  );
}
