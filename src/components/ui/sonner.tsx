"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Icon } from "@/components/shared/Icon";

/**
 * App toaster in the dashboard card style (see `.cherry-toast` in
 * globals.css): white card, round status icon, title + description.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      position="top-center"
      duration={4000}
      gap={10}
      offset={{ top: 20 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      swipeDirections={["top"]}
      toastOptions={{
        classNames: {
          toast: "cherry-toast",
          title: "cherry-toast-title",
          description: "cherry-toast-description",
          closeButton: "cherry-toast-close",
          success: "cherry-toast--success",
          error: "cherry-toast--error",
          warning: "cherry-toast--warning",
          info: "cherry-toast--info",
        },
      }}
      icons={{
        success: <Icon name="check_circle" size={20} filled />,
        error: <Icon name="error" size={20} filled />,
        warning: <Icon name="warning" size={20} filled />,
        info: <Icon name="info" size={20} filled />,
        loading: <span className="cherry-toast-spinner" aria-hidden />,
      }}
      {...props}
    />
  );
};

export { Toaster };
