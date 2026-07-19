"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors
      closeButton
      position="top-center"
      duration={4000}
      swipeDirections={["top"]}
      toastOptions={{}}
      icons={{
        success: null,
        info: null,
        warning: null,
        error: null,
        loading: null,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "#047857",
          "--success-border": "#047857",
          "--success-text": "#ffffff",
          "--error-bg": "#ba1a1a",
          "--error-border": "#ba1a1a",
          "--error-text": "#ffffff",
          "--warning-bg": "#b45309",
          "--warning-border": "#b45309",
          "--warning-text": "#ffffff",
          "--info-bg": "#415167",
          "--info-border": "#415167",
          "--info-text": "#ffffff",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
