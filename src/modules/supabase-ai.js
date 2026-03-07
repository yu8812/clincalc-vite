// ─── MODULE: SupabaseAI (免費 AI — Edge Functions) ─────────────
ClinCalc.SupabaseAI = {
  // Edge Function code to deploy (shown in tutorial)
  getEdgeFunctionCode() {
    return `// supabase/functions/ai-analyze/index.ts
// Deploy with: supabase functions deploy ai-analyze
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = ["*"]; // 正式環境請限制來源

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type" }
    });
  }
  
  const { prompt, max_tokens = 500 } = await req.json();
  
  // 使用 Supabase 內建的 AI (pg_embedding / Ollama)
  // 或呼叫 Groq API（免費方案）
  const GROQ_KEY = Deno.env.get("GROQ_API_KEY"); // 設定在 Supabase secrets
  
  if (GROQ_KEY) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": \`Bearer \${GROQ_KEY}\`,
                 "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // 免費快速模型
        messages: [{ role: "user", content: prompt }],
        max_tokens
      })
    });
    const data = await res.json();
    return new Response(
      JSON.stringify({ result: data.choices?.[0]?.message?.content }),
      { headers: { "Content-Type": "application/json",
                   "Access-Control-Allow-Origin": "*" } }
    );
  }
  
  return new Response(
    JSON.stringify({ error: "請設定 GROQ_API_KEY 環境變數" }),
    { status: 500, headers: { "Content-Type": "application/json",
                               "Access-Control-Allow-Origin": "*" } }
  );
});`;
  },

  async test() {
    if (!sbUrl || !sbKey) return { ok: false, error: '未設定 Supabase 連線' };
    try {
      const r = await fetch(`${sbUrl}/functions/v1/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json','Authorization':`Bearer ${sbKey}` },
        body: JSON.stringify({ prompt: '回覆：OK', max_tokens: 10 })
      });
      if (r.ok) { return { ok: true }; }
      return { ok: false, error: `${r.status} — 請先部署 Edge Function` };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }
};

