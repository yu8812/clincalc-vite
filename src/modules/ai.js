// ─── MODULE: AIProvider ─────────────────────────────────────────
ClinCalc.AI = {
  // Unified AI call — dispatches to correct provider
  async call(prompt, maxTokens = 1000, opts = {}) {
    const cfg = ClinCalc.Config.ai;
    const provider = opts.provider || cfg.provider;
    switch(provider) {
      case 'openai':  return await this._callOpenAI(prompt, maxTokens, opts);
      case 'gemini':  return await this._callGemini(prompt, maxTokens, opts);
      case 'supabase': return await this._callSupabaseAI(prompt, maxTokens, opts);
      default:        return await this._callClaude(prompt, maxTokens, opts);
    }
  },

  // ── Claude (Anthropic) ──
  async _callClaude(prompt, maxTokens, opts) {
    const key = opts.key || ClinCalc.Config.ai.claudeKey;
    if (!key) throw new Error('未設定 Anthropic API Key');
    const model = opts.model || ClinCalc.Config.ai.claudeModel;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01' },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages:[{role:'user',content:prompt}] })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `Anthropic ${res.status}`); }
    return (await res.json()).content?.[0]?.text || '';
  },

  // ── OpenAI (GPT) ──
  async _callOpenAI(prompt, maxTokens, opts) {
    const key = opts.key || ClinCalc.Config.ai.openaiKey;
    if (!key) throw new Error('未設定 OpenAI API Key');
    const model = opts.model || ClinCalc.Config.ai.openaiModel;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','Authorization':`Bearer ${key}` },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages:[{role:'user',content:prompt}] })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `OpenAI ${res.status}`); }
    return (await res.json()).choices?.[0]?.message?.content || '';
  },

  // ── Google Gemini ──
  async _callGemini(prompt, maxTokens, opts) {
    const key = opts.key || ClinCalc.Config.ai.geminiKey;
    if (!key) throw new Error('未設定 Google AI Studio API Key');
    const model = opts.model || ClinCalc.Config.ai.geminiModel;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:maxTokens} })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `Gemini ${res.status}`); }
    return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  // ── Supabase AI (pgvector + pg_cron + edge functions — FREE) ──
  async _callSupabaseAI(prompt, maxTokens, opts) {
    if (!sbUrl || !sbKey) throw new Error('請先設定 Supabase 連線');
    // Call Supabase Edge Function named "ai-analyze"
    const res = await fetch(`${sbUrl}/functions/v1/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json','Authorization':`Bearer ${sbKey}` },
      body: JSON.stringify({ prompt, max_tokens: maxTokens })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Supabase AI: ${res.status} — ${txt.slice(0,200)}`);
    }
    const data = await res.json();
    return data.result || data.text || data.content || JSON.stringify(data);
  },

  // ── Test connection for any provider ──
  async test(provider, key) {
    const testPrompt = '請回覆數字1，不要其他內容。';
    try {
      const result = await this.call(testPrompt, 20, { provider, key });
      return { ok: true, result };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  },

  // ── Get provider display info ──
  getProviderInfo(p) {
    const map = {
      claude:   { name:'Claude (Anthropic)', icon:'🤖', color:'var(--teal)',    model:'Haiku 4.5 / Sonnet 4' },
      openai:   { name:'GPT (OpenAI)',       icon:'⚡', color:'var(--emerald)', model:'GPT-4o-mini / GPT-4o' },
      gemini:   { name:'Gemini (Google)',    icon:'✨', color:'var(--amber)',   model:'Gemini 1.5 Flash (免費)' },
      supabase: { name:'Supabase AI',        icon:'🗄️', color:'var(--sky)',     model:'免費 Edge Function + llama/mistral' },
    };
    return map[p] || map.claude;
  }
};

