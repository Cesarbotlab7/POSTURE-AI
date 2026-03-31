"use client";

import { useState, useRef } from "react";

const VIEWS = [
  { id: "front" as const, label: "正面", hint: "面朝镜头，双臂自然垂放" },
  { id: "back"  as const, label: "背面", hint: "背朝镜头，双臂自然垂放" },
  { id: "left"  as const, label: "左侧", hint: "左侧朝镜头，自然站立" },
  { id: "right" as const, label: "右侧", hint: "右侧朝镜头，自然站立" },
];

type ViewId = "front" | "back" | "left" | "right";
type ProcessState = "idle" | "detecting" | "done" | "no_face";

interface ViewState {
  state: ProcessState;
  statusText: string;
}

const MAX_PX = 1200; // 压缩目标：长边不超过 1200px

/* ─── 人脸马赛克（纯 Canvas，本地运算）─── */
async function blurFacesInImage(
  imageUrl: string,
  onStatus?: (s: string) => void,
): Promise<{ dataUrl: string; faceCount: number }> {
  // 动态加载 face-api.js（避免 SSR 报错）
  const faceapi = await import("face-api.js");

  // 仅首次加载模型（约 190KB，从 /public/models 读取）
  if (!faceapi.nets.tinyFaceDetector.isLoaded) {
    onStatus?.("加载检测模型…");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  }

  onStatus?.("人脸检测中…");

  // 把 dataURL 画到 <img> 元素
  const img = new Image();
  img.src = imageUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("图片加载失败"));
  });

  // 压缩：长边超过 MAX_PX 时等比缩放
  const scale  = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(img.naturalWidth  * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 检测人脸（在压缩后的 canvas 上检测）
  const detections = await faceapi.detectAllFaces(
    canvas,
    new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.45 })
  );

  // 对每张脸打马赛克
  for (const det of detections) {
    const { x, y, width, height } = det.box;

    // 扩大打码区域 30%，覆盖头部边缘
    const pad  = 0.3;
    const rx   = Math.max(0, Math.round(x - width  * pad));
    const ry   = Math.max(0, Math.round(y - height * pad * 1.5)); // 头顶多留点
    const rw   = Math.min(canvas.width  - rx, Math.round(width  * (1 + pad * 2)));
    const rh   = Math.min(canvas.height - ry, Math.round(height * (1 + pad * 2.5)));

    // 像素块大小：按脸宽动态计算，越大越模糊
    const pixelSize = Math.max(10, Math.round(width / 10));

    for (let bx = rx; bx < rx + rw; bx += pixelSize) {
      for (let by = ry; by < ry + rh; by += pixelSize) {
        const pw = Math.min(pixelSize, rx + rw - bx);
        const ph = Math.min(pixelSize, ry + rh - by);
        // 取该像素块左上角颜色作为填充色
        const [r, g, b] = ctx.getImageData(bx, by, 1, 1).data;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(bx, by, pw, ph);
      }
    }
  }

  return {
    dataUrl:   canvas.toDataURL("image/jpeg", 0.85),
    faceCount: detections.length,
  };
}

/* ─── SVG 人体对位辅助线（同 Phase 1）─── */
function BodyGuide({ view, dim }: { view: ViewId; dim?: boolean }) {
  const isSide  = view === "left" || view === "right";
  const isRight = view === "right";
  const color   = dim ? "#3b82f6" : "white";
  const opacity = dim ? 1 : 0.85;

  if (!isSide) {
    return (
      <svg viewBox="0 0 60 100" className="w-full h-full" fill="none"
           stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity={opacity}>
        <line x1="30" y1="0" x2="30" y2="100" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.55" />
        <ellipse cx="30" cy="11" rx="8" ry="9" />
        <path d="M26 20 L26 27 M34 20 L34 27" opacity="0.75" />
        <line x1="5" y1="31" x2="55" y2="31" />
        <line x1="5"  y1="28.5" x2="5"  y2="33.5" opacity="0.6" />
        <line x1="55" y1="28.5" x2="55" y2="33.5" opacity="0.6" />
        <path d="M5 31 L2 58 M55 31 L58 58" opacity="0.7" />
        <path d="M11 31 L13 62 M49 31 L47 62" opacity="0.7" />
        <path d="M13 62 Q30 66 47 62" />
        <line x1="13" y1="60" x2="13" y2="64" opacity="0.6" />
        <line x1="47" y1="60" x2="47" y2="64" opacity="0.6" />
        <path d="M18 62 L16 97 M42 62 L44 97" opacity="0.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 100" className="w-full h-full" fill="none"
         stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity={opacity}>
      <g transform={isRight ? "scale(-1,1) translate(-60,0)" : undefined}>
        <line x1="30" y1="0" x2="30" y2="100" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.55" />
        <ellipse cx="33" cy="11" rx="8" ry="9" />
        <path d="M30 20 L28 28" opacity="0.8" />
        <path d="M28 28 Q22 45 25 62 Q27 76 29 97" strokeWidth="1.2" />
        <path d="M28 28 Q40 36 37 52 Q33 60 25 62" opacity="0.75" />
        <path d="M36 36 L40 60" opacity="0.65" />
        <path d="M25 72 L22 97 M29 72 L32 97" opacity="0.75" />
      </g>
    </svg>
  );
}

interface Props {
  onImagesChange?: (images: Record<ViewId, string | null>) => void;
}

/* ─── 主组件 ─── */
export default function PostureUpload({ onImagesChange }: Props) {
  const [images, setImages] = useState<Record<ViewId, string | null>>({
    front: null, back: null, left: null, right: null,
  });
  const [viewState, setViewState] = useState<Record<ViewId, ViewState>>({
    front: { state: "idle", statusText: "" },
    back:  { state: "idle", statusText: "" },
    left:  { state: "idle", statusText: "" },
    right: { state: "idle", statusText: "" },
  });

  const setStatus = (view: ViewId, state: ProcessState, statusText = "") =>
    setViewState(prev => ({ ...prev, [view]: { state, statusText } }));

  const inputRefs = useRef<Record<ViewId, HTMLInputElement | null>>({
    front: null, back: null, left: null, right: null,
  });

  const handleFile = async (view: ViewId, file: File | null) => {
    if (!file) return;

    // 先显示原图预览
    const originalUrl = URL.createObjectURL(file);
    setImages(prev => ({ ...prev, [view]: originalUrl }));
    setStatus(view, "detecting", "准备中…");

    try {
      // 将文件转成 dataURL 再传入打码函数
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsDataURL(file);
      });

      const { dataUrl: blurredUrl, faceCount } = await blurFacesInImage(
        dataUrl,
        text => setStatus(view, "detecting", text),
      );

      setImages(prev => {
        const next = { ...prev, [view]: blurredUrl };
        onImagesChange?.(next);
        return next;
      });
      setStatus(view, faceCount > 0 ? "done" : "no_face");
    } catch (err) {
      console.error("人脸打码失败:", err);
      setImages(prev => {
        const next = { ...prev, [view]: originalUrl };
        onImagesChange?.(next);
        return next;
      });
      setStatus(view, "no_face");
    }
  };

  const uploadedCount = Object.values(images).filter(Boolean).length;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {VIEWS.map(view => {
          const { state, statusText } = viewState[view.id];
          return (
            <div key={view.id} className="space-y-1.5">
              <div
                className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group
                           border-2 border-dashed border-gray-200 hover:border-blue-400
                           bg-gray-50 hover:bg-blue-50 transition-colors"
                onClick={() => state !== "detecting" && inputRefs.current[view.id]?.click()}
              >
                {images[view.id] ? (
                  <>
                    {/* 图片预览 */}
                    <img src={images[view.id]!} alt={view.label}
                         className="absolute inset-0 w-full h-full object-cover" />

                    {/* 检测中遮罩 */}
                    {state === "detecting" && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col
                                      items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent
                                        rounded-full animate-spin" />
                        <span className="text-white text-xs font-medium">
                          {statusText || "处理中…"}
                        </span>
                      </div>
                    )}

                    {/* 完成后：辅助线叠加 */}
                    {state !== "detecting" && (
                      <>
                        <div className="absolute inset-0 bg-black/20 p-3">
                          <BodyGuide view={view.id} />
                        </div>
                        {/* Hover 重拍 */}
                        <div className="absolute inset-0 flex items-center justify-center
                                        opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <span className="text-white text-xs font-medium px-3 py-1
                                           bg-black/50 rounded-full">重新拍摄</span>
                        </div>
                      </>
                    )}

                    {/* 状态徽章 */}
                    {state === "done" && (
                      <div className="absolute top-2 right-2 flex items-center gap-1
                                      bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        已打码
                      </div>
                    )}
                    {state === "no_face" && (
                      <div className="absolute top-2 right-2 bg-gray-600 text-white
                                      text-xs px-2 py-0.5 rounded-full shadow">
                        ✓ 无需打码
                      </div>
                    )}
                  </>
                ) : (
                  /* 未上传：蓝色辅助线 + 上传提示 */
                  <>
                    <div className="absolute inset-0 p-4 opacity-20">
                      <BodyGuide view={view.id} dim />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center
                                    justify-end pb-4 gap-1">
                      <svg className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors"
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-gray-400 group-hover:text-blue-500">
                        点击上传
                      </span>
                    </div>
                  </>
                )}

                <input
                  ref={el => { inputRefs.current[view.id] = el; }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => handleFile(view.id, e.target.files?.[0] ?? null)}
                />
              </div>

              <p className="text-center text-sm font-medium text-gray-600">{view.label}</p>
              <p className="text-center text-xs text-gray-400 leading-tight">{view.hint}</p>
            </div>
          );
        })}
      </div>

      {/* 进度条 */}
      {uploadedCount > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                 style={{ width: `${(uploadedCount / 4) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{uploadedCount} / 4 已上传</span>
        </div>
      )}

      {/* 打码说明 */}
      <p className="mt-3 text-xs text-gray-300 text-center">
        人脸识别与打码在您的设备本地完成，原始人脸数据不会上传
      </p>
    </div>
  );
}
