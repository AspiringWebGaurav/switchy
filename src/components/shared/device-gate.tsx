"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { APP_NAME } from "@/config/constants";

interface DeviceGateProps {
  children: ReactNode;
}

export function DeviceGate({ children }: DeviceGateProps) {
  return (
    <>
      {/* Desktop: show app */}
      <div className="hidden lg:contents">{children}</div>

      {/* Mobile/Tablet: show fallback */}
      <div className="flex lg:hidden min-h-screen items-center justify-center bg-stone-50 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
            <svg
              className="h-8 w-8 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-3">
            Desktop Only
          </h1>
          <p className="text-stone-600 text-base leading-relaxed mb-2">
            {APP_NAME} is currently optimized for desktop. Mobile support is coming
            soon.
          </p>
          <p className="text-stone-400 text-sm">
            We&apos;re working on the best experience for smaller screens.
          </p>
        </motion.div>
      </div>
    </>
  );
}
