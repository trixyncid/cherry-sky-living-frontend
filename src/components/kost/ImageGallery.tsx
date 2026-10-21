/**
 * Image Gallery Component
 * Interactive image gallery with main hero and thumbnail grid
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  variant?: "default" | "compact" | "mosaic";
  backHref?: string;
  backLabel?: string;
  header?: React.ReactNode;
}

export function ImageGallery({
  images,
  alt = "Room image",
  variant = "default",
  backHref,
  backLabel,
  header,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const openGallery = () => {
    track("gallery_open", { photos: images.length });
    setShowAllPhotos(true);
  };
  const t = useTranslations();

  const visibleThumbnails = images.slice(1, variant === "compact" ? 3 : 4);
  const remainingCount = Math.max(
    0,
    images.length - (variant === "compact" ? 4 : 4),
  );

  const isCompact = variant === "compact";
  const isMosaic = variant === "mosaic";
  const mosaicSideImages = images.slice(1, 3);
  const mosaicRemaining = Math.max(0, images.length - 3);

  return (
    <>
      <div
        className={cn(
          "space-y-4",
          isCompact && "space-y-3",
          isMosaic && "space-y-0",
        )}
      >
        {header}
        {!header && backHref && backLabel && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-fg-2 transition-colors hover:text-brand"
          >
            <Icon name="arrow_back" size={18} />
            {backLabel}
          </Link>
        )}

        {isMosaic ? (
          <div
            id="photos"
            className="grid h-[min(20rem,64vw)] grid-cols-4 grid-rows-2 gap-2 md:h-[min(30rem,36vw)]"
          >
            <button
              type="button"
              onClick={openGallery}
              className={cn(
                "relative overflow-hidden rounded-[1.25rem] bg-line",
                mosaicSideImages.length > 0
                  ? "col-span-4 md:col-span-2 md:row-span-2"
                  : "col-span-4 row-span-2",
              )}
            >
              <img
                src={images[0] || "/placeholder-room.jpg"}
                alt={alt}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </button>
            {mosaicSideImages.map((image, index) => {
              const isLast = index === mosaicSideImages.length - 1;
              return (
                <button
                  key={image}
                  type="button"
                  onClick={openGallery}
                  className={cn(
                    "relative col-span-2 overflow-hidden rounded-[1.25rem] bg-line md:col-span-1",
                    mosaicSideImages.length === 1 && "md:row-span-2",
                  )}
                >
                  <img
                    src={image}
                    alt={`${alt} ${index + 2}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {isLast && mosaicRemaining > 0 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[15px] font-semibold text-white">
                      {t("roomDetail.viewAllPhotos", {
                        count: images.length,
                      })}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            {/* Main Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative w-full cursor-pointer overflow-hidden rounded-2xl bg-hover group",
                isCompact
                  ? "aspect-[16/9] max-h-48 sm:max-h-56 md:max-h-64"
                  : "aspect-video",
              )}
              onClick={openGallery}
              whileHover={isCompact ? undefined : { scale: 1.02 }}
            >
              <img
                src={images[selectedIndex] || "/placeholder-room.jpg"}
                alt={`${alt} ${selectedIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="glass-chip absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/20">
                <Icon name="photo_library" size={14} />
                <span>
                  {t("roomDetail.viewAllPhotos", { count: images.length })}
                </span>
              </div>
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={cn(
                  "grid gap-2",
                  isCompact
                    ? "grid-cols-3 sm:grid-cols-4"
                    : "grid-cols-4 gap-4",
                )}
              >
                {visibleThumbnails.map((image, index) => {
                  const actualIndex = index + 1;
                  return (
                    <motion.div
                      key={actualIndex}
                      className={cn(
                        "relative cursor-pointer overflow-hidden rounded-xl bg-hover",
                        isCompact
                          ? "aspect-[4/3] max-h-16 sm:max-h-20"
                          : "aspect-[4/3]",
                        selectedIndex === actualIndex && "ring-2 ring-primary",
                      )}
                      onClick={() => setSelectedIndex(actualIndex)}
                      whileHover={isCompact ? undefined : { scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <img
                        src={image}
                        alt={`${alt} ${actualIndex + 1}`}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                    </motion.div>
                  );
                })}
                {remainingCount > 0 && (
                  <div
                    className={cn(
                      "flex cursor-pointer items-center justify-center rounded-xl bg-brand-soft transition-colors hover:bg-brand-soft",
                      isCompact
                        ? "aspect-[4/3] max-h-16 sm:max-h-20"
                        : "aspect-[4/3]",
                    )}
                    onClick={openGallery}
                  >
                    <span
                      className={cn(
                        "font-semibold text-fg-2",
                        isCompact ? "text-xs" : "text-sm",
                      )}
                    >
                      {t("roomDetail.morePhotos", { count: remainingCount })}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Full Screen Gallery Modal */}
      <AnimatePresence>
        {showAllPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
            onClick={() => setShowAllPhotos(false)}
          >
            <div className="relative h-full w-full flex items-center justify-center p-4">
              <button
                className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                onClick={() => setShowAllPhotos(false)}
              >
                <Icon name="close" size={24} />
              </button>
              <div className="max-w-6xl w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <motion.img
                      key={index}
                      src={image}
                      alt={`${alt} ${index + 1}`}
                      className="w-full aspect-video object-cover rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
