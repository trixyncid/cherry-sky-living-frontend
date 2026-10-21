/**
 * Property card image carousel
 * Cycles through all property images with prev/next controls.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface PropertyImageCarouselProps {
  images: string[];
  alt: string;
  href: string;
  className?: string;
}

export function PropertyImageCarousel({
  images,
  alt,
  href,
  className,
}: PropertyImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const slides = images.length > 0 ? images : [];
  const hasMultiple = slides.length > 1;
  const current = slides[index] ?? null;

  const goTo = (next: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!hasMultiple) return;

    const normalized = (next + slides.length) % slides.length;
    if (normalized === index) return;

    // Wrap: last → first slides forward; first → last slides backward
    if (index === slides.length - 1 && normalized === 0) {
      setDirection(1);
    } else if (index === 0 && normalized === slides.length - 1) {
      setDirection(-1);
    } else {
      setDirection(normalized > index ? 1 : -1);
    }
    setIndex(normalized);
  };

  return (
    <div
      className={cn(
        "relative h-56 w-full overflow-hidden bg-brand-soft",
        className,
      )}
    >
      {current ? (
        <Link href={href} className="absolute inset-0 block" tabIndex={-1}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? "35%" : "-35%",
                  opacity: 0,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                },
                exit: (dir: number) => ({
                  x: dir > 0 ? "-35%" : "35%",
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={current}
                alt={`${alt} — ${index + 1} of ${slides.length}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index === 0}
              />
            </motion.div>
          </AnimatePresence>
        </Link>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Icon name="image" size={48} className="text-fg-faint" />
        </div>
      )}

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={(e) => goTo(index - 1, e)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink/55 text-white backdrop-blur-sm transition-opacity hover:bg-ink/75 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          >
            <Icon name="chevron_left" size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => goTo(index + 1, e)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink/55 text-white backdrop-blur-sm transition-opacity hover:bg-ink/75 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          >
            <Icon name="chevron_right" size={20} />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
            {slides.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={(e) => goTo(i, e)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "pointer-events-auto h-1.5 rounded-full transition-all duration-300",
                  i === index
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/55 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
