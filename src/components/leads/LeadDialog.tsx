/**
 * Lead form in a dialog — used for "Join waitlist" on occupied rooms
 * and anywhere a compact trigger is needed.
 */

"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LeadForm, type LeadFormProps } from "@/components/leads/LeadForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LeadDialogProps extends Omit<LeadFormProps, "tone" | "className"> {
  trigger: ReactNode;
}

export function LeadDialog({ trigger, ...formProps }: LeadDialogProps) {
  const t = useTranslations("leads");
  const isWaitlist = formProps.type === "waitlist";

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-[1.75rem] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isWaitlist ? t("waitlist.title") : t("inquiry.title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isWaitlist
              ? formProps.roomName
                ? t("waitlist.description", {
                    room: [formProps.roomName, formProps.propertyName]
                      .filter(Boolean)
                      .join(", "),
                  })
                : t("waitlist.descriptionGeneric")
              : t("inquiry.description")}
          </DialogDescription>
        </DialogHeader>
        <LeadForm {...formProps} className="relative mt-2" />
      </DialogContent>
    </Dialog>
  );
}
