"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { StudentDetail, Subject, Teacher } from "@/lib/types";
import { StudentForm, type StudentFormValues } from "@/components/students/student-form";
import { toPayload } from "@/components/students/student-form-values";
import { Alert, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";

export default function EditStudentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const student = useFetch(() => api<StudentDetail>(`/students/${params.id}`), [params.id]);
  const subjects = useFetch(() => api<Subject[]>("/subjects"), []);
  const teachers = useFetch(() => api<Teacher[]>("/teachers"), []);

  if (!isAdmin) return <Alert tone="error">Only administrators can edit students.</Alert>;

  async function submit(values: StudentFormValues) {
    setSubmitting(true);
    try {
      await api(`/students/${params.id}`, { method: "PUT", body: toPayload(values) });
      toast.success("Student updated");
      router.push(`/students/${params.id}`);
    } catch (err) {
      toast.error("Could not save student", errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Edit student" description={student.data?.name} backHref={`/students/${params.id}`} />
      {student.error ? (
        <ErrorBlock message={student.error} onRetry={student.reload} />
      ) : !student.data || !subjects.data || !teachers.data ? (
        <LoadingBlock />
      ) : (
        <StudentForm
          initial={student.data}
          subjects={subjects.data}
          teachers={teachers.data}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => router.push(`/students/${params.id}`)}
        />
      )}
    </div>
  );
}
