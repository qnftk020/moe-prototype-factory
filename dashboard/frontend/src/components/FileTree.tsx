"use client";

import { FileNode } from "@/lib/types";

interface Props {
  tree: FileNode[];
}

function TreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const isDir = node.type === "directory";

  return (
    <>
      <div
        className="flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer hover:bg-[#f1f1ef] transition-colors"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <span className="text-sm flex-shrink-0 w-4 text-center">
          {isDir ? "📁" : "📄"}
        </span>
        <span className={`text-[#37352f] ${isDir ? "font-semibold" : ""}`}>
          {node.name}{isDir ? "/" : ""}
        </span>
        {node.is_new && (
          <span className="ml-auto text-[10px] bg-[#dbeddb] text-[#0f7b6c] px-1.5 rounded font-semibold">
            new
          </span>
        )}
      </div>
      {isDir &&
        node.children.map((child, i) => (
          <TreeItem key={`${child.name}-${i}`} node={child} depth={depth + 1} />
        ))}
    </>
  );
}

export default function FileTree({ tree }: Props) {
  return (
    <div className="border border-[#e9e9e7] rounded-lg overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b border-[#e9e9e7] bg-white text-[#787774]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.5 2A1.5 1.5 0 013 .5h4.293a1.5 1.5 0 011.06.44l1.208 1.207A1.5 1.5 0 0110.622 2.5H13A1.5 1.5 0 0114.5 4v8.5A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5V2z" />
        </svg>
        File tree
      </div>
      <div className="px-4 py-3 bg-white font-mono text-[12.5px] leading-[1.8] max-h-[300px] overflow-y-auto">
        {tree.length === 0 ? (
          <div className="text-[#b4b4b0] text-center py-4">
            아직 생성된 파일이 없습니다
          </div>
        ) : (
          tree.map((node, i) => (
            <TreeItem key={`${node.name}-${i}`} node={node} />
          ))
        )}
      </div>
    </div>
  );
}
