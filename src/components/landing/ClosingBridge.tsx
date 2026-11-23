/**
 * Closing + bridge. The property's closing clip (day → night → rising into
 * the sky) scrubs on desktop and plays on phones; its last frames cross-fade
 * into the shader sky, which shifts from this property's palette to the
 * other's as the visitor scrolls on. CTA: see the other property.
 */

"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import type { DeviceTier, PropertyVM } from "./shared";

gsap.registerPlugin(ScrollTrigger);
const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const FADE_FROM = 0.68;

export function ClosingBridge({
  vm,
  other,
  tier,
  onSwitch,
}: {
  vm: PropertyVM;
  other?: PropertyVM;
  tier: DeviceTier | null;
  onSwitch: () => void;
}) {
  const t = useTranslations("landing.closing");
  const clip = vm.content.media.clips.closing;
  const scrub = vm.content.media.closingScrub;
  const mode: DeviceTier = !clip || tier === null ? "static" : tier;

  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const still = useRef<HTMLImageElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const tone = useRef(vm.key === "cherry" ? 1 : 0);
  const [near, setNear] = useState(false);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    setPortrait(window.matchMedia("(orientation: portrait)").matches);
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && setNear(true),
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const from = vm.key === "cherry" ? 1 : 0;
    let progress = 0;
    let smoothed = 0;
    let played = false;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress = self.progress;
      },
      onEnter: () => {
        // Phones: play the clip once when the section pins.
        const v = video.current;
        if (mode === "play" && v && !played) {
          played = true;
          v.play().catch(() => {});
        }
      },
    });
    const tick = () => {
      const v = video.current;
      const clipPart = clamp01(progress / FADE_FROM);
      if (mode === "scrub" && v && scrub && v.readyState >= 2) {
        smoothed +=
          (clipPart * (v.duration || scrub.duration) - smoothed) * 0.16;
        if (!v.seeking && Math.abs(v.currentTime - smoothed) > 0.02)
          v.currentTime = smoothed;
      }
      if (still.current)
        still.current.style.transform = `scale(${1.03 + clipPart * 0.12})`;
      const fade = clamp01((progress - FADE_FROM) / 0.14);
      if (sky.current) sky.current.style.opacity = String(fade);
      if (copy.current) {
        const a = clamp01((progress - FADE_FROM - 0.08) / 0.12);
        copy.current.style.opacity = String(a);
        copy.current.style.transform = `translate3d(0, ${(1 - a) * 20}px, 0)`;
        copy.current.style.pointerEvents = a > 0.5 ? "auto" : "none";
      }
      // Warm ↔ cool as the visitor scrolls toward the other property.
      tone.current = from + (1 - 2 * from) * clamp01((progress - 0.8) / 0.2);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      trigger.kill();
    };
  }, [mode, scrub, vm.key]);

  const poster =
    (portrait ? clip?.posterMobile : clip?.posterDesktop) ??
    vm.content.exteriorPhoto;
  const playSrc = portrait
    ? (clip?.mobilePlay ?? clip?.desktopPlay)
    : clip?.desktopPlay;

  return (
    <section
      ref={section}
      aria-labelledby="closing-heading"
      className="relative bg-ink text-white"
      style={{ height: clip ? "320svh" : "220svh" }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* biome-ignore lint/performance/noImgElement: decorative layer transformed per frame */}
        <img
          ref={still}
          src={near ? poster : undefined}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{
            objectPosition: `${(clip?.focal.x ?? vm.content.exteriorFocal.x) * 100}% center`,
          }}
        />
        {mode !== "static" && clip ? (
          <video
            ref={video}
            muted
            playsInline
            disablePictureInPicture
            aria-hidden
            tabIndex={-1}
            preload={near ? "auto" : "none"}
            poster={poster}
            className="absolute inset-0 h-full w-full object-cover"
          >
            {near && mode === "scrub" && scrub ? (
              <source src={scrub.mp4} type="video/mp4" />
            ) : null}
            {near && mode === "play" && playSrc ? (
              <source src={playSrc} type="video/mp4" />
            ) : null}
          </video>
        ) : null}

        <div ref={sky} className="absolute inset-0" style={{ opacity: 0 }}>
          <div className="story-sky-fallback absolute inset-0" />
          {near && tier !== "static" ? <SkyCanvas tone={tone} /> : null}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_13/0.6),transparent_50%)]" />

        <div
          ref={copy}
          className="absolute inset-0 flex items-center justify-center px-5 text-center"
          style={{ opacity: 0 }}
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              {t("eyebrow", { name: vm.name })}
            </p>
            <h2
              id="closing-heading"
              className="mt-4 text-[clamp(2.2rem,4.4vw,3.8rem)] font-semibold leading-[1.03] tracking-[-0.035em]"
            >
              {t("titleLead")}{" "}
              <span className="font-display font-normal italic">
                {t("titleAccent")}
              </span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {other ? (
                <button
                  type="button"
                  onClick={onSwitch}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-ink hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  {t("other", { name: other.name })}
                  <Icon name="arrow_forward" size={18} />
                </button>
              ) : null}
              <a
                href="#lokasi"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 text-[15px] font-semibold backdrop-blur-md hover:bg-white hover:text-ink"
              >
                {t("continue")}
                <Icon name="arrow_downward" size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
