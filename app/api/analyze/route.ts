import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const kimi = new OpenAI({
  apiKey:  process.env.KIMI_API_KEY!,
  baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1",
});

const MODEL = process.env.KIMI_MODEL || "kimi-k2.5";

/* ── 系统提示词 ── */
function buildSystemPrompt(knowledgeDocs: { title: string; content: string }[]) {
  // 每篇文档截取前 8000 字，防止 prompt 超出模型上下文限制
  const MAX_DOC_CHARS = 8000;

  const knowledgeSection = knowledgeDocs.length > 0
    ? `## 专业知识库（优先参考以下内容进行分析）\n\n${
        knowledgeDocs.map(d => {
          const body = d.content.length > MAX_DOC_CHARS
            ? d.content.slice(0, MAX_DOC_CHARS) + "\n…（内容过长，已截取前段）"
            : d.content;
          return `### ${d.title}\n${body}`;
        }).join("\n\n")
      }`
    : "## 专业知识库\n\n（暂无上传文档，请基于你的医学专业知识进行分析）";

  return `你是一位拥有 20 年经验的专业体态分析与康复建议专家，擅长肌骨评估、触发点疗法和运动康复。

${knowledgeSection}

## 任务
根据用户提供的体态照片（正面/背面/左侧/右侧）以及病史描述，进行专业的体态分析，输出结构化的 JSON 报告。

## 输出格式（严格遵守，只输出 JSON，不要有任何额外文字）

\`\`\`json
{
  "summary": "整体体态评估摘要（2-3句话）",
  "findings": [
    {
      "area": "具体部位（如：颈椎、骨盆、肩部、膝关节）",
      "status": "red | yellow | green",
      "description": "体态问题的具体描述",
      "action": "建议措施"
    }
  ],
  "rehab": [
    {
      "no": 1,
      "name": "康复动作名称",
      "frequency": "执行频率",
      "goal": "康复目标",
      "duration": "建议疗程"
    }
  ]
}
\`\`\`

## 评级标准
- red（红）：需立即就医或停止特定运动，存在明显功能障碍或高风险
- yellow（黄）：需重点康复，存在体态偏差但功能尚可
- green（绿）：状态良好，维持即可

只返回 JSON 对象，不要 markdown 代码块，不要任何说明文字。`;
}

/* ── POST /api/analyze ── */
export async function POST(request: NextRequest) {
  try {
    const { images, patientNotes } = await request.json() as {
      images: Record<string, string | null>;
      patientNotes?: string;
    };

    // 1. 获取当前登录用户（可选，未登录也允许分析）
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 2. 从知识库拉取所有文档（RAG：优先使用私有知识）
    const { data: knowledgeDocs } = await supabase
      .from("knowledge_docs")
      .select("title, content")
      .order("created_at", { ascending: false })
      .limit(10);

    // 3. 构建发给 Kimi 的消息
    const uploadedViews = ["front", "back", "left", "right"].filter(v => images[v]);

    const imageMessages = uploadedViews.map(view => ({
      type: "image_url" as const,
      image_url: { url: images[view]! },
    }));

    const viewLabels: Record<string, string> = {
      front: "正面", back: "背面", left: "左侧", right: "右侧",
    };

    const userText = [
      `已上传照片：${uploadedViews.map(v => viewLabels[v]).join("、")}`,
      patientNotes ? `\n病史与主诉：${patientNotes}` : "",
      "\n请根据以上照片和信息进行专业体态分析，输出 JSON 格式报告。",
    ].join("");

    // 4. 调用 Kimi 视觉 API
    const completion = await kimi.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(knowledgeDocs ?? []),
        },
        {
          role: "user",
          content: [
            ...imageMessages,
            { type: "text", text: userText } as unknown as OpenAI.Chat.ChatCompletionContentPart,
          ],
        },
      ],
    });

    // 5. 解析 JSON 结果
    const rawText = completion.choices[0]?.message?.content ?? "";
    // 去除可能存在的 markdown 代码块包装
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let reportData: unknown;
    try {
      reportData = JSON.parse(jsonText);
    } catch {
      // 如果解析失败，把原始文本包一层返回
      reportData = { summary: rawText, findings: [], rehab: [] };
    }

    // 6. 存入 Supabase（仅登录用户）
    let analysisId: string | null = null;
    if (user) {
      const { data } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          status: "completed",
          report_data: reportData,
        })
        .select("id")
        .single();
      analysisId = data?.id ?? null;
    }

    return NextResponse.json({ analysisId, reportData });

  } catch (err) {
    console.error("analyze error:", err);

    const msg = err instanceof Error ? err.message : "";

    if (msg.includes("401") || msg.includes("Incorrect API key") || msg.includes("invalid_api_key")) {
      return NextResponse.json({ error: "AI 服务鉴权失败，请联系管理员" }, { status: 500 });
    }
    if (msg.includes("429") || msg.includes("rate_limit") || msg.includes("RateLimitError")) {
      return NextResponse.json({ error: "AI 服务繁忙，请稍等片刻再试" }, { status: 429 });
    }
    if (msg.includes("timeout") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT")) {
      return NextResponse.json({ error: "AI 分析超时，请稍后重试" }, { status: 408 });
    }

    return NextResponse.json(
      { error: "分析失败，请检查图片格式或稍后重试" },
      { status: 500 }
    );
  }
}
