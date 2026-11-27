/**
 * Landing page: hero + search → choose a property → that property's
 * scroll-video journey, rooms, facilities and closing → shared sections
 * (location, comparison, testimonials, FAQ, final CTA).
 *
 * `content` is the admin-managed copy/media (parsed, with fallbacks);
 * prices, rooms and availability come live from the catalogue.
 */

"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { HomeFaq } from "@/components/sections/HomeFaq";
import { track } from "@/lib/analytics";
import { useKosts } from "@/lib/hooks/use-kost-data";
import type { LandingContent, PropertyKey } from "@/lib/landing/schema";
import { SearchResults } from "./AvailabilitySearch";
import { ChooseHome } from "./ChooseHome";
import { ClosingBridge } from "./ClosingBridge";
import { Journey } from "./Journey";
import { LandingHero } from "./LandingHero";
import { RoomSelector } from "./RoomSelector";
import {
  Comparison,
  Facilities,
  FinalCta,
  Location,
  StickyBar,
  Testimonials,
} from "./Sections";
import { matchRooms, useSearchFilters } from "./search";
import { buildProperties, useDeviceTier } from "./shared";

gsap.registerPlugin(ScrollTrigger);

/** The active Lenis instance (desktop), so jumps go through it. */
let lenis: Lenis | null = null;

/** Scroll to a section once the layout that contains it has rendered. */
const scrollTo = (id: string) =>
  // After the layout refresh that follows a state change (see below), so
  // that refresh cannot interrupt the smooth scroll.
  window.setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    // Through Lenis on desktop so it does not fight the jump.
    if (lenis) lenis.scrollTo(top, { duration: 1.1, force: true });
    else window.scrollTo({ top, behavior: "smooth" });
  }, 380);

export function LandingView({ content }: { content: LandingContent }) {
  const { data: kosts, isLoading } = useKosts();
  const properties = useMemo(
    () => buildProperties(content.properties, kosts),
    [content.properties, kosts],
  );
  const tier = useDeviceTier();
  const { filters, update, ready } = useSearchFilters();

  const [selected, setSelected] = useState<PropertyKey | null>(null);
  // ?property=cherry|sky skips the choice screen and starts that journey.
  const [skipChoice, setSkipChoice] = useState(false);
  const [searched, setSearched] = useState(false);
  // Runs once, when the URL has been read.
  // biome-ignore lint/correctness/useExhaustiveDependencies: initial URL sync only
  useEffect(() => {
    if (!ready) return;
    if (filters.property !== "all" && selected === null) {
      setSelected(filters.property);
      setSkipChoice(true);
    }
    if (
      filters.roomType ||
      filters.budget ||
      filters.moveIn ||
      filters.duration ||
      filters.gender
    )
      setSearched(true);
  }, [ready]);

  // Smooth scroll on desktop (where video is scrubbed), wired to ScrollTrigger.
  useEffect(() => {
    if (tier !== "scrub") return;
    const instance = new Lenis({ lerp: 0.12, anchors: true });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      lenis = null;
    };
  }, [tier]);

  // Section heights change as data and the chosen property arrive.
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh on layout-changing state
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => window.clearTimeout(id);
  }, [selected, searched, isLoading, kosts.length]);

  const choose = useCallback(
    (key: PropertyKey) => {
      setSelected(key);
      update({ property: key, roomType: "" });
      track("property_selected", { property: key });
      scrollTo("journey");
    },
    [update],
  );

  const vm = properties.find((p) => p.key === selected);
  const other = properties.find((p) => p.key !== selected);
  const matches = useMemo(
    () => matchRooms(properties, filters),
    [properties, filters],
  );

  return (
    <PublicPageShell hideCta hideFloating>
      <LandingHero
        content={content}
        properties={properties}
        loading={isLoading}
        tier={tier}
        filters={filters}
        update={update}
        onSearch={() => {
          setSearched(true);
          scrollTo("hasil");
        }}
      />
      {searched ? (
        <SearchResults
          properties={properties}
          filters={filters}
          matches={matches}
          update={update}
          loading={isLoading}
        />
      ) : null}
      {skipChoice ? null : (
        <ChooseHome
          properties={properties}
          tier={tier}
          selected={selected ?? ""}
          onSelect={choose}
        />
      )}

      {vm ? (
        <div className="lp-theme" data-property={vm.key}>
          <Journey key={`journey-${vm.key}`} vm={vm} tier={tier} />
          <RoomSelector vm={vm} />
          <Facilities vm={vm} />
          <ClosingBridge
            key={`closing-${vm.key}`}
            vm={vm}
            other={other}
            tier={tier}
            onSwitch={() => other && choose(other.key)}
          />
        </div>
      ) : null}

      <Location properties={properties} landmarks={content.landmarks} />
      <div className="lp-theme" data-property={selected ?? "cherry"}>
        <Comparison properties={properties} landmarks={content.landmarks} />
        <Testimonials content={content} properties={properties} />
      </div>
      <HomeFaq />
      <FinalCta properties={properties} selected={vm} />
      <StickyBar selected={vm} />
    </PublicPageShell>
  );
}
