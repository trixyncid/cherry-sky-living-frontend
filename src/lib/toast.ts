import { toast as sonnerToast } from "sonner";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastOptions = {
  description?: string;
  duration?: number;
};

function show(variant: ToastVariant, message: string, options?: ToastOptions) {
  const payload = {
    description: options?.description,
    duration: options?.duration ?? 4000,
  };

  switch (variant) {
    case "success":
      return sonnerToast.success(message, payload);
    case "error":
      return sonnerToast.error(message, payload);
    case "warning":
      return sonnerToast.warning(message, payload);
    case "info":
      return sonnerToast.info(message, payload);
  }
}

/** Branded toast API — use across the app for consistent styling. */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    show("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    show("error", message, options),
  warning: (message: string, options?: ToastOptions) =>
    show("warning", message, options),
  info: (message: string, options?: ToastOptions) =>
    show("info", message, options),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
