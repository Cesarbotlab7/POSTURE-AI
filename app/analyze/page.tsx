"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PostureUpload from "@/components/PostureUpload";

const LOADING_STEPS = [
  "正在上传照片…",
  "AI 识别体态关键点…",
  "分析肌骨力线偏差…",
  "生成康复建议…",
  "整理报告数据…",
];

export default function AnalyzePage() {
  const router = useRouter();
  const [images, setImages] = useState<Record<string, string | null>>({
    front: null, back: null, left: null, right: null,
  });
  const [patientNotes, setPatientNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      stepTimerRef.current = setInterval(() => {
        setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
      }, 5000);
    } else {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    }
    return () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); };
  }, [loading]);

  const uploadedCount = Object.values(images).filter(Boolean).length;

  const handleAnalyze = async () => {
    if (uploadedCount === 0) {
      setError("请至少上传一张体态照片");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let res: Response;
      try {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images, patientNotes }),
        });
      } catch {
        throw new Error("网络连接失败，请检查网络后重试");
      }

      if (!res.ok) {
        let msg = "分析失败，请稍后重试";
        try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
        if (res.status === 408 || res.status === 504) msg = "分析超时，请稍后重试";
        if (res.status === 429) msg = "请求过于频繁，请稍等片刻再试";
        if (res.status >= 500) msg = msg || "服务器异常，请稍后重试";
        throw new Error(msg);
      }

      const { analysisId, reportData } = await res.json();

      localStorage.setItem("postureReport", JSON.stringify(reportData));
      router.push(analysisId ? `/report/${analysisId}` : "/report/preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">体态分析</h1>
        <p className="text-gray-400 text-sm">
          上传 4 张标准体态照片，AI 将为您生成专业康复报告
        </p>
      </div>

      {/* 步骤一：照片上传 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full
                           flex items-center justify-center">1</span>
          <h2 className="text-base font-semibold text-gray-700">上传体态照片</h2>
          <span className="text-xs text-gray-400 ml-auto">参考轮廓线对齐站姿</span>
        </div>
        <PostureUpload onImagesChange={setImages} />
      </div>

      {/* 步骤二：病史录入 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full
                           flex items-center justify-center">2</span>
          <h2 className="text-base font-semibold text-gray-700">主诉与病史</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">可选</span>
        </div>
        <textarea
          value={patientNotes}
          onChange={e => setPatientNotes(e.target.value)}
          placeholder="描述主要不适部位、疼痛程度、持续时间、既往病史等…"
          rows={4}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-gray-300 resize-none"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                        px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* 提交 */}
      <div className="pt-2 text-center">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-[4500ms] ease-linear"
                style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent
                               rounded-full animate-spin inline-block shrink-0" />
              {LOADING_STEPS[loadingStep]}
            </div>
            <div className="flex justify-center gap-1.5">
              {LOADING_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i <= loadingStep ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-300">分析通常需要 15–30 秒，请勿关闭页面</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleAnalyze}
              disabled={uploadedCount === 0}
              className="bg-blue-600 text-white px-12 py-3 rounded-xl font-semibold
                         text-base hover:bg-blue-700 active:scale-95 transition-all shadow-md
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {`开始 AI 分析${uploadedCount > 0 ? `（${uploadedCount} 张）` : ""}`}
            </button>
            <p className="text-xs text-gray-300 mt-2">分析通常需要 15–30 秒</p>
          </>
        )}
      </div>
    </div>
  );
}
