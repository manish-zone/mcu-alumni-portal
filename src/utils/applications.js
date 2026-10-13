/**
 * Application deduplication and normalization utility
 */

export const getApplicationDedupeKey = (app) => {
  if (!app) return '';
  const email = String(app.applicant_email || '').toLowerCase().trim();
  const title = String(app.job_title || '').toLowerCase().trim();
  if (email && title) {
    return `${email}___${title}`;
  }
  return app.id ? String(app.id) : '';
};

export const deduplicateApplications = (apps = []) => {
  if (!Array.isArray(apps)) return [];
  const seen = new Set();
  const result = [];
  for (const app of apps) {
    if (!app) continue;
    const key = getApplicationDedupeKey(app);
    if (!key) {
      result.push(app);
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      result.push(app);
    }
  }
  return result;
};
