"use client";

import { useState } from "react";

type Props = {
  title: string;
  oneLiner: string;
  pitchId: string;
};

const BTN =
  "inline-flex items-center gap-1.5 rounded-lg border border-ink px-3 py-1.5 text-xs font-medium shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none";

export function ShareButtons({ title, oneLiner, pitchId }: Props) {
  const [copied, setCopied] = useState(false);

  const getUrl = () =>
    `${window.location.origin}/pitch/${pitchId}`;

  const shareText = `"${title}" — ${oneLiner}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl = () => {
    const params = new URLSearchParams({ text: shareText, url: getUrl() });
    return `https://twitter.com/intent/tweet?${params}`;
  };

  const linkedinUrl = () => {
    const params = new URLSearchParams({ url: getUrl() });
    return `https://www.linkedin.com/sharing/share-offsite/?${params}`;
  };

  const whatsappUrl = () => {
    const params = new URLSearchParams({ text: `${shareText} ${getUrl()}` });
    return `https://wa.me/?${params}`;
  };

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-muted">Partager</span>
      <button type="button" onClick={handleCopy} className={BTN}>
        {copied ? "Copié !" : "Lien"}
      </button>
      <a href={twitterUrl()} target="_blank" rel="noopener noreferrer" className={BTN}>
        X
      </a>
      <a href={linkedinUrl()} target="_blank" rel="noopener noreferrer" className={BTN}>
        LinkedIn
      </a>
      <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={BTN}>
        WhatsApp
      </a>
    </div>
  );
}
