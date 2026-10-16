"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      position="top-center"
      duration={4000}
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
        success: null,
        info: null,
        warning: null,
        error: null,
        loading: null,
      }}
      style={
        {
          "--normal-bg": "rgb(255 255 255 / 0.62)",
          "--normal-text": "#1a1c1a",
          "--normal-border": "rgb(255 255 255 / 0.68)",
          "--border-radius": "1.75rem",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
