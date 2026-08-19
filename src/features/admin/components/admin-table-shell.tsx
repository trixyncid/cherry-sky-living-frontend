import { cn } from "@/lib/utils";

interface AdminTableShellProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AdminTableShell({
  children,
  footer,
  className,
}: AdminTableShellProps) {
  return (
    <div
      className={cn(
        "glass-panel flex flex-col overflow-hidden rounded-2xl",
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}
