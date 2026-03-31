"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AnalysisRecord {
  id: string;
  created_at: string;
  report_data: {
    summary?: string;
    findings?: { status: "red" | "yellow" | "green" }[];
  };
}

interface Props {
  records: AnalysisRecord[];
}

export default function HistoryList({ records }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev; // 最多选 2 条
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selected.length === 2) {
      router.push(`/compare?a=${selected[0]}&b=${selected[1]}`);
    }
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
                     00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">暂无历史记录</p>
        <p className="text-gray-300 text-xs mt-1">完成一次 AI 分析后将在此显示</p>
        <Link href="/" className="text-blue-600 text-sm mt-4 inline-block">
          立即开始分析 →
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* 对比提示 */}
      <p className="text-xs text-gray-400">
        {selected.length === 0
          ? "勾选两条记录可进行干预前后对比"
          : selected.length === 1
          ? "再选一条记录即可对比"
          : "已选 2 条，点击下方按钮开始对比"}
      </p>

      {/* 记录列表 */}
      <div className="space-y-3">
        {records.map((item, idx) => {
          const findings = item.report_data?.findings ?? [];
          const redCount    = findings.filter(f => f.status === "red").length;
          const yellowCount = findings.filter(f => f.status === "yellow").length;
          const isSelected  = selected.includes(item.id);
          const isDisabled  = selected.length >= 2 && !isSelected;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3
                          transition-all ${isSelected ? "border-blue-400 ring-1 ring-blue-300" : "border-gray-100"}
                          ${isDisabled ? "opacity-40" : ""}`}
            >
              {/* 勾选框 */}
              <button
                onClick={() => !isDisabled && toggle(item.id)}
                disabled={isDisabled}
                className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center
                            transition-colors ${isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 hover:border-blue-400"}`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* 内容（点击跳报告详情） */}
              <Link href={`/report/${item.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">#{idx + 1}</span>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(item.created_at).toLocaleString("zh-CN", {
                      year: "numeric", month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {item.report_data?.summary && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate leading-relaxed">
                    {item.report_data.summary}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {findings.length} 项发现
                  </span>
                  {redCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      {redCount} 高风险
                    </span>
                  )}
                  {yellowCount > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                      {yellowCount} 中风险
                    </span>
                  )}
                </div>
              </Link>

              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* 浮动对比按钮 */}
      {selected.length === 2 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10 px-4">
          <button
            onClick={handleCompare}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-sm
                       shadow-lg hover:bg-blue-700 active:scale-95 transition-all
                       flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0
                       002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0
                       012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2
                       2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            对比两次报告
          </button>
        </div>
      )}
    </>
  );
}
