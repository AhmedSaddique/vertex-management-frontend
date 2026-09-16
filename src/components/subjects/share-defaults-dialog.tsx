"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import type { Partner, Subject } from "@/lib/types";
import { Button } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { LoadingBlock } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { ShareSplitEditor, sharesTotal, type ShareValue } from "@/components/students/share-split-editor";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  subject: Subject | null;
}

/** Default fee split applied to new students of a subject. */
export function ShareDefaultsDialog({ open, onClose, onSaved, subject }: Props) {
  const toast = useToast();
  const partners = useFetch(() => (open ? api<Partner[]>("/partners") : Promise.resolve(null)), [open]);
  const [value, setValue] = useState<ShareValue[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && subject) setValue(subject.shareDefaults.map((d) => ({ partnerId: d.partnerId, percent: String(d.percent) })));
  }, [open, subject]);

  const over = sharesTotal(value) > 100;

  async function save() {
    if (!subject || over) return;
    setSaving(true);
    try {
      await api(`/subjects/${subject.id}/share-defaults`, { method: "PUT", body: { shares: value.map((v) => ({ partnerId: v.partnerId, percent: Number(v.percent) || 0 })) } });
      toast.success("Default split saved", `New ${subject.name} students will use this split.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not save split", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Default split for ${subject?.name ?? ""}`}
      description="Used when a new student of this subject is added. Existing students keep their own split. The remainder is the company share."
      size="sm"
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={save} loading={saving} disabled={over}>Save split</Button></>}
    >
      {!partners.data ? <LoadingBlock /> : <ShareSplitEditor partners={partners.data} value={value} onChange={setValue} />}
    </Dialog>
  );
}
