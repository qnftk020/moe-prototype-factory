"use client";

import { Lang } from "@/lib/i18n";

interface Props {
  connected: boolean;
  onStop: () => void;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
}

export default function Topbar({ connected, onStop, lang, onLangChange }: Props) {
  return (
    <div className="flex items-center justify-between px-4 h-11 border-b border-[#e9e9e7] bg-white sticky top-0 z-50 shrink-0">
      <div className="flex items-center gap-2 text-sm text-[#787774]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-50">
          <path d="M2 3h12v1.5H2V3zm0 4.25h12v1.5H2v-1.5zm0 4.25h8v1.5H2v-1.5z" />
        </svg>
        <span className="font-medium text-[#37352f]">MoE MoE Prototyping</span>
        <span className="text-[#b4b4b0]">/</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#0f7b6c]" : "bg-[#e03e3e]"}`} />
          <span className="text-xs">{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Language Toggle */}
        <div className="flex items-center border border-[#e9e9e7] rounded overflow-hidden">
          <button
            onClick={() => onLangChange("ko")}
            className={`px-2 py-0.5 text-[10px] font-semibold transition-colors ${
              lang === "ko" ? "bg-[#37352f] text-white" : "bg-white text-[#787774] hover:bg-[#f1f1ef]"
            }`}
          >
            KO
          </button>
          <button
            onClick={() => onLangChange("en")}
            className={`px-2 py-0.5 text-[10px] font-semibold transition-colors ${
              lang === "en" ? "bg-[#37352f] text-white" : "bg-white text-[#787774] hover:bg-[#f1f1ef]"
            }`}
          >
            EN
          </button>
        </div>
        <button
          className="px-2 py-1 rounded text-xs border-none bg-transparent text-[#787774] cursor-pointer hover:bg-[#f1f1ef] transition-colors"
          onClick={onStop}
        >
          Stop
        </button>
        <a
          href="https://github.com/qnftk020/moe-moe-prototyping"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 rounded text-xs border-none bg-transparent text-[#787774] cursor-pointer hover:bg-[#f1f1ef] transition-colors no-underline"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
