// ─── MODULE: Config ─────────────────────────────────────────────
ClinCalc.Config = {
  version: '7.0.0',
  // AI provider settings
  ai: {
    provider: localStorage.getItem('cc_ai_provider') || 'gemini', // claude|openai|gemini
    claudeKey: localStorage.getItem('cc_key') || '',
    openaiKey: localStorage.getItem('cc_openai_key') || '',
    geminiKey: localStorage.getItem('cc_gemini_key') || '',
    claudeModel: 'claude-haiku-4-5-20251001',
    openaiModel: localStorage.getItem('cc_openai_model') || 'gpt-4o-mini',
    geminiModel: localStorage.getItem('cc_gemini_model') || 'gemini-2.0-flash',
  },
  // Data retention settings
  retention: {
    days: parseInt(localStorage.getItem('cc_retention_days') || '365'),
    autoDelete: localStorage.getItem('cc_auto_delete') !== 'false',
    lastCleanup: localStorage.getItem('cc_last_cleanup') || null,
  },
  // De-identification rules
  deid: {
    blockedFields: ['name','fullname','id_card','phone','address','email','birth_exact'],
    hashSalt: localStorage.getItem('cc_hash_salt') || (() => {
      const s = Math.random().toString(36).slice(2);
      localStorage.setItem('cc_hash_salt', s);
      return s;
    })(),
  },
  save() {
    localStorage.setItem('cc_ai_provider', this.ai.provider);
    localStorage.setItem('cc_openai_model', this.ai.openaiModel);
    localStorage.setItem('cc_retention_days', this.retention.days);
    localStorage.setItem('cc_auto_delete', this.retention.autoDelete);
  }
};

