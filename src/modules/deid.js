// ─── MODULE: DeID (去識別化引擎) ─────────────────────────────────
ClinCalc.DeID = {
  // Fields that must NEVER be stored
  BLOCKED: ['pid_name','full_name','id_number','phone','mobile','address','email',
            'line_id','birth_full','passport','insurance_id'],

  // Simple pseudonymization hash (not cryptographic, just obfuscation)
  pseudonymize(value) {
    if (!value) return null;
    const str = String(value) + ClinCalc.Config.deid.hashSalt;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'P' + Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
  },

  // Sanitize a data object — removes blocked fields, pseudonymizes PID
  sanitize(rawData) {
    const safe = {};
    const blocked = this.BLOCKED;

    for (const [k, v] of Object.entries(rawData)) {
      // Skip completely blocked fields
      if (blocked.includes(k)) {
        console.warn(`[DeID] 已移除欄位: ${k}`);
        continue;
      }
      // Pseudonymize patient ID (keep for record matching but not re-identifiable)
      if (k === 'pid') {
        safe['pid_hash'] = this.pseudonymize(v);
        safe['pid_display'] = v ? v.slice(0,2) + '***' : null; // e.g. "20***"
        continue;
      }
      // Keep only numeric/enum/date values (not free-text that might contain PII)
      if (k === 'note' || k === 'doctor') {
        safe[k] = v ? '[已過濾自由文字]' : null;
        continue;
      }
      safe[k] = v;
    }
    safe['_deid_version'] = '1.0';
    safe['_sanitized_at'] = new Date().toISOString();
    return safe;
  },

  // Check if data object contains potential PII
  audit(dataObj) {
    const warnings = [];
    const piiPatterns = [
      { key: 'pid', pattern: /[^\d]/, msg: '病患ID含非數字字元（可能含姓名）' },
      { key: 'note', pattern: /.{1}/, msg: '備註欄位含自由文字（可能含PII）' },
    ];
    for (const { key, pattern, msg } of piiPatterns) {
      if (dataObj[key] && pattern.test(String(dataObj[key]))) {
        warnings.push(msg);
      }
    }
    return warnings;
  },

  // Return a summary of what was removed
  diff(original, sanitized) {
    const removed = Object.keys(original).filter(k => !(k in sanitized) && !['pid'].includes(k));
    const modified = Object.keys(sanitized).filter(k => sanitized[k] !== original[k] && k in original);
    return { removed, modified };
  }
};

