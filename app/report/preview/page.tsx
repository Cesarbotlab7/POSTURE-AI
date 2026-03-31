"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReportView, { type ReportData } from "@/components/ReportView";

export default function PreviewReportPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("postureReport");
    if (raw) {
      try { setReport(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">报告数据不存在</p>
        <Link href="/" className="text-blue-600 text-sm mt-2 inline-block">
          返回重新分析
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 登录提示横幅 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3
                      flex items-center justify-between gap-3">
        <div className="text-sm text-blue-700 leading-snug">
          <span className="font-medium">报告仅暂存在本设备</span>
          <span className="text-blue-500"> · 登录后可永久保存并查看历史</span>
        </div>
        <Link
          href="/login"
          className="shrink-0 bg-blue-600 text-white text-xs font-semibold
                     px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          立即登录
        </Link>
      </div>

      <ReportView report={report} backHref="/" backLabel="重新分析" />
    </div>
  );
}
