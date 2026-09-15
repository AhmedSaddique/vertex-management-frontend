"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { Student, Subject, Teacher } from "@/lib/types";
import { StudentForm, type StudentFormValues } from "@/components/students/student-form";
import { toPayload } from "@/components/students/student-form-values";
import { Alert, LoadingBlock, PageHeader } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";

export default function NewStudentPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const subjects = useFetch(() => api<Subject[]>("/subjects"), []);
  const teachers = useFetch(() => api<Teacher[]>("/teachers"), []);

  if (!isAdmin) return <Alert tone="error">Only administrators can add students.</Alert>;

  async function submit(values: StudentFormValues) {
    setSubmitting(true);
    try {
      const created = await api<Student>("/students", { method: "POST", body: toPayload(values) });
      toast.success("Student added", `${created.name} has been enrolled.`);
      router.push(`/students/${created.id}`);
    } catch (err) {
      toast.error("Could not add student", errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add student" description="Enroll a new student and set their fee." backHref="/students" />
      {!subjects.data || !teachers.data ? (
        <LoadingBlock />
      ) : (
        <StudentForm
          subjects={subjects.data}
          teachers={teachers.data}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => router.push("/students")}
        />
      )}
    </div>
  );
}
