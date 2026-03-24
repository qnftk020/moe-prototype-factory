"use client";

import { useState } from "react";

interface Props {
  onStart: (prompt: string, googleApiKey?: string) => void;
  disabled: boolean;
}

export default function InputArea({ onStart, disabled }: Props) {
  const [prompt, setPrompt] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleStart = () => {
    if (!prompt.trim() || disabled) return;
    onStart(prompt.trim(), apiKey.trim() || undefined);
  };

  return (
    <div className="mb-5 shrink-0">
      <div className="flex gap-2 items-stretch">
        <input
          className="flex-1 px-3.5 py-2.5 text-sm border border-[#e9e9e7] rounded-md outline-none text-[#37352f] bg-white placeholder:text-[#b4b4b0] focus:border-[#2383e2] focus:shadow-[0_0_0_3px_rgba(35,131,226,0.12)] transition-all"
          placeholder="어떤 앱을 만들고 싶으신가요? (예: 운동 기록 PWA, 가계부 앱...)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          disabled={disabled}
        />
        <button
          className="px-5 py-2.5 text-sm font-semibold border-none rounded-md bg-[#37352f] text-white cursor-pointer whitespace-nowrap hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleStart}
          disabled={disabled || !prompt.trim()}
        >
          {disabled ? "Running..." : "Generate"}
        </button>
      </div>
      <div className="flex items-center gap-3 mt-1.5 px-1">
        <p className="text-[11px] text-[#b4b4b0]">
          Gemini가 프레임워크와 디자인 스타일을 질문합니다
        </p>
        <button
          className="text-[11px] text-[#2383e2] hover:underline"
          onClick={() => setShowApiKey(!showApiKey)}
        >
          {showApiKey ? "API Key 접기" : "API Key 설정"}
        </button>
      </div>
      {showApiKey && (
        <div className="mt-2 flex gap-2 items-center">
          <input
            className="flex-1 px-3 py-1.5 text-xs border border-[#e9e9e7] rounded outline-none text-[#37352f] bg-[#f7f7f5] placeholder:text-[#b4b4b0] focus:border-[#2383e2] font-mono"
            type="password"
            placeholder="GOOGLE_API_KEY (생성 앱의 AI 기능용, 선택사항)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {apiKey && (
            <span className="text-[10px] text-[#0f7b6c]">설정됨</span>
          )}
        </div>
      )}
    </div>
  );
}
