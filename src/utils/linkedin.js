// LinkedIn Integration Utilities for MCU Alumni Portal

export const MCU_OFFICIAL_LINKEDIN_PAGE =
  "https://www.linkedin.com/school/makhanlal-chaturvedi-national-university-of-journalism-and-communication-bhopal/people/";

/**
 * Normalizes user input into a valid LinkedIn URL
 */
export const normalizeLinkedInUrl = (input) => {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.includes('linkedin.com/')) {
    return `https://${trimmed}`;
  }
  // If user just gave a username/slug e.g. "prashant-shrivastava"
  const cleanHandle = trimmed.replace(/^@/, '');
  return `https://www.linkedin.com/in/${cleanHandle}`;
};

/**
 * Returns a direct personal profile URL if available,
 * otherwise generates a pre-filled targeted LinkedIn search URL for this MCU alumnus.
 */
export const getAlumniLinkedInUrl = (alumni) => {
  if (!alumni) return MCU_OFFICIAL_LINKEDIN_PAGE;

  const directUrl = alumni.linkedIn || alumni.linkedin_url || alumni.linkedin || alumni.LinkedInURL;
  if (directUrl && typeof directUrl === 'string' && directUrl.includes('linkedin.com/in/')) {
    return directUrl;
  }

  const name = alumni.name || alumni.full_name || '';
  const batch = (alumni.batch || alumni.batch_year || '').toString();
  const company = alumni.company && alumni.company !== 'MCU Alumnus' ? alumni.company : '';

  // Smart LinkedIn People search query for this specific alumnus
  const queryParts = ['Makhanlal Chaturvedi', name];
  if (batch) queryParts.push(batch);
  if (company) queryParts.push(company);

  const query = queryParts.filter(Boolean).join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
};

/**
 * Generates a targeted LinkedIn search URL for MCU pass-outs with optional keyword & year filters.
 */
export const getMcuLinkedInSearchUrl = (keywords = '', year = 'all') => {
  const queryParts = ['Makhanlal Chaturvedi National University'];

  if (year && year !== 'all') {
    queryParts.push(`batch ${year}`);
  }

  if (keywords && keywords.trim()) {
    queryParts.push(keywords.trim());
  }

  const query = queryParts.join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
};

/**
 * Helper: Levenshtein similarity (0..1) between two lowercase strings
 */
const getLevenshteinSimilarity = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const lenA = a.length;
  const lenB = b.length;
  const matrix = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));

  for (let i = 0; i <= lenA; i++) matrix[i][0] = i;
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[lenA][lenB];
  return Math.max(0, 1 - distance / Math.max(lenA, lenB));
};

/**
 * Helper: Dice bigram similarity (0..1) between two lowercase strings
 */
const getDiceSimilarity = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) {
    return a[0] === b[0] ? 0.8 : 0;
  }
  const bigramsA = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }
  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigramsA.get(bg) || 0;
    if (count > 0) {
      bigramsA.set(bg, count - 1);
      intersection++;
    }
  }
  return (2 * intersection) / (a.length - 1 + (b.length - 1));
};

const HONORIFIC_NOISE = new Set([
  'dr', 'er', 'mr', 'ms', 'mrs', 'prof', 'shri', 'smt', 'km',
  'official', 'iam', 'real', 'the', 'mcu', 'bhopal', 'india', 'ind'
]);

/**
 * Verifies whether the user's entered name matches the name on their LinkedIn profile URL.
 * Returns a Green Signal (`isGreenSignal: true`) when similarity >= 75%.
 */
export const verifyLinkedInNameMatch = (enteredName = '', linkedInInput = '') => {
  const rawUrl = (linkedInInput || '').trim();
  const rawName = (enteredName || '').trim();

  if (!rawUrl) {
    return {
      hasInput: false,
      isValidUrl: false,
      isGreenSignal: false,
      matchScore: 0,
      extractedName: '',
      slug: '',
      normalizedUrl: '',
    };
  }

  // Match linkedin.com/in/<slug> or linkedin.com/pub/<slug>
  const urlMatch = rawUrl.match(/(?:https?:\/\/)?(?:[\w]+\.)?linkedin\.com\/(?:in|pub)\/([^/?#\s]+)/i);
  if (!urlMatch || !urlMatch[1]) {
    return {
      hasInput: true,
      isValidUrl: false,
      isGreenSignal: false,
      matchScore: 0,
      extractedName: '',
      slug: '',
      normalizedUrl: rawUrl,
    };
  }

  let rawSlug = '';
  try {
    rawSlug = decodeURIComponent(urlMatch[1]).trim().toLowerCase();
  } catch {
    rawSlug = urlMatch[1].trim().toLowerCase();
  }

  const normalizedUrl = `https://www.linkedin.com/in/${rawSlug}`;

  // Split slug into tokens and strip LinkedIn's trailing random IDs (e.g., -8a92b123, -123456)
  let rawSlugParts = rawSlug.split(/[-_.\s]+/).filter(Boolean);

  while (rawSlugParts.length > 1) {
    const last = rawSlugParts[rawSlugParts.length - 1];
    const isPureDigits = /^\d+$/.test(last);
    const isAlphanumericHash = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{5,}$/i.test(last);
    const isHexSuffix = /^[a-f0-9]{6,}$/i.test(last);
    if (isPureDigits || isAlphanumericHash || isHexSuffix) {
      rawSlugParts.pop();
    } else {
      break;
    }
  }

  // Strip trailing numbers from tokens (e.g., "john99" -> "john")
  let slugTokens = rawSlugParts
    .map((part) => part.replace(/\d+$/g, '').replace(/[^a-z]/g, ''))
    .filter((part) => part.length > 0);

  const filteredSlugTokens = slugTokens.filter((t) => !HONORIFIC_NOISE.has(t));
  if (filteredSlugTokens.length > 0) {
    slugTokens = filteredSlugTokens;
  }

  const extractedName = slugTokens
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(' ');

  if (!rawName || slugTokens.length === 0) {
    return {
      hasInput: true,
      isValidUrl: true,
      isGreenSignal: false,
      matchScore: 0,
      extractedName: extractedName || rawSlug,
      slug: rawSlug,
      normalizedUrl,
    };
  }

  // Tokenize entered name
  let nameTokens = rawName
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const filteredNameTokens = nameTokens.filter((t) => !HONORIFIC_NOISE.has(t));
  if (filteredNameTokens.length > 0) {
    nameTokens = filteredNameTokens;
  }

  const nameConcat = nameTokens.join('');
  const slugConcat = slugTokens.join('');

  if (!nameConcat || !slugConcat) {
    return {
      hasInput: true,
      isValidUrl: true,
      isGreenSignal: false,
      matchScore: 0,
      extractedName: extractedName || rawSlug,
      slug: rawSlug,
      normalizedUrl,
    };
  }

  // 1. Direct concatenated similarity (handles unhyphenated slugs like "johnsmith")
  const concatLev = getLevenshteinSimilarity(nameConcat, slugConcat);
  const concatDice = getDiceSimilarity(nameConcat, slugConcat);
  let bestScore = Math.max(concatLev, concatDice);

  // 2. Substring / containment check when slug has no hyphens or extra words
  const matchedNameCharsInSlug = nameTokens.reduce((acc, token) => {
    if (token.length >= 2 && slugConcat.includes(token)) {
      return acc + token.length;
    }
    return acc;
  }, 0);
  const nameCoverageInSlug = matchedNameCharsInSlug / nameConcat.length;
  if (nameCoverageInSlug >= 0.75) {
    bestScore = Math.max(bestScore, 0.8 + nameCoverageInSlug * 0.2);
  }

  const matchedSlugCharsInName = slugTokens.reduce((acc, token) => {
    if (token.length >= 2 && nameConcat.includes(token)) {
      return acc + token.length;
    }
    return acc;
  }, 0);
  const slugCoverageInName = matchedSlugCharsInName / slugConcat.length;
  if (slugCoverageInName >= 0.75) {
    bestScore = Math.max(bestScore, 0.8 + slugCoverageInName * 0.2);
  }

  // 3. Token-by-token pairwise similarity (handles middle-name omission or initials)
  const tokenPairScore = (t1, t2) => {
    if (t1 === t2) return 1;
    if ((t1.length === 1 && t2.startsWith(t1)) || (t2.length === 1 && t1.startsWith(t2))) {
      return 0.86;
    }
    if (t1.length >= 3 && t2.length >= 3 && (t1.startsWith(t2) || t2.startsWith(t1))) {
      return 0.9;
    }
    return Math.max(getLevenshteinSimilarity(t1, t2), getDiceSimilarity(t1, t2));
  };

  const nameToSlugScores = nameTokens.map((nt) =>
    Math.max(...slugTokens.map((st) => tokenPairScore(nt, st)))
  );
  const slugToNameScores = slugTokens.map((st) =>
    Math.max(...nameTokens.map((nt) => tokenPairScore(st, nt)))
  );

  const avgNameToSlug =
    nameToSlugScores.reduce((a, b) => a + b, 0) / nameToSlugScores.length;
  const avgSlugToName =
    slugToNameScores.reduce((a, b) => a + b, 0) / slugToNameScores.length;

  // If all tokens of the shorter representation match strongly (e.g., "John Smith" vs "John David Smith")
  const minSideAvg = Math.max(avgNameToSlug, avgSlugToName);
  const combinedTokenAvg = (avgNameToSlug + avgSlugToName) / 2;

  // Ensure first-name match boosts legitimate single-name or first+last combinations
  const firstTokenSim = tokenPairScore(nameTokens[0], slugTokens[0]);
  if (firstTokenSim >= 0.8) {
    bestScore = Math.max(bestScore, minSideAvg * 0.92 + firstTokenSim * 0.08);
  } else {
    bestScore = Math.max(bestScore, combinedTokenAvg);
  }

  const matchScore = Math.min(100, Math.round(bestScore * 100));
  const isGreenSignal = matchScore >= 75;

  return {
    hasInput: true,
    isValidUrl: true,
    isGreenSignal,
    matchScore,
    extractedName: extractedName || rawSlug,
    slug: rawSlug,
    normalizedUrl,
  };
};
