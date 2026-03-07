// ─── MODULE: DataRetention ──────────────────────────────────────
ClinCalc.Retention = {
  get days() { return ClinCalc.Config.retention.days; },

  // Get expiry date for a record
  getExpiry(createdAt) {
    const d = new Date(createdAt || Date.now());
    d.setDate(d.getDate() + this.days);
    return d;
  },

  // Check if record is expired
  isExpired(createdAt) {
    return new Date() > this.getExpiry(createdAt);
  },

  // Purge expired localStorage drafts
  purgeLocalDrafts() {
    const drafts = JSON.parse(localStorage.getItem('cc_drafts') || '[]');
    const before = drafts.length;
    const alive = drafts.filter(d => !this.isExpired(d.saved_at));
    localStorage.setItem('cc_drafts', JSON.stringify(alive));
    return { before, after: alive.length, deleted: before - alive.length };
  },

  // Get records expiring soon (within 7 days)
  getExpiringSoon() {
    const drafts = JSON.parse(localStorage.getItem('cc_drafts') || '[]');
    const soon = new Date(Date.now() + 7 * 864e5);
    return drafts.filter(d => {
      const exp = this.getExpiry(d.saved_at);
      return exp > new Date() && exp < soon;
    });
  },

  // Build DELETE SQL for Supabase (to be run manually or via pg_cron)
  buildSupabaseCleanupSQL(tableName = 'patients') {
    return `-- 資料保留政策：刪除超過 ${this.days} 天的記錄
DELETE FROM ${tableName}
WHERE created_at < NOW() - INTERVAL '${this.days} days';

-- （選用）設定 pg_cron 每日自動清理
-- SELECT cron.schedule('cleanup-old-records', '0 2 * * *',
--   $$ DELETE FROM ${tableName} WHERE created_at < NOW() - INTERVAL '${this.days} days' $$);`;
  },

  // Format retention info for display
  formatStatus() {
    const exp = this.getExpiringSoon();
    return {
      days: this.days,
      autoDelete: ClinCalc.Config.retention.autoDelete,
      expiringSoon: exp.length,
      expiryDate: this.getExpiry(new Date()).toLocaleDateString('zh-TW'),
    };
  }
};

