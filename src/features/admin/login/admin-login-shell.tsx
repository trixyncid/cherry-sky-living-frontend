"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  ADMIN_LOGIN_BACKGROUND_IMAGE,
  ADMIN_LOGIN_LOGO_IMAGE,
} from "@/features/admin/login/constants";

export function AdminLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={ADMIN_LOGIN_BACKGROUND_IMAGE}
          alt=""
          fill
          priority
          className="object-cover opacity-[0.85]"
          sizes="100vw"
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#faf9f6]/90 via-ferrugem-soft/45 to-maroon/35 backdrop-blur-[2px]"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="glass-panel-strong rounded-[1.75rem] p-10"
          whileHover={{ boxShadow: "0 24px 48px -12px rgba(90, 36, 48, 0.18)" }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="mb-8 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <motion.div
              className="relative mb-4 size-16 overflow-hidden rounded-2xl border border-white/60 shadow-sm"
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              <Image
                src={ADMIN_LOGIN_LOGO_IMAGE}
                alt="Cherry Sky Living"
                fill
                className="object-cover"
                sizes="64px"
              />
            </motion.div>
          </motion.div>

          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
