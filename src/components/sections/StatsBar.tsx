/**
 * Light four-column stats bar — shared by home intro and about
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

function AnimatedCounter({
  end,
  suffix = "",
  duration = 2,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easeOutCubic = 1 - (1 - progress) ** 3;
      setCount(Math.floor(easeOutCubic * end));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const t = useTranslations("about.stats");

  const stats = [
    { value: 98, suffix: "%", label: t("satisfactionRate") },
    { value: 3, suffix: "+", label: t("properties") },
    { value: 5, suffix: "+", label: t("yearsExperience") },
    { value: 500, suffix: "+", label: t("happyResidents") },
  ];

  return (
    <div className="grid grid-cols-2 gap-8 border-y border-[#e3e2e0] py-10 md:grid-cols-4 md:gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 }}
          className="text-center md:text-left"
        >
          <p className="text-3xl font-bold tracking-tight text-[#1a1c1a] lg:text-4xl">
            <AnimatedCounter end={stat.value} suffix={stat.suffix} />
          </p>
          <p className="mt-2 text-sm text-[#83746b]">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
