"use client";

import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsPhone } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Where a picker opens: an anchored popover on desktop, a bottom sheet on
 * phones (full width, never taller than the screen, actions in thumb reach).
 * Children receive `isPhone` so they can adapt (e.g. one month instead of two).
 */
export function PickerSurface({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  popoverClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  /** Screen-reader title for the phone sheet. */
  title: string;
  children: (isPhone: boolean) => ReactNode;
  popoverClassName?: string;
}) {
  const isPhone = useIsPhone();

  if (isPhone) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[92dvh] gap-0 overflow-y-auto overscroll-contain rounded-t-[1.5rem] border-line bg-white p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetDescription className="sr-only">{title}</SheetDescription>
          <span
            aria-hidden
            className="mx-auto mt-2.5 block h-1.5 w-10 shrink-0 rounded-full bg-line-strong"
          />
          {children(true)}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className={cn(
          "w-auto overflow-hidden rounded-[1.25rem] border border-line bg-white p-0 shadow-[0_24px_60px_-24px_rgb(11_11_13/0.35)]",
          popoverClassName,
        )}
      >
        {children(false)}
      </PopoverContent>
    </Popover>
  );
}
