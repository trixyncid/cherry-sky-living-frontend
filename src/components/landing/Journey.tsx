/**
 * Property journey — the pinned scroll-video: street → lobby → lift →
 * corridor → room, with HTML captions timed to the footage.
 *
 *  scrub   desktop: scroll position drives video.currentTime (all-keyframe file)
 *  play    phones / iOS: entering a chapter plays that clip forward
 *  static  low-end / reduced motion: posters cross-fade, no video
 *
 * A property with no clips yet (Sky Kost) uses its exterior photo with a
 * slow push-in and the same captions. Captions are plain HTML over a scrim,
 * so price and the WhatsApp button never depend on video loading.
 */

"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { track } from "@/lib/analytics";
import { pick } from "@/lib/landing/schema";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import {
  type DeviceTier,
  heroRoom,
  monthlyPrice,
  type PropertyVM,
  trackWhatsApp,
  whatsappHref,
} from "./shared";

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Journey({
  vm,
  tier,
}: {
  vm: PropertyVM;
  tier: DeviceTier | null;
}) {
  const t = useTranslations("landing.journey");
  const locale = useLocale();
  const { media, overlays } = vm.content;
  const hasVideo = Boolean(media.journeyScrub) && media.chapters.length > 0;
  const mode: DeviceTier = !hasVideo || tier === null ? "static" : tier;

  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stillRefs = useRef<(HTMLImageElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [near, setNear] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Stills: chapter posters (+ the final frame), or just the exterior photo.
  const stills = useMemo(() => {
    const list: string[] = [];
    for (const c of media.chapters) {
      const clip = media.clips[c.role];
      const src = portrait
        ? (clip?.posterMobile ?? clip?.posterDesktop)
        : clip?.posterDesktop;
      if (src) list.push(src);
    }
    const lastClip =
      media.clips[media.chapters.at(-1)?.role ?? "journey-3-room"];
    const end = portrait
      ? (lastClip?.lastFrameMobile ?? lastClip?.lastFrameDesktop)
      : lastClip?.lastFrameDesktop;
    if (end && list.length > 0) list.push(end);
    return list.length > 0 ? list : [vm.content.exteriorPhoto];
  }, [media, portrait, vm.content.exteriorPhoto]);

  // Load media only when the journey is close to the viewport.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && setNear(true),
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll progress + the per-frame update (video time, stills, captions).
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    let smoothed = 0;
    let lastChapter = -1;
    const tick = () => {
      const p = progress.current;
      const v = video.current;

      if (mode === "scrub" && v && media.journeyScrub && v.readyState >= 2) {
        const target = p * (v.duration || media.journeyScrub.duration);
        smoothed += (target - smoothed) * 0.16;
        if (!v.seeking && Math.abs(v.currentTime - smoothed) > 0.02)
          v.currentTime = smoothed;
      }

      // Stills: cross-fade through the list; a single photo pushes in slowly.
      const n = stills.length;
      stillRefs.current.forEach((img, i) => {
        if (!img) return;
        if (n === 1) {
          img.style.opacity = "1";
          img.style.transform = `scale(${1.04 + p * 0.16})`;
          return;
        }
        const pos = p * (n - 1);
        img.style.opacity = String(clamp01(1 - Math.abs(pos - i)));
        img.style.transform = `scale(${1.02 + clamp01(pos - i + 1) * 0.05})`;
      });

      overlays.forEach((o, i) => {
        const el = overlayRefs.current[i];
        if (!el) return;
        const span = 0.1;
        const start = Math.max(0, o.at - span);
        const end = Math.min(1, o.at + span);
        const inn = start === 0 ? 1 : clamp01((p - start) / 0.04);
        const out = end === 1 ? 1 : clamp01((end - p) / 0.04);
        const a = Math.min(inn, out);
        el.style.opacity = String(a);
        el.style.transform = `translate3d(0, ${(1 - a) * 18}px, 0)`;
        el.style.pointerEvents = a > 0.6 ? "auto" : "none";
        el.setAttribute("aria-hidden", a > 0.6 ? "false" : "true");
      });

      if (bar.current) bar.current.style.transform = `scaleX(${p})`;

      const index = media.chapters.findIndex((c) => p >= c.start && p < c.end);
      const current =
        index === -1 ? (p >= 1 ? media.chapters.length - 1 : 0) : index;
      if (current !== lastChapter && ScrollTrigger.isInViewport(el)) {
        lastChapter = current;
        setChapter(current);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      trigger.kill();
    };
  }, [mode, media, overlays, stills]);

  // "play" tier: entering a chapter plays its clip forward.
  useEffect(() => {
    if (mode !== "play" || !near) return;
    const v = video.current;
    const role = media.chapters[chapter]?.role;
    const clip = role ? media.clips[role] : undefined;
    const src = portrait
      ? (clip?.mobilePlay ?? clip?.desktopPlay)
      : clip?.desktopPlay;
    if (!v || !src) return;
    if (!v.src.endsWith(src)) {
      v.poster = (portrait ? clip?.posterMobile : clip?.posterDesktop) ?? "";
      v.src = src;
    }
    v.currentTime = 0;
    v.play().catch(() => {
      // Autoplay refused (e.g. Low Power Mode): the poster stays up.
    });
  }, [mode, near, chapter, portrait, media]);

  useEffect(() => {
    if (!hasVideo) return;
    const role = media.chapters[chapter]?.role;
    if (role) track("journey_progress", { property: vm.key, chapter: role });
  }, [chapter, hasVideo, media.chapters, vm.key]);

  const room = heroRoom(vm);
  const waCtx = { property: vm, roomType: room?.name, section: "journey" };
  const firstClip = media.clips[media.chapters[0]?.role ?? "journey-1-arrival"];

  return (
    <section
      ref={section}
      id="journey"
      aria-label={t("label", { name: vm.name })}
      className="relative bg-ink text-white"
      style={{ height: hasVideo ? "520svh" : "260svh" }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Stills are always in the DOM: posters before video, and the fallback. */}
        {stills.map((src, i) => (
          // biome-ignore lint/performance/noImgElement: decorative layers driven per-frame; the first is preloaded as the poster
          <img
            key={src}
            ref={(el) => {
              stillRefs.current[i] = el;
            }}
            src={near || i === 0 ? src : undefined}
            alt=""
            aria-hidden
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{
              opacity: i === 0 ? 1 : 0,
              objectPosition: `${vm.content.exteriorFocal.x * 100}% center`,
            }}
          />
        ))}

        {mode !== "static" ? (
          <video
            ref={video}
            muted
            playsInline
            disablePictureInPicture
            aria-hidden
            tabIndex={-1}
            preload={mode === "scrub" && near ? "auto" : "none"}
            poster={firstClip?.posterDesktop}
            className="absolute inset-0 h-full w-full object-cover"
          >
            {mode === "scrub" && near && media.journeyScrub ? (
              <>
                <source src={media.journeyScrub.mp4} type="video/mp4" />
                {media.journeyScrub.webm ? (
                  <source src={media.journeyScrub.webm} type="video/webm" />
                ) : null}
              </>
            ) : null}
          </video>
        ) : null}

        {/* Scrim: keeps captions readable over any frame. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(22_16_38/0.88),rgb(22_16_38/0.35)_42%,transparent_70%)] lg:bg-[linear-gradient(75deg,rgb(22_16_38/0.82),rgb(22_16_38/0.3)_45%,transparent_70%)]" />

        <div className="absolute inset-0 mx-auto flex w-full max-w-[90rem] items-end px-5 pb-20 sm:px-8 lg:items-center lg:px-12 lg:pb-0">
          <div className="relative w-full max-w-xl">
            {overlays.map((o, i) => (
              <div
                key={`${o.kind}-${o.at}`}
                ref={(el) => {
                  overlayRefs.current[i] = el;
                }}
                className={cn(
                  "w-full will-change-transform",
                  i > 0 &&
                    "absolute bottom-0 left-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2",
                )}
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                {o.kind === "gate" ? (
                  <>
                    <p className="eyebrow flex items-center gap-4 text-white/75">
                      <span aria-hidden className="h-px w-10 bg-white/50" />
                      {pick(vm.content.area, locale)}
                    </p>
                    <h2 className="mt-5 text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
                      {vm.name}
                    </h2>
                    <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">
                      {pick(vm.content.tagline, locale)}
                    </p>
                    <p className="mt-8 inline-flex items-center gap-3 text-sm text-white/65">
                      <span className="story-scroll-cue" aria-hidden />
                      {t("scroll")}
                    </p>
                  </>
                ) : o.kind === "room" ? (
                  <div className="rounded-lg border border-white/15 bg-ink/75 p-6 backdrop-blur-xl sm:p-8">
                    <p className="eyebrow flex items-center gap-4 text-white/75">
                      <span aria-hidden className="h-px w-10 bg-white/50" />
                      {t("roomEyebrow")}
                    </p>
                    <h3 className="mt-4 text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-none tracking-[-0.035em]">
                      {room?.name ?? vm.name}
                    </h3>
                    <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-white/15 pb-4 text-white/80">
                      {room && monthlyPrice(room) > 0 ? (
                        <span className="text-2xl font-medium tabular-nums text-white">
                          {formatCurrency(monthlyPrice(room))}
                          <span className="text-base font-normal text-white/60">
                            {t("perMonth")}
                          </span>
                        </span>
                      ) : null}
                      {room?.size ? <span>{room.size} m²</span> : null}
                    </p>
                    {vm.content.heroRoomFeatures.length > 0 ? (
                      <ul className="mt-4 space-y-1.5 text-[15px] text-white/80">
                        {vm.content.heroRoomFeatures.map((f) => (
                          <li key={f.id} className="flex items-center gap-2">
                            <Icon
                              name="check"
                              size={16}
                              className="text-white/50"
                            />
                            {pick(f, locale)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={whatsappHref(waCtx, locale)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackWhatsApp(waCtx)}
                        className="btn btn-light"
                      >
                        <Icon name="whatsapp" size={18} />
                        {t("askRoom")}
                      </a>
                      <a href="#kamar" className="btn btn-outline-light">
                        {t("allRooms")}
                        <Icon name="arrow_downward" size={17} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="eyebrow flex items-center gap-4 text-white/75">
                      <span className="tabular-nums text-white">
                        {String(i).padStart(2, "0")}
                      </span>
                      <span aria-hidden className="h-px w-10 bg-white/50" />
                      {vm.name}
                    </p>
                    <h3 className="mt-5 text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-[1] tracking-[-0.04em]">
                      {pick(o.title, locale)}
                    </h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
                      {pick(o.body, locale)}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress + skip: nobody is forced through the animation. */}
        <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[90rem] items-center gap-6 px-5 pb-6 sm:px-8 lg:px-12">
          <div className="h-px flex-1 overflow-hidden bg-white/20">
            <div
              ref={bar}
              className="h-full origin-left bg-white"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <a
            href="#kamar"
            className="eyebrow shrink-0 text-[10px] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {t("skip")}
          </a>
        </div>
      </div>
    </section>
  );
}
