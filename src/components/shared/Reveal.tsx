/**
 * Reveal — subtle fade/slide on scroll; static for prefers-reduced-motion.
 */

"use client";

import { type HTMLMotionProps, motion, useReducedMotion } from "framer-motion";

export const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
}

export function Reveal({ delay = 0, y = 20, children, ...rest }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.7, ease: REVEAL_EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
