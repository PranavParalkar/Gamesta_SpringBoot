"use client";
import { useState } from "react";
import { FiPhone, FiMail, FiInstagram, FiX } from "react-icons/fi";

export default function ContactFloating() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed right-5 bottom-5 z-50">
        <button
          aria-label="Open contact"
          onClick={() => setOpen(true)}
          className="group relative inline-flex items-center focus:outline-none hover:scale-110 transition-transform"
        >
          <span className="absolute right-full mr-2 w-28 flex items-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none bg-black/80 text-white text-xs px-3 py-2 rounded-full shadow-lg">
            Contact us
          </span>

          <span className="md:w-14 md:h-14 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-600 to-violet-700 flex items-center justify-center text-white shadow-2xl transition-transform duration-200">
            <FiPhone className="w-6 h-6" />
          </span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex md:pt-0 pt-32 md:items-center justify-center pointer-events-none"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm pointer-events-auto"></div>

          {/* Panel */}
          <div
            className="relative w-full max-w-sm mx-4 mb-6 md:mb-0 rounded-2xl animate-in fade-in zoom-in-95 duration-300 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/70 to-white/30 dark:from-black/60 dark:to-black/40 shadow-xl backdrop-blur-md border border-white/20 dark:border-white/5">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Get in touch</h3>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Reach out via email, phone or Instagram</p>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="ml-3 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/5 transition"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-sm text-gray-800 dark:text-gray-200">
                  <a
                    href="mailto:Gamesta.mitaoe@gmail.com"
                    className="flex items-center gap-3 hover:opacity-80 transition"
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-pink-100 to-violet-100 text-pink-600 dark:bg-transparent dark:text-pink-400 shadow-sm">
                      <FiMail className="w-4 h-4" />
                    </span>
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                      Gamesta.mitaoe@gmail.com
                    </span>
                  </a>

                  <a
                    href="tel:+919173293748"
                    className="flex items-center gap-3 hover:opacity-80 transition"
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 dark:bg-transparent dark:text-purple-400 shadow-sm">
                      <FiPhone className="w-4 h-4" />
                    </span>
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">+91 9173293748</span>
                  </a>

                  <a
                    href="https://instagram.com/gamesta_mitaoe"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 hover:opacity-80 transition"
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-pink-50 to-fuchsia-50 text-pink-500 dark:bg-transparent dark:text-pink-300 shadow-sm">
                      <FiInstagram className="w-4 h-4" />
                    </span>
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">@gamesta_mitaoe</span>
                  </a>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="text-xs px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/30 hover:bg-white/80 transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Decorative accent */}
              <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 opacity-30 blur-3xl bg-gradient-to-br from-pink-400 to-violet-600 transform rotate-45" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
