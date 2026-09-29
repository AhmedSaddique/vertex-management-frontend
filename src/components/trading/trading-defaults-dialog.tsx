"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import type { Partner, TradingDefaults } from "@/lib/types";
import { Button } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { LoadingBlock } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { ShareSplitEditor, sharesTotal, type ShareValue } from "@/components/students/share-split-editor";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** The split applied to every new trading payout. */
export function TradingDefaultsDialog({ open, onClose, onSaved }: Props) {
  const toast = useToast();
  const partners = useFetch(() => (open ? api<Partner[]>("/partners") : Promise.resolve(null)), [open]);
  const defaults = useFetch(() => (open ? api<TradingDefaults>("/trading/defaults") : Promise.resolve(null)), [open]);
  const [value, setValue] = useState<ShareValue[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && defaults.data) setValue(defaults.data.shares.map((s) => ({ partnerId: s.partnerId, percent: String(s.percent) })));
  }, [open, defaults.data]);

  const over = sharesTotal(value) > 100;

  async function save() {
    if (over) return;
    setSaving(true);
    try {
      await api("/trading/defaults", {
        method: "PUT",
        body: { shares: value.map((v) => ({ partnerId: v.partnerId, percent: Number(v.percent) || 0 })) },
      });
      toast.success("Default trading split saved", "New trading payouts will use it.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not save the split", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Default trading split"
      description="Used when a new trading payout is recorded. Existing payouts keep the split they were saved with."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={over}>Save split</Button>
        </>
      }
    >
      {!partners.data || !defaults.data ? <LoadingBlock /> : <ShareSplitEditor partners={partners.data} value={value} onChange={setValue} />}
    </Dialog>
  );
}
