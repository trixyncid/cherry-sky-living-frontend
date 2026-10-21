"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { forwardRef } from "react";
import { Icon } from "@/components/shared/Icon";
import { LOGIN_BACKGROUND_IMAGE } from "@/features/admin/login/constants";
import { Link } from "@/i18n/routing";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

export type LoginPortal = "admin" | "tenant";

/** Wordmark logo (burgundy on transparent), 720×205 px. */
const LOGO_SRC = "/brand/invoice-logo.png";

type AdminLoginShellProps = {
  children: React.ReactNode;
  portal: LoginPortal;
};

/**
 * Shared admin / tenant sign-in. Desktop: white form column (logo, portal
 * switch, form, help) beside a black photo panel with a burgundy glow.
 * Phones: a compact photo header above the form.
 */
export function AdminLoginShell({ children, portal }: AdminLoginShellProps) {
  const t = useTranslations("common.loginShell");
  const tLogin = useTranslations(
    portal === "admin" ? "admin.login" : "tenant.login",
  );
  const tWhatsapp = useTranslations("whatsapp");
  const isAdmin = portal === "admin";
  const headline = isAdmin ? t("adminHeadline") : t("tenantHeadline");
  const points = isAdmin
    ? [
        { icon: "rate_review", text: t("adminPoint1") },
        { icon: "autorenew", text: t("adminPoint2") },
        { icon: "account_balance_wallet", text: t("adminPoint3") },
      ]
    : [
        { icon: "receipt_long", text: t("tenantPoint1") },
        { icon: "upload_file", text: t("tenantPoint2") },
        { icon: "autorenew", text: t("tenantPoint3") },
      ];
  const helpUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    tWhatsapp("forgotPassword"),
  );

  return (
    <div className="min-h-dvh bg-white text-fg lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      {/* Phone header: photo strip */}
      <div className="relative h-44 overflow-hidden rounded-b-[2rem] bg-ink sm:h-52 lg:hidden">
        <Image
          src={LOGIN_BACKGROUND_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute inset-x-5 top-4 flex items-center justify-between">
          <BackLink label={t("backToWebsite")} onDark />
        </div>
        <p className="absolute inset-x-5 bottom-5 max-w-xs text-[1.35rem] font-medium leading-tight tracking-[-0.02em] text-white">
          {headline}
        </p>
      </div>

      {/* Form column */}
      <main className="flex min-h-[calc(100dvh-11rem)] flex-col px-5 pb-6 pt-6 sm:px-10 lg:min-h-dvh lg:px-14 lg:py-8 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Cherry Sky Living" className="shrink-0">
            <Image
              src={LOGO_SRC}
              alt="Cherry Sky Living"
              width={720}
              height={205}
              priority
              className="h-10 w-auto sm:h-11"
            />
          </Link>
          <div className="hidden lg:block">
            <BackLink label={t("backToWebsite")} />
          </div>
        </header>

        {/* Phones: form starts right under the logo; desktop: centred. */}
        <div className="flex flex-1 items-start pb-8 pt-7 lg:items-center lg:py-10">
          <div className="mx-auto w-full max-w-[25rem]">
            <h1 className="text-[clamp(1.85rem,3.4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.035em] text-ink">
              {t("welcome")}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
              {tLogin("subtitle")}
            </p>

            <div className="mt-8">{children}</div>

            <div className="mt-6 rounded-2xl border border-line bg-subtle px-4 py-3.5 text-sm">
              {isAdmin ? (
                <p className="flex items-start gap-2.5 text-fg-2">
                  <Icon
                    name="key"
                    size={18}
                    className="mt-0.5 shrink-0 text-brand"
                  />
                  {t("adminForgot")}
                </p>
              ) : (
                <p className="flex items-start gap-2.5 text-fg-2">
                  <Icon
                    name="help"
                    size={18}
                    className="mt-0.5 shrink-0 text-brand"
                  />
                  <span>
                    {t("tenantForgot")}{" "}
                    <a
                      href={helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand underline-offset-2 hover:underline"
                    >
                      {t("tenantForgotAction")}
                    </a>
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="lock" size={14} />
            {tLogin("securityNote")}
          </span>
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
        </footer>
      </main>

      {/* Desktop visual panel */}
      <aside className="relative hidden p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-[2rem] bg-ink">
          <Image
            src={LOGIN_BACKGROUND_IMAGE}
            alt=""
            fill
            priority
            sizes="52vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/25" />
          <div className="absolute -right-32 -top-32 size-[26rem] rounded-full bg-brand/35 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-80 rounded-full bg-brand/25 blur-3xl" />

          <div className="absolute inset-x-10 bottom-10 max-w-xl text-white xl:inset-x-14 xl:bottom-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-[13px] font-medium ring-1 ring-white/15 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-brand-bright" />
              {isAdmin ? t("adminEyebrow") : t("tenantEyebrow")}
            </span>
            <p className="mt-5 text-[clamp(2.1rem,3.3vw,3.2rem)] font-medium leading-[1.04] tracking-[-0.04em]">
              {headline}
            </p>
            <ul className="mt-8 grid gap-2.5">
              {points.map((point) => (
                <li
                  key={point.text}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3 text-[15px] ring-1 ring-white/10 backdrop-blur-md"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/80 text-white">
                    <Icon name={point.icon} size={18} />
                  </span>
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

function BackLink({ label, onDark }: { label: string; onDark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
        onDark
          ? "bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-white/25"
          : "text-fg-2 hover:bg-hover hover:text-fg",
      )}
    >
      <Icon name="arrow_back" size={18} />
      {label}
    </Link>
  );
}

type LoginFieldProps = {
  id: string;
  label: string;
  icon: string;
  trailing?: React.ReactNode;
} & Omit<React.ComponentProps<"input">, "id">;

/** Sign-in input: label, leading icon, optional trailing control. */
export const LoginField = forwardRef<HTMLInputElement, LoginFieldProps>(
  function LoginField({ id, label, icon, trailing, className, ...props }, ref) {
    return (
      <div>
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-fg">
          {label}
        </label>
        <div className="group relative">
          <Icon
            name={icon}
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-faint transition-colors group-focus-within:text-brand"
          />
          <input
            ref={ref}
            id={id}
            className={cn(
              "block h-[3.25rem] w-full rounded-2xl border border-line-strong bg-white pl-12 text-[15px] text-fg shadow-[0_1px_2px_rgb(11_11_13/0.04)] transition-[border-color,box-shadow] placeholder:text-fg-faint",
              "hover:border-fg-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10",
              trailing ? "pr-12" : "pr-4",
              className,
            )}
            {...props}
          />
          {trailing ? (
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              {trailing}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

/** Show / hide toggle for the password field. */
export function PasswordToggle({
  visible,
  onToggle,
  showLabel,
  hideLabel,
}: {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? hideLabel : showLabel}
      className="flex size-10 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-hover hover:text-fg"
    >
      <Icon name={visible ? "visibility_off" : "visibility"} size={20} />
    </button>
  );
}

/** Primary sign-in button with a spinner while submitting. */
export function LoginSubmit({
  pending,
  disabled,
  label,
  pendingLabel,
}: {
  pending: boolean;
  disabled?: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="group flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgb(11_11_13/0.6)] transition-[background-color,transform] hover:bg-brand active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {pending ? pendingLabel : label}
      {!pending ? (
        <Icon
          name="arrow_forward"
          size={18}
          className="transition-transform group-hover:translate-x-0.5"
        />
      ) : null}
    </button>
  );
}
