/**
 * Contact Page - Cherry Sky Living
 */

"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/sections/ContactForm";
import { ContactHero } from "@/components/sections/ContactHero";
import { ContactInfo } from "@/components/sections/ContactInfo";
import { ContactMap } from "@/components/sections/ContactMap";

export default function ContactPage() {
  return (
    <AppLayout>
      <ContactHero />

      <section className="w-full bg-[#faf9f6] px-6 py-20 lg:px-10">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
          <ContactForm />
          <ContactInfo />
        </div>
      </section>

      <ContactMap />
      <Footer />
    </AppLayout>
  );
}
