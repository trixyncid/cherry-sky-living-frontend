export function AdminAlert({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "info";
}) {
  return (
    <div
      role="alert"
      className={
        variant === "error"
          ? "rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive backdrop-blur-md"
          : "glass-panel-soft rounded-xl px-3 py-2 text-sm text-muted-foreground"
      }
    >
      {message}
    </div>
  );
}
