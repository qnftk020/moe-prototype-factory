"use client";

import { useEffect, useState } from "react";

interface Project {
  name: string;
  path: string;
  has_claude_md: boolean;
  has_package: boolean;
  file_count: number;
  created_at: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ProjectHistory() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects`);
      if (res.ok) setProjects(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (projects.length === 0) return null;

  return (
    <div className="shrink-0">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchProjects(); }}
        className="text-[12px] text-[#787774] hover:text-[#37352f] transition-colors mb-2"
      >
        {open ? "▼" : "▶"} 이전 프로젝트 ({projects.length})
      </button>

      {open && (
        <div className="border border-[#e9e9e7] rounded-lg bg-white max-h-[200px] overflow-y-auto mb-3">
          {projects.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 hover:bg-[#f7f7f5] transition-colors border-b border-[#f0f0ee] last:border-b-0"
            >
              <div className="min-w-0">
                <div className="text-[12px] font-medium truncate text-[#37352f]">
                  {p.name}
                </div>
                <div className="text-[10px] text-[#b4b4b0]">
                  {p.created_at} · {p.file_count} files
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                {p.has_package && (
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`${BACKEND_URL}/api/launch`, {
                          method: "POST",
                          headers: {"Content-Type": "application/json"},
                          body: JSON.stringify({ prompt: p.path }),
                        });
                      } catch {}
                    }}
                    className="text-[9px] bg-[#dbeddb] text-[#0f7b6c] px-1.5 py-0.5 rounded font-semibold hover:bg-[#0f7b6c] hover:text-white transition-colors cursor-pointer"
                  >
                    Run
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
