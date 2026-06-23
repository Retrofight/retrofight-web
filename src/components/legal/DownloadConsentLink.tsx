"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { downloadDisclaimerMarkdown } from "@/lib/legal/documents";
import { MarkdownDocument } from "./MarkdownDocument";

type DownloadConsentLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function DownloadConsentLink({
  href,
  className,
  children
}: DownloadConsentLinkProps) {
  const [open, setOpen] = useState(false);
  const agreeButtonRef = useRef<HTMLButtonElement>(null);
  const fileName = useMemo(() => {
    try {
      return new URL(href).pathname.split("/").pop() || "RetroFight download";
    } catch {
      return "RetroFight download";
    }
  }, [href]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    agreeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const startDownload = () => {
    setOpen(false);
    window.location.assign(href);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-disclaimer-title"
        >
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-brand-purple-500/30 bg-dark-card p-6 shadow-2xl shadow-black/70 sm:p-8">
            <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-5">
              <span className="font-pixel text-[9px] uppercase tracking-widest text-brand-purple-400">
                Download
              </span>
              <p className="font-mono text-xs text-zinc-500">{fileName}</p>
            </div>
            <div id="download-disclaimer-title">
              <MarkdownDocument markdown={downloadDisclaimerMarkdown} />
            </div>
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white/10 px-4 py-3 font-display text-xs font-bold uppercase italic text-zinc-200 transition hover:border-brand-purple-500 hover:text-white"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                ref={agreeButtonRef}
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-brand-purple-500 px-4 py-3 font-display text-xs font-black uppercase italic text-[#071116] transition hover:bg-[#67e8f9]"
                onClick={startDownload}
              >
                I UNDERSTAND AND AGREE
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
