"use client";

import Link from "next/link";
import { useRef } from "react";

export interface Finding {
  area: string;
  status: "red" | "yellow" | "green";
  description: string;
  action: string;
}

export interface RehabItem {
  no: number;
  name: string;
  frequency: string;
  goal: string;
  duration: string;
}

export interface ReportData {
  summary?: string;
  findings: Finding[];
  rehab: RehabItem[];
}

interface Props {
  report: ReportData;
  reportId?: string;
  createdAt?: string;
  backHref?: string;
  backLabel?: string;
}

const STATUS_CFG = {
  red:    { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-500",    badge: "bg-red-100 text-red-700",       label: "需立即关注" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700", label: "需重点康复" },
  green:  { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500",  badge: "bg-green-100 text-green-700",   label: "状态良好"   },
} as const;

export default function ReportView({
  report,
  reportId,
  createdAt,
  backHref = "/",
  backLabel = "返回",
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!contentRef.current) return;
    // 动态加载，避免 SSR 报错
    const { default: html2pdf } = await import("html2pdf.js");
    html2pdf()
      .set({
        margin: 10,
        filename: `posture-report-${reportId ?? Date.now()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(contentRef.current)
      .save();
  };

  const redCount    = report.findings.filter(f => f.status === "red").length;
  const yellowCount = report.findings.filter(f => f.status === "yellow").length;

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      })
    : new Date().toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });

  return (
    <div className="space-y-4 pb-10">

      {/* 顶部操作栏（不计入 PDF） */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={backHref}
          className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-2 bg-gray-800 text-white text-sm
                     px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0
                     012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0
                     01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          导出 PDF
        </button>
      </div>

      {/* 报告主体（PDF 截取范围） */}
      <div ref={contentRef} className="space-y-4">

        {/* 报告头部 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">体态分析报告</h1>
              <p className="text-sm text-gray-400 mt-0.5">分析时间：{dateStr}</p>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
              {reportId ? `#${reportId.slice(0, 6).toUpperCase()}` : "AI 生成"}
            </span>
          </div>

          {report.summary && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
              {report.summary}
            </p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-2">
              <div className="text-lg font-bold text-gray-800">{report.findings.length}</div>
              <div className="text-xs text-gray-400">发现问题</div>
            </div>
            <div className="bg-red-50 rounded-xl p-2">
              <div className="text-lg font-bold text-red-600">{redCount}</div>
              <div className="text-xs text-gray-400">高风险</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-2">
              <div className="text-lg font-bold text-yellow-600">{yellowCount}</div>
              <div className="text-xs text-gray-400">中风险</div>
            </div>
          </div>
        </div>

        {/* 红绿灯预警 */}
        {report.findings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-3">风险预警</h2>
            <div className="space-y-3">
              {report.findings.map((item, i) => {
                const c = STATUS_CFG[item.status] ?? STATUS_CFG.green;
                return (
                  <div key={i} className={`rounded-xl border p-3.5 ${c.bg} ${c.border}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                      <span className="font-semibold text-gray-800 text-sm">{item.area}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                        {c.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 pl-4 leading-relaxed">{item.description}</p>
                    <p className="text-xs text-gray-400 pl-4 mt-1">建议：{item.action}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 康复动作 */}
        {report.rehab.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-3">康复动作建议</h2>
            <div className="space-y-3">
              {report.rehab.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center
                                  shrink-0 text-white font-bold text-sm">
                    {item.no ?? i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-blue-600 mt-0.5">{item.frequency}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.goal}</p>
                    <p className="text-xs text-gray-300 mt-0.5">疗程：{item.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-300 text-center px-4 leading-relaxed">
          本报告由 AI 辅助生成，仅供参考，不构成医疗诊断。如有不适请咨询专业医生。
        </p>

        {/* 反馈按钮 */}
        <div className="text-center pt-2">
          <a
            href={`mailto:cesarlee007@gmail.com?subject=PostureAI 反馈${reportId ? `（报告 #${reportId.slice(0, 6).toUpperCase()}）` : ""}&body=报告内容反馈或建议：%0A%0A`}
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-blue-500
                       transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0
                   00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            对报告有疑问或建议？点击反馈
          </a>
        </div>
      </div>
    </div>
  );
}
