"use client";

import { useState } from "react";

interface Props {
  url: string | null;
}

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES: Record<Device, { width: string; height: string; label: string }> = {
  desktop: { width: "100%", height: "100%", label: "Desktop (1280px)" },
  tablet: { width: "768px", height: "1024px", label: "Tablet (768px)" },
  mobile: { width: "375px", height: "667px", label: "Mobile (375px)" },
};

export default function DevicePreview({ url }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [isOpen, setIsOpen] = useState(false);

  if (!url) return null;

  const size = DEVICE_SIZES[device];

  return (
    <div className="shrink-0">
      {/* Preview Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg bg-[#dbeddb] border border-[#0f7b6c]/20">
        <div className="w-2 h-2 rounded-full bg-[#0f7b6c] animate-pulse" />
        <span className="text-[13px] font-medium text-[#0f7b6c]">
          Prototype Running
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold text-[#0f7b6c] underline hover:opacity-80"
        >
          {url}
        </a>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Device Toggle */}
          {(["mobile", "tablet", "desktop"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => { setDevice(d); setIsOpen(true); }}
              className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${
                device === d && isOpen
                  ? "bg-[#0f7b6c] text-white"
                  : "bg-white text-[#0f7b6c] border border-[#0f7b6c]/30 hover:bg-[#0f7b6c]/10"
              }`}
            >
              {d === "mobile" ? "📱" : d === "tablet" ? "📟" : "🖥️"}
            </button>
          ))}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1 text-xs font-semibold bg-[#0f7b6c] text-white rounded hover:opacity-90 transition-opacity"
          >
            {isOpen ? "Preview 닫기" : "Preview 열기"}
          </button>
          <button
            onClick={() => window.open(url, "_blank")}
            className="px-3 py-1 text-xs font-semibold bg-white text-[#0f7b6c] border border-[#0f7b6c]/30 rounded hover:bg-[#0f7b6c]/10 transition-colors"
          >
            새 창
          </button>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/deploy`, { method: "POST" });
                const data = await res.json();
                if (data.url) {
                  window.open(data.url, "_blank");
                } else {
                  alert(data.message || "Deploy failed");
                }
              } catch { alert("Deploy failed — vercel CLI required"); }
            }}
            className="px-3 py-1 text-xs font-semibold bg-[#37352f] text-white rounded hover:opacity-90 transition-opacity"
          >
            Deploy
          </button>
        </div>
      </div>

      {/* Inline Preview */}
      {isOpen && (
        <div className="mb-3 rounded-lg border border-[#e9e9e7] overflow-hidden bg-[#f7f7f5]">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-[#e9e9e7]">
            <span className="text-[11px] text-[#787774]">
              {size.label}
            </span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#e03e3e]" />
              <div className="w-2 h-2 rounded-full bg-[#d9730d]" />
              <div className="w-2 h-2 rounded-full bg-[#0f7b6c]" />
            </div>
          </div>
          <div className="flex justify-center p-4 bg-[#f7f7f5]" style={{ minHeight: "400px" }}>
            <iframe
              src={url}
              style={{
                width: size.width,
                maxWidth: "100%",
                height: device === "desktop" ? "500px" : size.height,
                maxHeight: "600px",
              }}
              className="rounded border border-[#e9e9e7] bg-white shadow-md"
              title="App Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
