/**
 * Smart Skills Inference & Management for MCU Alumni Portal
 * Automatically tailors "Core Expertise & Skills" according to each alumnus's
 * real professional profile, department, degree, role, company, and bio.
 */

const ROLE_SKILL_CATALOG = [
  // 1. Full-Stack Software Engineering & Computer Applications (BCA, MCA, CSE)
  {
    triggers: [
      'software', 'developer', 'engineer', 'sde', 'full stack', 'fullstack',
      'web', 'react', 'node', 'javascript', 'typescript', 'next.js', 'bca', 'mca', 'b.tech', 'computer'
    ],
    skills: [
      'Full Stack Web Development',
      'React.js & Next.js',
      'Node.js & Express APIs',
      'TypeScript & Modern JS',
      'SQL & NoSQL Databases',
      'Data Structures & Algorithms'
    ]
  },

  // 2. Cloud Architecture, DevOps & Site Reliability (SRE)
  {
    triggers: [
      'cloud', 'devops', 'sre', 'kubernetes', 'docker', 'aws', 'azure', 'gcp',
      'terraform', 'ci/cd', 'infrastructure', 'architect', 'principal'
    ],
    skills: [
      'Cloud Architecture (AWS/Azure)',
      'Distributed Microservices',
      'Kubernetes & Docker',
      'CI/CD & Terraform (IaC)',
      'System Design & Scalability',
      'Linux & Cloud Security'
    ]
  },

  // 3. Artificial Intelligence, Machine Learning & Data Science
  {
    triggers: [
      'data', 'analytics', 'data scientist', 'machine learning', 'ai', 'ml',
      'deep learning', 'nlp', 'llm', 'big data', 'spark', 'kafka', 'pytorch', 'tensorflow'
    ],
    skills: [
      'Machine Learning & AI',
      'Python & PyTorch / TensorFlow',
      'LLM & Generative AI Systems',
      'Big Data (Spark & Kafka)',
      'SQL & Data Modeling',
      'MLOps & Cloud AI'
    ]
  },

  // 4. Backend Engineering & High-Concurrency Systems
  {
    triggers: [
      'backend', 'golang', 'go', 'java', 'spring', 'c++', 'c#', '.net',
      'microservices', 'api', 'database', 'postgresql', 'redis', 'distributed'
    ],
    skills: [
      'Backend System Engineering',
      'Java Spring Boot & Golang',
      'REST & GraphQL Microservices',
      'PostgreSQL & Redis Caching',
      'High-Concurrency Architecture',
      'Data Structures & Algorithms'
    ]
  },

  // 5. Cybersecurity, Network Defense & InfoSec
  {
    triggers: [
      'cyber', 'security', 'ciso', 'infosec', 'network', 'penetration',
      'ethical hacking', 'soc', 'iam', 'zero-trust', 'cryptography'
    ],
    skills: [
      'Cybersecurity & SOC Operations',
      'Network & Cloud Security',
      'Zero-Trust Architecture',
      'Vulnerability & Pen Testing',
      'Identity & Access (IAM)',
      'Security Compliance & Audit'
    ]
  },

  // 6. Frontend Architecture, UI/UX & Mobile App Engineering
  {
    triggers: [
      'frontend', 'ui', 'ux', 'designer', 'mobile', 'android', 'ios',
      'flutter', 'react native', 'figma', 'design system'
    ],
    skills: [
      'Frontend Architecture (React/TS)',
      'UI/UX Engineering & Figma',
      'Cross-Platform Mobile (Flutter)',
      'Design Systems & Accessibility',
      'Web Performance Optimization',
      'State Management & GraphQL'
    ]
  },

  // 7. Computer Science Academics, Algorithms & AI Research
  {
    triggers: [
      'professor', 'academic', 'researcher', 'faculty', 'lecturer',
      'phd', 'scholar', 'dean', 'hod', 'iiit', 'nit', 'iit'
    ],
    skills: [
      'Data Structures & Algorithms',
      'Artificial Intelligence Research',
      'Computer Vision & Deep Learning',
      'Python, C++ & MATLAB',
      'IEEE / ACM Scholarly Publishing',
      'Doctoral & GATE CS Mentorship'
    ]
  },

  // 8. Engineering Management, CTO & Product Leadership
  {
    triggers: [
      'cto', 'ceo', 'founder', 'co-founder', 'vp', 'vice president',
      'director', 'head of', 'engineering manager', 'product'
    ],
    skills: [
      'Engineering Leadership & Agile',
      'Enterprise System Architecture',
      'Cloud & Platform Strategy',
      'Technical Product Management',
      'High-Performing Tech Teams',
      'Scalable Software Delivery'
    ]
  }
];

// Fallback pool of top MCU Computer Department competencies
const DEFAULT_MCU_SKILLS = [
  'Full Stack Web Development',
  'React.js & Node.js',
  'Python & Software Engineering',
  'Database Management (SQL)',
  'Cloud Architecture & DevOps'
];

const LEGACY_NON_COMPUTER_SKILLS = new Set([
  'media & communication',
  'journalism',
  'investigative reporting',
  'data journalism',
  'editorial writing',
  'rti investigations',
  'broadcast production',
  'live anchoring',
  'voice modulation',
  'pcr handling',
  'documentary scripting',
  'crisis pr',
  'brand strategy',
  'integrated marketing',
  'corporate communications',
  'cinematography',
  'davinci resolve',
  'sound design',
  'documentary pitching',
  'media monetization',
  'wire reporting',
  'state politics',
  'disaster reporting',
  'source cultivation',
  'media ethics',
  'audio storytelling',
  'podcast direction',
  'pro tools',
  'interviewing technique',
  'fact checking',
  'social algorithms',
  'multilingual content',
  'visual storytelling',
  'prime-time news anchoring',
  'live field reporting'
]);

const matchTrigger = (text, trigger) => {
  if (!text || !trigger) return false;
  if (trigger.length <= 4) {
    const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(trigger.toLowerCase());
};

/**
 * Returns tailored Computer Science & IT skills for an alumnus based on their profile data.
 * Automatically upgrades any legacy non-computer skills to Computer Department skills.
 *
 * @param {Object} alumni Alumnus profile object
 * @returns {Array<string>} List of skills tailored to profile
 */
export const getProfileSkills = (alumni) => {
  if (!alumni) return DEFAULT_MCU_SKILLS;

  // 1. If user has custom skills that are Computer/IT skills (not legacy media skills)
  if (Array.isArray(alumni.skills) && alumni.skills.length > 0) {
    const cleanedSkills = alumni.skills.filter(
      (s) => s && !LEGACY_NON_COMPUTER_SKILLS.has(String(s).toLowerCase().trim())
    );
    if (cleanedSkills.length > 0) {
      return cleanedSkills;
    }
  }

  // 2. Weights: Role is highest priority (3x), Degree & Department (2x), Company & Bio (1x)
  const roleText = [alumni.currentRole || alumni.current_role || '', alumni.role || alumni.role_title || ''].join(' ');
  const eduText = [alumni.degree || '', alumni.department || alumni.department_name || ''].join(' ');
  const generalText = [alumni.company || '', alumni.bio || '', alumni.name || alumni.full_name || ''].join(' ');

  let bestCategory = null;
  let highestScore = 0;

  for (const category of ROLE_SKILL_CATALOG) {
    let score = 0;
    for (const trigger of category.triggers) {
      if (matchTrigger(roleText, trigger)) {
        score += 3;
      }
      if (matchTrigger(eduText, trigger)) {
        score += 2;
      }
      if (matchTrigger(generalText, trigger)) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }

  if (bestCategory && highestScore > 0) {
    return bestCategory.skills;
  }

  // 4. Default intelligent Computer Department skills
  return DEFAULT_MCU_SKILLS;
};

/**
 * Provides suggested skill pills that a user can pick in EditProfileModal.
 *
 * @param {string} roleOrDept Current role or department string
 * @returns {Array<string>} Array of suggested skills
 */
export const getSuggestedSkills = (roleOrDept = '') => {
  const query = (roleOrDept || '').trim();
  if (!query) {
    return DEFAULT_MCU_SKILLS;
  }

  let bestCategory = null;
  let highestScore = 0;

  for (const category of ROLE_SKILL_CATALOG) {
    let score = 0;
    for (const trigger of category.triggers) {
      if (matchTrigger(query, trigger)) {
        score += 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }

  if (bestCategory && highestScore > 0) {
    return bestCategory.skills;
  }

  // Comprehensive common suggestions across MCU Computer Department disciplines
  return [
    'Full Stack Web Development',
    'React.js & Node.js',
    'Python & Machine Learning',
    'Database Engineering & SQL',
    'Cloud Architecture (AWS/Docker)',
    'System Architecture',
    'REST & GraphQL APIs',
    'DevOps & CI/CD Pipelines',
    'Cybersecurity & Network Systems',
    'UI/UX Design & Figma',
    'Mobile App Development',
    'Data Analytics & Modeling'
  ];
};

const NON_COMPUTER_ROLE_PATTERNS = [
  'media professional',
  'assistant editor',
  'prime time producer',
  'anchor',
  'brand communications',
  'documentary filmmaker',
  'cinematographer',
  'digital growth',
  'bureau chief',
  'mass communication',
  'podcast host',
  'audio producer',
  'social strategist',
  'correspondent',
  'journalist',
  'reporter',
  'news producer',
  'public relations'
];

const NON_COMPUTER_DEGREE_PATTERNS = [
  'mass communication',
  'journalism',
  'electronic media',
  'advertising',
  'public relations',
  'multimedia',
  'media management',
  'media studies',
  'broadcast',
  'new media'
];

const NON_COMPUTER_COMPANY_PATTERNS = [
  'indian express',
  'ndtv',
  'ogilvy',
  'netflix documentaries',
  'dainik bhaskar',
  'press trust of india',
  'pti',
  'delhi university',
  'spotify studios',
  'prasar bharati',
  'aaj tak',
  'india today',
  'times network',
  'zee news'
];

const NON_COMPUTER_BIO_PATTERNS = [
  'journalism',
  'print media',
  'prime time debates',
  'pcr rooms',
  'fmcg brands',
  'film festival',
  'vernacular digital news',
  'assembly elections',
  'communication ethics',
  'media ethnography',
  'narrative audio',
  'digital diplomacy',
  'news dissemination'
];

/**
 * Determines whether a user/profile is a Current Student (Studying at MCU)
 * rather than a graduated Alumnus or Administrator.
 *
 * @param {Object} user User or profile object
 * @returns {boolean} True if user is a current student
 */
export const isCurrentStudent = (user) => {
  if (!user) return false;
  if (user.is_admin || String(user.role || '').toLowerCase() === 'admin') return false;

  const roleVal = String(user.role || '').trim().toLowerCase();
  if (roleVal === 'student' || user.is_student === true || user.isStudent === true) {
    return true;
  }

  const categoryVal = String(user.member_category || user.memberCategory || '').trim().toLowerCase();
  if (categoryVal.includes('student')) {
    return true;
  }

  const currentRoleVal = String(user.currentRole || user.current_role || '').trim().toLowerCase();
  if (
    currentRoleVal === 'student' ||
    currentRoleVal.includes('student') ||
    currentRoleVal.includes('pursuing')
  ) {
    return true;
  }

  const companyVal = String(user.company || '').trim().toLowerCase();
  if (companyVal.includes('current student')) {
    return true;
  }

  const batchYear = parseInt(user.batch || user.batch_year, 10);
  const currentYear = new Date().getFullYear();
  if (!isNaN(batchYear) && batchYear > currentYear) {
    return true;
  }

  return false;
};

/**
 * Checks whether an Alumnus user account has been verified by the MCU Admin.
 * - Admin accounts are always considered verified (true).
 * - Current Student accounts are never verified as alumni (false).
 * - Graduated Alumni accounts are ONLY verified once MCU Admin verifies them
 *   (or if they match a verified record in mcu_alumni_verifications / alumniList).
 *
 * @param {Object} user Current user or profile object
 * @param {Array} alumniList Optional alumni directory list
 * @returns {boolean} True if user is an Admin or Admin-verified Alumnus
 */
export const isVerifiedAlumnus = (user, alumniList = []) => {
  if (!user) return false;
  if (user.is_admin || String(user.role || '').toLowerCase() === 'admin') return true;
  if (isCurrentStudent(user)) return false;

  const userId = user.id ? String(user.id) : null;
  const userProfileId = user.user_id ? String(user.user_id) : null;
  const userEmail = String(user.email || '').trim().toLowerCase();

  // 1. Check Admin verification overrides in localStorage (highest priority)
  try {
    const rawVerifications = localStorage.getItem('mcu_alumni_verifications');
    if (rawVerifications) {
      const verifications = JSON.parse(rawVerifications) || {};
      const ov =
        (userId && verifications[userId]) ||
        (userProfileId && verifications[userProfileId]) ||
        (userEmail && verifications[userEmail]);
      if (ov) {
        if (ov.is_verified === true || ov.verified === true || ov.verification_status === 'verified') {
          return true;
        }
        if (ov.is_verified === false || ov.verified === false || ov.verification_status === 'pending') {
          return false;
        }
      }
    }
  } catch {}

  // 2. Check matching record in alumniList (if provided)
  if (Array.isArray(alumniList) && alumniList.length > 0) {
    const matched = alumniList.find((a) => {
      if (!a) return false;
      if (userId && a.id && String(a.id) === userId) return true;
      if (userId && a.user_id && String(a.user_id) === userId) return true;
      if (userProfileId && a.id && String(a.id) === userProfileId) return true;
      if (userEmail && a.email && String(a.email).trim().toLowerCase() === userEmail) return true;
      return false;
    });
    if (matched) {
      if (matched.is_verified === true || matched.verified === true || matched.verification_status === 'verified') {
        return true;
      }
      if (matched.is_verified === false || matched.verified === false || matched.verification_status === 'pending') {
        return false;
      }
    }
  }

  // 3. Check custom alumni stored in localStorage
  try {
    const rawCustom = localStorage.getItem('mcu_custom_alumni');
    if (rawCustom) {
      const customList = JSON.parse(rawCustom) || [];
      const matchedCustom = customList.find((a) => {
        if (!a) return false;
        if (userId && a.id && String(a.id) === userId) return true;
        if (userId && a.user_id && String(a.user_id) === userId) return true;
        if (userEmail && a.email && String(a.email).trim().toLowerCase() === userEmail) return true;
        return false;
      });
      if (matchedCustom) {
        if (
          matchedCustom.is_verified === true ||
          matchedCustom.verified === true ||
          matchedCustom.verification_status === 'verified'
        ) {
          return true;
        }
        return false;
      }
    }
  } catch {}

  // 4. Direct user object flags
  if (user.verification_status === 'pending' || user.is_verified === false || user.verified === false) {
    return false;
  }
  if (user.is_verified === true || user.verified === true || user.verification_status === 'verified') {
    return true;
  }

  return false;
};

/**
 * Determines whether a logged-in user is permitted to post jobs/opportunities
 * and manage referral applications.
 * Only Admin-verified graduated Alumni and Portal Administrators can post jobs;
 * Current Students and unverified Alumni cannot.
 *
 * @param {Object} user Current logged-in user object
 * @param {Array} alumniList Optional alumni directory list
 * @returns {boolean} True if user can post jobs
 */
export const canUserPostJobs = (user, alumniList = []) => {
  if (!user) return false;
  if (user.is_admin || String(user.role || '').toLowerCase() === 'admin') return true;
  if (isCurrentStudent(user)) return false;
  return isVerifiedAlumnus(user, alumniList);
};

/**
 * Sincerely normalizes any alumnus profile (from mockData, localStorage, or Go/MySQL backend)
 * so that its department, degree, role, company, bio, and skills are 100% Computer Department focused.
 */
export const normalizeComputerProfile = (rawProfile, computerTemplates = []) => {
  if (!rawProfile) return rawProfile;

  const rawName = String(rawProfile.name || rawProfile.full_name || '').trim();
  const rawEmail = String(rawProfile.email || '').trim().toLowerCase();
  const rawId = String(rawProfile.id || '');
  const studentAccount = isCurrentStudent(rawProfile);

  // 1. Check if this profile matches one of our 10 canonical Computer Department templates
  const matchedTemplate = Array.isArray(computerTemplates)
    ? computerTemplates.find(
        (t) =>
          (t.id && String(t.id) === rawId) ||
          (t.email && t.email.toLowerCase() === rawEmail) ||
          (t.name && rawName && t.name.toLowerCase() === rawName.toLowerCase())
      )
    : null;

  const currentRoleRaw = String(rawProfile.currentRole || rawProfile.current_role || '').trim();
  const degreeRaw = String(rawProfile.degree || '').trim();
  const companyRaw = String(rawProfile.company || '').trim();
  const bioRaw = String(rawProfile.bio || '').trim();

  const isLegacyRole =
    !currentRoleRaw ||
    NON_COMPUTER_ROLE_PATTERNS.some((pat) => currentRoleRaw.toLowerCase().includes(pat));

  const isLegacyDegree =
    !degreeRaw ||
    NON_COMPUTER_DEGREE_PATTERNS.some((pat) => degreeRaw.toLowerCase().includes(pat));

  const isLegacyCompany =
    !companyRaw ||
    NON_COMPUTER_COMPANY_PATTERNS.some((pat) => companyRaw.toLowerCase().includes(pat));

  const isDefaultAlumnusBioOnStudent =
    studentAccount &&
    (bioRaw.toLowerCase().includes('alumnus') ||
      bioRaw.toLowerCase().includes('alumni') ||
      bioRaw.toLowerCase().includes('actively building') ||
      bioRaw.includes('पूर्व छात्र'));

  const isOldAutoGeneratedAlumniBio =
    !studentAccount &&
    (bioRaw
      .toLowerCase()
      .startsWith('computer science & applications alumnus from makhanlal chaturvedi national university') ||
      bioRaw
        .toLowerCase()
        .startsWith('computer science & applications alumnus of makhanlal chaturvedi national university') ||
      bioRaw
        .toLowerCase()
        .includes('specializing in full-stack software engineering, cloud architecture, and modern web systems'));

  const isLegacyBio =
    !bioRaw ||
    NON_COMPUTER_BIO_PATTERNS.some((pat) => bioRaw.toLowerCase().includes(pat)) ||
    isDefaultAlumnusBioOnStudent ||
    isOldAutoGeneratedAlumniBio;

  const finalRole = isLegacyRole
    ? studentAccount
      ? 'Student • Computer Science & Applications'
      : matchedTemplate?.currentRole || 'Full Stack Software Engineer'
    : currentRoleRaw;

  const finalDegree = isLegacyDegree
    ? matchedTemplate?.degree || 'Master of Computer Applications (MCA)'
    : degreeRaw;

  const finalCompany = isLegacyCompany
    ? studentAccount
      ? 'MCU Bhopal (Current Student)'
      : matchedTemplate?.company || (companyRaw === 'MCU Alumnus' ? 'Tech & Software Solutions (MCU IT)' : 'Software & Cloud Engineering')
    : companyRaw === 'MCU' && studentAccount
    ? 'MCU Bhopal (Current Student)'
    : companyRaw;

  const finalLocation =
    (isLegacyCompany && matchedTemplate?.location)
      ? matchedTemplate.location
      : rawProfile.location || matchedTemplate?.location || 'Bhopal / Bengaluru, India';

  const finalBio = isLegacyBio
    ? studentAccount
      ? 'Student at Makhanlal Chaturvedi National University.'
      : matchedTemplate?.bio ||
        'Proud alumnus of Makhanlal Chaturvedi National University.'
    : bioRaw;

  const isCoreTemplateRecord = Boolean(matchedTemplate) || rawId.startsWith('alm-');
  const resolvedIsVerified = isCoreTemplateRecord
    ? !(rawProfile.is_verified === false || rawProfile.verification_status === 'pending')
    : Boolean(
        rawProfile.is_verified === true ||
          rawProfile.verified === true ||
          rawProfile.verification_status === 'verified'
      );

  const normalized = {
    ...rawProfile,
    name: rawName || matchedTemplate?.name || 'MCU Computer Dept Alumnus',
    full_name: rawName || matchedTemplate?.name || 'MCU Computer Dept Alumnus',
    hindiName: rawProfile.hindiName || rawProfile.hindi_name || matchedTemplate?.hindiName || rawName,
    role: studentAccount ? 'student' : (rawProfile.role || 'alumni'),
    is_student: studentAccount,
    member_category: studentAccount ? 'Current Student' : (rawProfile.member_category || 'Alumnus (Graduate)'),
    department: 'computer_app',
    department_name: 'Computer Applications (IT)',
    degree: finalDegree,
    currentRole: finalRole,
    current_role: finalRole,
    company: finalCompany,
    location: finalLocation,
    bio: finalBio,
    is_verified: resolvedIsVerified,
    verified: resolvedIsVerified,
    verification_status: resolvedIsVerified ? 'verified' : 'pending',
    openToMentor: studentAccount ? false : Boolean(rawProfile.openToMentor ?? rawProfile.open_to_mentor),
    open_to_mentor: studentAccount ? false : Boolean(rawProfile.open_to_mentor ?? rawProfile.openToMentor),
    mentorshipTopics:
      matchedTemplate?.mentorshipTopics ||
      rawProfile.mentorshipTopics || [
        'Full Stack Software Development',
        'System Design & Cloud Architecture',
        'Tech Interviews & Career Growth'
      ]
  };

  normalized.skills = getProfileSkills(
    matchedTemplate && isLegacyRole ? { ...normalized, skills: matchedTemplate.skills } : normalized
  );

  return normalized;
};
