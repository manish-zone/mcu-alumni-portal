import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  Camera,
  Upload,
  Check,
  Sparkles,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Phone,
  Link as LinkIcon,
  User,
  Save,
  Plus,
  Tag,
  Send,
  PlusCircle,
  Radio,
  Trash2,
  Laptop,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Mail,
  Search,
  PartyPopper,
  Compass,
  Calendar,
  Video
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { authAPI, jobsAPI } from '../services/api';
import { getProfileSkills, getSuggestedSkills, isCurrentStudent, isVerifiedAlumnus } from '../utils/skills';
import { getApplicationDedupeKey, deduplicateApplications } from '../utils/applications';
import { processHighQualityImage, isSupportedImageFile } from '../utils/imageProcessor';
import { ResumePreviewModal } from './ResumePreviewModal';
import { FormProgressBar } from './FormProgressBar';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
];

export const EditProfileModal = ({
  user,
  isVerifiedAlumni = false,
  allJobs = [],
  receivedApplications = [],
  mySubmittedApplications = [],
  receivedMentorshipRequests = [],
  myMentorshipRequests = [],
  initialTab = 'photo',
  onClose,
  onProfileUpdated,
  onJobPosted,
  onDeleteJob,
  onUpdateApplicationStatus,
  onDeleteApplication,
  onUpdateMentorshipStatus,
  onDeleteMentorshipRequest
}) => {
  const { lang, t } = useLanguage();
  const fileInputRef = useRef(null);
  const isStudent = isCurrentStudent(user);
  const isVerified = Boolean(user?.is_admin || user?.role === 'admin' || isVerifiedAlumni || isVerifiedAlumnus(user));

  const isOwner = (job) => {
    if (!job || !user) return false;
    try {
      const userJobKey = `mcu_my_job_ids_${user.id || user.email}`;
      const myJobIds = JSON.parse(localStorage.getItem(userJobKey) || '[]');
      if (myJobIds.includes(job.id) || myJobIds.includes(job.dbId)) return true;
    } catch {}

    if (job.authorEmail && user.email && job.authorEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (job.authorId && user.id && job.authorId === user.id) return true;
    if (job.posted_by_user_id && user.id && Number(job.posted_by_user_id) === Number(user.id)) return true;
    if (job.referral_alumnus_email && user.email && job.referral_alumnus_email.toLowerCase() === user.email.toLowerCase()) return true;

    // Fallback: only match postedBy if job does NOT belong to someone else's ID or email
    if (!job.posted_by_user_id && !job.authorEmail && !job.authorId) {
      const cName = (user.name || user.full_name || '').toLowerCase().trim();
      if (cName && job.postedBy && job.postedBy.toLowerCase().includes(cName)) return true;
    }
    return false;
  };

  const myPostedJobs = allJobs.filter(isOwner);

  // Check if current user is the applicant who submitted the referral request
  const isApplicantForUser = (app) => {
    if (!app || !user) return false;
    const curEmail = (user.email || '').toLowerCase().trim();
    const curId = user.id ? String(user.id) : null;
    if (app.applicant_user_id && curId && String(app.applicant_user_id) === curId) return true;
    if (app.applicant_email && curEmail && app.applicant_email.toLowerCase().trim() === curEmail) return true;
    return false;
  };

  // Compute received applications belonging to this alumnus (strictly incoming)
  const isApplicationForUser = (app) => {
    if (!app || !user) return false;
    if (isApplicantForUser(app)) return false; // The applicant never receives notification for their own application!

    const curEmail = (user.email || '').toLowerCase().trim();
    const curId = user.id ? String(user.id) : null;
    const uName = (user.full_name || user.name || '').toLowerCase().trim();

    if (app.alumni_id && curId && String(app.alumni_id) === curId) return true;
    if (app.alumni_email && curEmail && app.alumni_email.toLowerCase().trim() === curEmail) return true;
    if (uName && app.alumni_name && app.alumni_name.toLowerCase().includes(uName)) return true;
    if (myPostedJobs.some((j) => j.id === app.job_id || j.dbId === app.job_id || (j.title && app.job_title && j.title.toLowerCase() === app.job_title.toLowerCase()))) {
      return true;
    }
    return false;
  };

  const getCombinedApplications = () => {
    let localApps = [];
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_received_applications') || '[]');
      if (Array.isArray(stored)) {
        localApps = stored;
      }
    } catch {}

    const allCandidateApps = [...(receivedApplications || []), ...localApps];
    const seen = new Set();
    const result = [];
    for (const app of allCandidateApps) {
      if (!app) continue;
      const key = getApplicationDedupeKey(app);
      if (!key || !seen.has(key)) {
        if (key) seen.add(key);
        if (isApplicationForUser(app)) {
          result.push(app);
        }
      }
    }
    return result;
  };

  const myApplications = getCombinedApplications();

  // Compute submitted applications by the current user (Outgoing / My Applied Jobs)
  const getCombinedSubmittedApplications = () => {
    let localApps = [];
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_received_applications') || '[]');
      if (Array.isArray(stored)) {
        localApps = stored;
      }
    } catch {}

    const allCandidateApps = [...(mySubmittedApplications || []), ...localApps];
    const seen = new Set();
    const result = [];
    for (const app of allCandidateApps) {
      if (!app) continue;
      const key = getApplicationDedupeKey(app);
      if (!key || !seen.has(key)) {
        if (key) seen.add(key);
        if (isApplicantForUser(app)) {
          result.push(app);
        }
      }
    }
    return result;
  };

  const submittedApplicationsList = getCombinedSubmittedApplications();
  const acceptedApplicationsList = submittedApplicationsList.filter(
    (a) => a.status === 'referred' || a.status === 'accepted'
  );

  // Mentorship Request Matching & Deduplication
  const [localDeletedMentorshipSigs, setLocalDeletedMentorshipSigs] = useState([]);

  const getMentorshipDedupeKey = (req) => {
    if (!req) return '';
    const sEmail = (req.mentee_email || req.mentee_name || String(req.mentee_user_id || '')).toLowerCase().trim();
    const topic = (req.topic || '').toLowerCase().trim();
    const msg = (req.message || '').toLowerCase().trim();
    return `${sEmail}|${topic}|${msg}`;
  };

  const getMentorshipSignatures = (req) => {
    if (!req) return [];
    const sigs = [];
    if (req.id !== undefined && req.id !== null) sigs.push(`id:${String(req.id)}`);
    if (req.dbId !== undefined && req.dbId !== null) sigs.push(`id:${String(req.dbId)}`);
    const dedupeKey = getMentorshipDedupeKey(req);
    if (dedupeKey) sigs.push(`key:${dedupeKey}`);
    const sEmail = (req.mentee_email || '').toLowerCase().trim();
    const topic = (req.topic || '').toLowerCase().trim();
    if (sEmail || topic) sigs.push(`et:${sEmail}|${topic}`);
    return sigs;
  };

  const isMentorshipDeleted = (req) => {
    if (!req) return true;
    const sigs = getMentorshipSignatures(req);
    if (localDeletedMentorshipSigs.some((s) => sigs.includes(s))) return true;
    try {
      const storedDeleted = JSON.parse(localStorage.getItem('mcu_deleted_mentorship_keys') || '[]');
      if (Array.isArray(storedDeleted) && storedDeleted.some((s) => sigs.includes(s))) {
        return true;
      }
    } catch {}
    return false;
  };

  const handleLocalDeleteMentorship = (req) => {
    if (!req) return;
    const sigs = getMentorshipSignatures(req);
    setLocalDeletedMentorshipSigs((prev) => Array.from(new Set([...prev, ...sigs])));
    if (onDeleteMentorshipRequest) {
      onDeleteMentorshipRequest(req);
    }
  };

  const isMenteeForUser = (req) => {
    if (!req || !user) return false;
    const curEmail = (user.email || '').toLowerCase().trim();
    const curId = user.id ? String(user.id) : null;
    if (req.mentee_user_id && curId && String(req.mentee_user_id) === curId) return true;
    if (req.mentee_email && curEmail && req.mentee_email.toLowerCase().trim() === curEmail) return true;
    return false;
  };

  const isMentorForUser = (req) => {
    if (!req || !user) return false;
    if (isMenteeForUser(req)) return false;
    const curEmail = (user.email || '').toLowerCase().trim();
    const curId = user.id ? String(user.id) : null;
    const uName = (user.full_name || user.name || '').toLowerCase().trim();

    if (req.mentor_id && curId && String(req.mentor_id) === curId) return true;
    if (req.mentor_email && curEmail && req.mentor_email.toLowerCase().trim() === curEmail) return true;
    if (uName && req.mentor_name && req.mentor_name.toLowerCase().trim().includes(uName)) return true;
    return false;
  };

  const getCombinedMentorshipRequests = (mode = 'mentor') => {
    let localReqs = [];
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_mentorship_requests') || '[]');
      if (Array.isArray(stored)) localReqs = stored;
    } catch {}

    const baseList = mode === 'mentor' ? (receivedMentorshipRequests || []) : (myMentorshipRequests || []);
    const allCandidates = [...baseList, ...localReqs];
    const mapByKey = new Map();

    for (const req of allCandidates) {
      if (!req || isMentorshipDeleted(req)) continue;
      const matches = mode === 'mentor' ? isMentorForUser(req) : isMenteeForUser(req);
      if (!matches) continue;
      const key = getMentorshipDedupeKey(req) || String(req.id);
      const numericId =
        req.dbId ||
        (req.id && !String(req.id).startsWith('mentor-req-') && !isNaN(req.id) ? req.id : null);
      const normalizedReq = numericId ? { ...req, dbId: numericId } : req;

      const existing = mapByKey.get(key);
      if (!existing) {
        mapByKey.set(key, normalizedReq);
      } else {
        const mergedDbId = existing.dbId || normalizedReq.dbId || null;
        // Prefer whichever entry has a scheduled/updated status or session_date
        const existingScheduled = existing.status === 'scheduled' || existing.status === 'accepted' || existing.session_date;
        const currentScheduled = normalizedReq.status === 'scheduled' || normalizedReq.status === 'accepted' || normalizedReq.session_date;
        if (currentScheduled && !existingScheduled) {
          mapByKey.set(key, { ...existing, ...normalizedReq, dbId: mergedDbId });
        } else {
          mapByKey.set(key, { ...normalizedReq, ...existing, dbId: mergedDbId });
        }
      }
    }
    return Array.from(mapByKey.values());
  };

  const incomingMentorshipList = getCombinedMentorshipRequests('mentor');
  const outgoingMentorshipList = getCombinedMentorshipRequests('mentee');
  const pendingIncomingMentorshipCount = incomingMentorshipList.filter(
    (r) => !r.status || r.status === 'pending'
  ).length;
  const scheduledOutgoingMentorshipCount = outgoingMentorshipList.filter(
    (r) => r.status === 'scheduled' || r.status === 'accepted'
  ).length;

  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduledToastId, setScheduledToastId] = useState(null);

  const getDefaultTomorrowDate = () => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  };

  const getScheduleDraft = (req) => {
    const key = req.id || getMentorshipDedupeKey(req);
    const saved = scheduleDrafts[key] || {};
    return {
      session_date: saved.session_date !== undefined ? saved.session_date : (req.session_date || getDefaultTomorrowDate()),
      session_time: saved.session_time !== undefined ? saved.session_time : (req.session_time || req.preferred_slot || '6:00 PM - 6:45 PM IST'),
      session_mode: saved.session_mode !== undefined ? saved.session_mode : (req.session_mode || 'Google Meet (Video Session)'),
      meeting_link: saved.meeting_link !== undefined ? saved.meeting_link : (req.meeting_link || 'https://meet.google.com/mcu-mentor-connect'),
      mentor_note: saved.mentor_note !== undefined ? saved.mentor_note : (req.mentor_note || 'I am free at this slot. Looking forward to guiding you on your career goals!'),
    };
  };

  const updateScheduleDraft = (req, field, value) => {
    const key = req.id || getMentorshipDedupeKey(req);
    const current = getScheduleDraft(req);
    setScheduleDrafts((prev) => ({
      ...prev,
      [key]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const handleScheduleMentorshipSession = async (req, targetStatus = 'scheduled') => {
    if (!onUpdateMentorshipStatus) return;
    const key = req.id || getMentorshipDedupeKey(req);
    setSchedulingId(key);
    try {
      const draft = getScheduleDraft(req);
      await onUpdateMentorshipStatus(req, {
        status: targetStatus,
        session_date: draft.session_date,
        session_time: draft.session_time,
        session_mode: draft.session_mode,
        meeting_link: draft.meeting_link,
        mentor_note: draft.mentor_note,
      });
      if (targetStatus === 'scheduled' || targetStatus === 'accepted') {
        setScheduledToastId(key);
        setTimeout(() => setScheduledToastId(null), 4000);
        try {
          confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
        } catch {}
      }
    } finally {
      setSchedulingId(null);
    }
  };

  const applyTechPreset = (title, tags, desc) => {
    setJobFormData((prev) => ({
      ...prev,
      title: title || prev.title,
      tags: tags || prev.tags,
      description: desc || prev.description,
      location: prev.location || 'Bengaluru / Remote'
    }));
  };

  const sanitizeInitialValue = (val, legacyDefaults = []) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (legacyDefaults.some((d) => d.toLowerCase() === trimmed.toLowerCase())) return '';
    return trimmed;
  };

  const [formData, setFormData] = useState({
    name: user?.full_name || user?.name || '',
    hindiName: user?.hindi_name || user?.hindiName || '',
    phone: user?.phone || '',
    currentRole: sanitizeInitialValue(user?.current_role || user?.currentRole || user?.role_title, ['Media Professional']),
    company: sanitizeInitialValue(user?.company, ['MCU Alumnus']),
    location: user?.location || '',
    batchYear: user?.batch_year || user?.batch || '2024',
    degree: sanitizeInitialValue(user?.degree, ['Master of Journalism (MJ)', 'Master of Journalism']),
    bio: user?.bio || '',
    linkedin: user?.linkedin_url || user?.linkedIn || user?.linkedin || '',
    avatar: user?.avatar_url || user?.avatar || '',
    openToMentor: user?.open_to_mentor ?? user?.openToMentor ?? true,
    skills: (Array.isArray(user?.skills) && user.skills.length > 0) ? user.skills : getProfileSkills(user),
  });

  const [jobFormData, setJobFormData] = useState({
    title: '',
    company: sanitizeInitialValue(user?.company, ['MCU Alumnus']),
    postedBy: user ? `${user.full_name || user.name || ''} (Batch of ${user.batch_year || user.batch || '2024'})`.trim() : '',
    location: user?.location || 'Bhopal / Indore / Remote',
    type: 'Full-time',
    experience: '1-3 Years (Freshers Welcome)',
    salary: '₹6 - 12 LPA',
    deadline: '30 Days',
    description: '',
    tags: 'React, Node.js, Python, Computer Dept Referral'
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const resolvedInitialTab =
    isStudent && (initialTab === 'job' || initialTab === 'applications')
      ? 'details'
      : initialTab || 'photo';
  const [activeTab, setActiveTab] = useState(resolvedInitialTab); // 'photo' | 'details' | 'job' | 'applications' | 'my_applications'
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [previewingApp, setPreviewingApp] = useState(null);

  useEffect(() => {
    if (initialTab) {
      if (isStudent && (initialTab === 'job' || initialTab === 'applications')) {
        setActiveTab('details');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, isStudent]);

  const filteredApplications = myApplications.filter((app) => {
    if (!app) return false;
    // Filter by status
    if (applicationFilter === 'submitted') {
      if (app.status !== 'submitted' && app.status !== 'pending') return false;
    } else if (applicationFilter === 'under_review') {
      if (app.status !== 'under_review') return false;
    } else if (applicationFilter === 'referred') {
      if (app.status !== 'referred' && app.status !== 'accepted') return false;
    } else if (applicationFilter === 'rejected') {
      if (app.status !== 'rejected') return false;
    }

    // Filter by search query
    if (applicationSearch.trim()) {
      const q = applicationSearch.toLowerCase().trim();
      const name = (app.applicant_name || '').toLowerCase();
      const title = (app.job_title || '').toLowerCase();
      const deg = (app.applicant_degree || '').toLowerCase();
      const email = (app.applicant_email || '').toLowerCase();
      if (!name.includes(q) && !title.includes(q) && !deg.includes(q) && !email.includes(q)) {
        return false;
      }
    }
    return true;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sync state if user prop updates or changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user?.full_name || user?.name || prev.name || '',
        hindiName: user?.hindi_name || user?.hindiName || prev.hindiName || '',
        phone: user?.phone || prev.phone || '',
        currentRole: sanitizeInitialValue(user?.current_role || user?.currentRole || user?.role_title || prev.currentRole, ['Media Professional']),
        company: sanitizeInitialValue(user?.company || prev.company, ['MCU Alumnus']),
        location: user?.location || prev.location || '',
        batchYear: user?.batch_year || user?.batch || prev.batchYear || '2024',
        degree: sanitizeInitialValue(user?.degree || prev.degree, ['Master of Journalism (MJ)', 'Master of Journalism']),
        bio: user?.bio || prev.bio || '',
        linkedin: user?.linkedin_url || user?.linkedIn || user?.linkedin || prev.linkedin || '',
        avatar: user?.avatar_url || user?.avatar || '',
        openToMentor: user?.open_to_mentor ?? user?.openToMentor ?? prev.openToMentor ?? true,
        skills: (Array.isArray(user?.skills) && user.skills.length > 0) ? user.skills : (prev.skills?.length > 0 ? prev.skills : getProfileSkills(user)),
      }));
      setIsAvatarRemoved(false);
    }
  }, [user]);

  const handleAddSkill = (skillToAdd) => {
    const skill = (typeof skillToAdd === 'string' ? skillToAdd : newSkillInput).trim();
    if (!skill) return;
    if (formData.skills?.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setNewSkillInput('');
      return;
    }
    if ((formData.skills?.length || 0) >= 12) {
      setErrorMessage(lang === 'hi' ? 'अधिकतम 12 कौशल जोड़े जा सकते हैं।' : 'Maximum 12 skills can be added.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), skill],
    }));
    setNewSkillInput('');
    setErrorMessage(null);
  };

  const handleRemoveSkill = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Handle local image file upload (including HEIC/HEIF) with high-definition auto-resize & zero quality loss
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया केवल वैध इमेज फ़ाइल (HEIC, HEIF, JPG, PNG, WEBP) चुनें।'
          : 'Please choose a valid image file (HEIC, HEIF, JPG, PNG, WEBP).'
      );
      return;
    }

    setErrorMessage(null);
    try {
      const processed = await processHighQualityImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.94,
      });
      setFormData((prev) => ({ ...prev, avatar: processed.dataUrl }));
      setIsAvatarRemoved(false);
    } catch {
      setErrorMessage(lang === 'hi' ? 'इमेज लोड करने में असमर्थ।' : 'Failed to read image.');
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const cleanName = (formData.name || '').trim() || (user?.full_name || user?.name || user?.email?.split('@')[0] || 'MCU Alumnus');
      const cleanRole = (formData.currentRole || '').trim() || 'Software Engineer';
      const cleanCompany = (formData.company || '').trim() || 'Technology Firm';
      const cleanLocation = (formData.location || '').trim() || 'Bhopal / Remote';
      const cleanBatch = parseInt(formData.batchYear, 10) || 2024;

      const isCleared = isAvatarRemoved || !formData.avatar || (typeof formData.avatar === 'string' && formData.avatar.trim() === '');
      const payload = {
        name: cleanName,
        first_name: cleanName.split(' ')[0],
        last_name: cleanName.split(' ').slice(1).join(' '),
        hindi_name: (formData.hindiName || '').trim(),
        phone: (formData.phone || '').trim(),
        current_role: cleanRole,
        company: cleanCompany,
        location: cleanLocation,
        batch_year: cleanBatch,
        degree: (formData.degree || '').trim() || 'BCA (Bachelor of Computer Applications)',
        bio: (formData.bio || '').trim(),
        linkedin_url: (formData.linkedin || '').trim(),
        avatar_url: isCleared ? '' : formData.avatar,
        avatar: isCleared ? '' : formData.avatar,
        remove_avatar: isCleared,
        removeAvatar: isCleared,
        open_to_mentor: formData.openToMentor,
        skills: formData.skills || [],
      };

      const updatedUser = await authAPI.updateProfile(payload);

      const resolvedUpdatedUser = {
        ...(user || {}),
        ...(updatedUser || {}),
        ...payload,
        skills: (updatedUser?.skills && updatedUser.skills.length > 0) ? updatedUser.skills : (formData.skills || []),
        avatar_url: isCleared ? null : (updatedUser?.avatar_url || payload.avatar_url || null),
        avatar: isCleared ? null : (updatedUser?.avatar || updatedUser?.avatar_url || payload.avatar || null),
      };

      if (onProfileUpdated) {
        onProfileUpdated(resolvedUpdatedUser);
      }
      onClose();
    } catch (err) {
      console.error('[Profile Update Error]', err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBroadcastJob = async (e) => {
    if (e) e.preventDefault();
    if (!isVerified) {
      setErrorMessage(
        lang === 'hi'
          ? '🔒 एडमिन सत्यापन लंबित: एमसीयू एडमिन द्वारा आपकी पूर्व छात्र प्रोफ़ाइल सत्यापित होने के बाद ही आप जॉब पोस्ट कर सकते हैं।'
          : '🔒 Admin Verification Pending: You can post job opportunities only after MCU Admin verifies your Alumni profile.'
      );
      return;
    }
    if (!jobFormData.title.trim() || !jobFormData.company.trim() || !jobFormData.description.trim()) {
      setErrorMessage(lang === 'hi' ? 'कृपया अवसर का पद (Title), संस्थान (Company) एवं विवरण अवश्य भरें।' : 'Please fill in Job Title, Company, and Description.');
      return;
    }
    setIsPostingJob(true);
    setErrorMessage(null);

    const posterName = jobFormData.postedBy.trim() || `${formData.name || user?.full_name || user?.name || 'MCU Alumnus'} (Batch of ${formData.batchYear || user?.batch_year || '2023'})`;
    const isAdminUser = Boolean(user?.is_admin || user?.role === 'admin');
    const isPosterVerified = Boolean(isAdminUser || isVerified);
    const newJob = {
      id: `job-${Date.now()}`,
      title: jobFormData.title.trim(),
      company: jobFormData.company.trim(),
      company_name: jobFormData.company.trim(),
      postedBy: posterName,
      location: jobFormData.location.trim() || 'Bhopal / Indore / Remote',
      type: jobFormData.type,
      job_type: jobFormData.type,
      experience: jobFormData.experience.trim() || '1-3 Years',
      experience_required: jobFormData.experience.trim() || '1-3 Years',
      salary: jobFormData.salary.trim() || 'Competitive',
      salary_range: jobFormData.salary.trim() || 'Competitive',
      deadline: jobFormData.deadline.trim() || '30 Days',
      deadline_date: jobFormData.deadline.trim() || '30 Days',
      description: jobFormData.description.trim(),
      referral_alumnus_name: posterName,
      authorEmail: user?.email || '',
      posted_by_email: user?.email || '',
      authorId: user?.id || null,
      posted_by_user_id: user?.id || null,
      approval_status: isAdminUser ? 'approved' : 'pending',
      poster_verified: isPosterVerified,
      created_at: new Date().toISOString(),
      tags: jobFormData.tags ? jobFormData.tags.split(',').map((t) => t.trim()).filter(Boolean) : ['Computer Dept', 'Alumni Referral']
    };

    // Save ID to local storage so creator can always track and delete it
    try {
      const myJobIds = JSON.parse(localStorage.getItem('mcu_my_job_ids') || '[]');
      if (!myJobIds.includes(newJob.id)) {
        myJobIds.push(newJob.id);
        localStorage.setItem('mcu_my_job_ids', JSON.stringify(myJobIds));
      }
    } catch {}

    // Synchronize with backend jobs microservice (:8004 via gateway :8000)
    try {
      const createPromise = jobsAPI.create({
        title: newJob.title,
        company_name: newJob.company,
        location: newJob.location,
        job_type: newJob.type,
        experience_required: newJob.experience,
        salary_range: newJob.salary,
        deadline_date: newJob.deadline,
        description: newJob.description,
        referral_alumnus_name: newJob.postedBy,
        author_email: user?.email || 'alumni@mcu.ac.in',
        posted_by_user_id: user?.id || 13,
      });
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), 3500));
      const res = await Promise.race([createPromise, timeoutPromise]);
      if (res && res.id) {
        newJob.dbId = res.id;
        try {
          const myJobIds = JSON.parse(localStorage.getItem('mcu_my_job_ids') || '[]');
          if (!myJobIds.includes(res.id)) {
            myJobIds.push(res.id);
            localStorage.setItem('mcu_my_job_ids', JSON.stringify(myJobIds));
          }
        } catch {}
      }
    } catch (err) {
      console.log('Background API job sync completed or saved locally:', err?.message || err);
    } finally {
      setIsPostingJob(false);
    }

    try {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
    } catch {}

    if (onJobPosted) {
      onJobPosted(newJob);
    }
    onClose();
  };

  const profileFields = [
    Boolean(formData.avatar && typeof formData.avatar === 'string' && formData.avatar.trim() !== ''),
    Boolean(formData.name?.trim().length >= 2),
    Boolean(formData.phone?.trim().length >= 8),
    Boolean(formData.currentRole?.trim().length >= 2),
    Boolean(formData.company?.trim().length >= 2),
    Boolean(formData.location?.trim().length >= 2),
    Boolean(String(formData.batchYear || '').trim().length >= 4),
    Boolean(formData.degree?.trim().length >= 2),
    Boolean(formData.bio?.trim().length >= 10),
    Boolean(formData.skills?.length > 0),
  ];
  const profileCompleted = profileFields.filter(Boolean).length;
  const profilePercentage = Math.round((profileCompleted / profileFields.length) * 100);

  const broadcastFields = [
    Boolean(jobFormData.title?.trim().length >= 3),
    Boolean(jobFormData.company?.trim().length >= 2),
    Boolean(jobFormData.postedBy?.trim().length >= 2),
    Boolean(jobFormData.location?.trim().length >= 2),
    Boolean(jobFormData.experience?.trim()),
    Boolean(jobFormData.description?.trim().length >= 10),
    Boolean(jobFormData.tags?.trim().length >= 2),
  ];
  const broadcastCompleted = broadcastFields.filter(Boolean).length;
  const broadcastPercentage = Math.round((broadcastCompleted / broadcastFields.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="mcu-animated-border-modal mcu-modal-spring-enter bg-gradient-to-b from-white via-[#fafdff] to-[#f4f9ff] w-full max-w-[820px] rounded-2xl sm:rounded-3xl border border-sky-200/80 shadow-[0_28px_70px_-12px_rgba(2,132,199,0.26),0_10px_28px_-6px_rgba(0,34,68,0.16)] overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Institutional Header */}
        <div className="relative bg-gradient-to-r from-[#001a35] via-[#002855] to-[#001e3d] px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[3px] mcu-accent-bar-animated" />
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-sky-400/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#fc4a00]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            <div className="relative w-13 h-13 sm:w-15 sm:h-15 shrink-0 flex items-center justify-center">
              <div className="mcu-logo-aura absolute -inset-1 rounded-full bg-gradient-to-tr from-sky-400/25 via-amber-400/15 to-[#fc4a00]/25 blur-md pointer-events-none" />
              <img
                src="/mcu-logo.png"
                alt="MCU Bhopal Crest"
                className="mcu-logo-nav-alive relative z-10 w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase text-sky-200/90 leading-tight truncate">
                  {lang === 'hi' ? 'माखनलाल चतुर्वेदी राष्ट्रीय वि.वि., भोपाल' : 'Makhanlal Chaturvedi University · Bhopal'}
                </p>
                <span className="hidden min-[420px]:inline-flex items-center px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-gradient-to-b from-[#ff6a00] to-[#fc4a00] text-white rounded-full border border-amber-300/60 shadow-2xs shrink-0">
                  ESTD 1990
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <h3 className="text-base sm:text-[18px] font-bold text-white font-editorial leading-snug tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {lang === 'hi' ? 'प्रोफ़ाइल फ़ोटो एवं विवरण बदलें' : 'Edit Profile & Details'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                  {lang === 'hi' ? 'प्रोफ़ाइल प्रबंधन' : 'Profile Management'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-red-500/90 text-white/80 hover:text-white border border-white/20 hover:border-red-400 flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Sculpted Water-Glass Tab Navigation Dock */}
        <div
          className={`grid ${
            isStudent ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
          } border-b border-sky-200/90 bg-gradient-to-b from-sky-100/75 via-sky-50/85 to-white p-2 sm:px-3 gap-1.5 shrink-0 items-center shadow-[inset_0_2px_4px_rgba(2,132,199,0.1)]`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`w-full min-w-0 py-2 px-2 rounded-xl text-xs sm:text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white shadow-[0_5px_14px_-2px_rgba(252,74,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] border border-amber-300/60'
                : 'text-[#002855] hover:bg-white/90 hover:text-[#003366] border border-transparent hover:border-sky-300/70'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'photo' ? 'text-amber-200' : 'text-[#0284c7]'}`} />
            <span className="truncate">{lang === 'hi' ? '1. फ़ोटो' : '1. Photo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`w-full min-w-0 py-2 px-2 rounded-xl text-xs sm:text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'details'
                ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white shadow-[0_5px_14px_-2px_rgba(252,74,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] border border-amber-300/60'
                : 'text-[#002855] hover:bg-white/90 hover:text-[#003366] border border-transparent hover:border-sky-300/70'
            }`}
          >
            <User className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'details' ? 'text-amber-200' : 'text-[#0284c7]'}`} />
            <span className="truncate">{lang === 'hi' ? '2. व्यक्तिगत विवरण' : '2. Personal Info'}</span>
          </button>

          {!isStudent && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('job')}
                className={`w-full min-w-0 py-2 px-2 rounded-xl text-xs sm:text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'job'
                    ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white shadow-[0_5px_14px_-2px_rgba(252,74,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] border border-amber-300/60'
                    : 'text-[#002855] hover:bg-white/90 hover:text-[#003366] border border-transparent hover:border-sky-300/70'
                }`}
              >
                <Briefcase className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'job' ? 'text-amber-200' : 'text-[#8d0303]'}`} />
                <span className="truncate">{lang === 'hi' ? '3. अवसर' : '3. Manage Jobs'}</span>
                {myPostedJobs && myPostedJobs.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold whitespace-nowrap shrink-0">
                    {myPostedJobs.length} {lang === 'hi' ? 'सक्रिय' : 'Live'}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('applications')}
                className={`w-full min-w-0 py-2 px-2 rounded-xl text-xs sm:text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'applications'
                    ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white shadow-[0_5px_14px_-2px_rgba(252,74,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] border border-amber-300/60'
                    : 'text-[#002855] hover:bg-white/90 hover:text-[#003366] border border-transparent hover:border-sky-300/70'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'applications' ? 'text-amber-200' : 'text-[#0284c7]'}`} />
                <span className="truncate">{lang === 'hi' ? '4. प्राप्त आवेदन' : '4. Received'}</span>
                {myApplications && myApplications.length > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-bold animate-pulse whitespace-nowrap shrink-0">
                    {myApplications.length}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-[#003366] font-bold whitespace-nowrap shrink-0">
                    0
                  </span>
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('my_applications')}
            className={`w-full min-w-0 py-2 px-2 rounded-xl text-xs sm:text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'my_applications'
                ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white shadow-[0_5px_14px_-2px_rgba(252,74,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] border border-amber-300/60'
                : 'text-[#002855] hover:bg-white/90 hover:text-[#003366] border border-transparent hover:border-sky-300/70'
            }`}
          >
            <Send className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'my_applications' ? 'text-amber-200' : 'text-[#8d0303]'}`} />
            <span className="truncate">
              {isStudent
                ? (lang === 'hi' ? '3. मेरे आवेदन' : '3. My Applied Jobs')
                : (lang === 'hi' ? '5. मेरे आवेदन' : '5. Applied')}
            </span>
            {submittedApplicationsList && submittedApplicationsList.length > 0 ? (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 ${
                acceptedApplicationsList.length > 0
                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                  : 'bg-sky-100 text-[#003366]'
              }`}>
                {acceptedApplicationsList.length > 0 ? (
                  <>
                    <span>🎉</span>
                    <span>{lang === 'hi' ? `${acceptedApplicationsList.length}` : `${acceptedApplicationsList.length}`}</span>
                  </>
                ) : (
                  submittedApplicationsList.length
                )}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-[#003366] font-bold whitespace-nowrap shrink-0">
                0
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mentorship')}
            className={`w-full min-w-0 py-2 px-2 rounded-xl text-xs sm:text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'mentorship'
                ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white shadow-[0_5px_14px_-2px_rgba(252,74,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] border border-amber-300/60'
                : 'text-[#002855] hover:bg-white/90 hover:text-[#003366] border border-transparent hover:border-sky-300/70'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mentorship' ? 'text-amber-200' : 'text-emerald-600'}`} />
            <span className="truncate">
              {isStudent
                ? (lang === 'hi' ? '4. मेन्टरशिप' : '4. Mentorship')
                : (lang === 'hi' ? '6. मेन्टरशिप' : '6. Mentorship')}
            </span>
            {(incomingMentorshipList.length > 0 || outgoingMentorshipList.length > 0) ? (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0 ${
                (pendingIncomingMentorshipCount > 0 || scheduledOutgoingMentorshipCount > 0)
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-sky-100 text-[#003366]'
              }`}>
                {scheduledOutgoingMentorshipCount > 0 ? (
                  <>
                    <span>📅</span>
                    <span>{scheduledOutgoingMentorshipCount}</span>
                  </>
                ) : (
                  incomingMentorshipList.length + outgoingMentorshipList.length
                )}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-[#003366] font-bold whitespace-nowrap shrink-0">
                0
              </span>
            )}
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={activeTab === 'job' ? handleBroadcastJob : handleSubmit} className="overflow-y-auto p-5 sm:p-6 pb-6 flex-1 min-h-0 mcu-modal-scroll space-y-5">
          {(activeTab === 'photo' || activeTab === 'details') && (
            <FormProgressBar
              percentage={profilePercentage}
              completedFields={profileCompleted}
              totalFields={profileFields.length}
              title={lang === 'hi' ? 'प्रोफ़ाइल पूर्णता प्रगति' : 'Profile Strength & Completion'}
              lang={lang}
              steps={[
                { label: lang === 'hi' ? 'फ़ोटो' : 'Photo', done: Boolean(formData.avatar && typeof formData.avatar === 'string' && formData.avatar.trim() !== '') },
                { label: lang === 'hi' ? 'व्यक्तिगत व करियर विवरण' : 'Personal & Career Details', done: profileCompleted >= 9 },
              ]}
              currentStep={activeTab === 'photo' ? 1 : 2}
              onStepClick={(s) => setActiveTab(s === 1 ? 'photo' : 'details')}
            />
          )}

          {activeTab === 'job' && (
            <FormProgressBar
              percentage={broadcastPercentage}
              completedFields={broadcastCompleted}
              totalFields={broadcastFields.length}
              title={lang === 'hi' ? 'अवसर प्रसारण प्रगति' : 'Opportunity Broadcast Progress'}
              lang={lang}
            />
          )}

          {activeTab === 'photo' && (
            <div className="space-y-5 mcu-form-step-enter">
              {/* Avatar Preview & Direct Upload Actions (3D Water-Glass Card) */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white via-sky-50/75 to-sky-100/60 border border-sky-300/85 shadow-[0_10px_26px_-6px_rgba(2,132,199,0.15),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.12)]">
                <div className="relative group shrink-0">
                  {formData.avatar && typeof formData.avatar === 'string' && formData.avatar.trim() !== '' ? (
                    <img
                      src={formData.avatar}
                      alt="Current profile preview"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-[0_10px_25px_-5px_rgba(2,132,199,0.3)] ring-2 ring-sky-400/70"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#003366] border-4 border-white shadow-[0_10px_25px_-5px_rgba(2,132,199,0.3)] ring-2 ring-sky-400/70 flex items-center justify-center text-white font-bold text-3xl font-editorial">
                      {((formData.name || user?.name || 'A').charAt(0)).toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Upload Photo"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Upload</span>
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h4 className="text-sm font-bold text-[#002244]">
                    {lang === 'hi' ? 'अपनी प्रोफ़ाइल फ़ोटो चुनें या अपलोड करें' : 'Upload or Choose Profile Photo'}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    {formData.avatar && typeof formData.avatar === 'string' && formData.avatar.trim() !== ''
                      ? (lang === 'hi' ? 'फ़ोटो अपलोड है। आप इसे बदल सकते हैं या हटा सकते हैं।' : 'Photo uploaded. You can change or remove it.')
                      : (lang === 'hi' ? 'अभी कोई फ़ोटो नहीं है। आप डिवाइस से नई फ़ोटो लगा सकते हैं।' : 'No profile photo set. Upload a photo or select a preset.')}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif,.jfif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#003366] hover:from-[#0369a1] hover:to-[#002244] text-white border border-sky-300/70 text-xs font-bold transition-all hover:-translate-y-0.5 flex items-center gap-1.5 shadow-[0_6px_14px_-3px_rgba(2,132,199,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>{lang === 'hi' ? 'डिवाइस से फ़ोटो चुनें' : 'Upload from Device'}</span>
                    </button>

                    {formData.avatar && typeof formData.avatar === 'string' && formData.avatar.trim() !== '' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, avatar: '' }));
                          setIsAvatarRemoved(true);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-b from-white to-red-50 hover:from-red-50 hover:to-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        {lang === 'hi' ? 'फ़ोटो हटाएं (Remove)' : 'Remove Photo'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo URL Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'फ़ोटो URL (वैकल्पिक)' : 'Or Enter Photo URL'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={(formData.avatar && typeof formData.avatar === 'string' && formData.avatar.startsWith('data:')) ? '' : (formData.avatar || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, avatar: val }));
                      setIsAvatarRemoved(!val.trim());
                    }}
                    placeholder="https://images.unsplash.com/... or https://..."
                    className="w-full bg-slate-50 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Preset Professional Avatars */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {lang === 'hi' ? 'या प्रीसेट अवतार चुनें (1-Click Presets):' : 'Or Select a Preset Headshot:'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, avatar: preset }));
                        setIsAvatarRemoved(false);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                        formData.avatar === preset
                          ? 'border-[#fc4a00] ring-2 ring-[#fc4a00]/30 scale-105 shadow-md'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={preset}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-16 object-cover rounded-lg"
                      />
                      {formData.avatar === preset && (
                        <div className="absolute top-1 right-1 bg-[#fc4a00] text-white rounded-full p-0.5 shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-center sm:text-right">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#003366] text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <span>{lang === 'hi' ? 'अगला: विवरण संपादित करें →' : 'Next: Edit Details →'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    पूरा नाम (हिंदी में - वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    value={formData.hindiName}
                    onChange={(e) => setFormData({ ...formData, hindiName: e.target.value })}
                    placeholder="उदा. मनीष विश्वकर्मा"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              {/* Contact Phone & Pass-out Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Graduation Batch Year *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1990"
                      max="2026"
                      value={formData.batchYear}
                      onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                      className="w-full bg-slate-50 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fc4a00]">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Role & Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Current Designation / Role *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.currentRole}
                      onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                      placeholder="e.g. Full Stack Developer, Software Engineer, Cloud Architect"
                      className="w-full bg-slate-50 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'संस्थान / कंपनी (Organization / Company) *' : 'Organization / Company *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Infosys, TCS, Google, Microsoft, Tech Startup"
                      className="w-full bg-slate-50 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* City & Degree */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Current City / Base *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Bengaluru, Hyderabad, Pune, Bhopal, Remote"
                      className="w-full bg-slate-50 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-[#8d0303]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Degree / Course Completed
                  </label>
                  <input
                    type="text"
                    list="edit-mcu-degree-options"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    placeholder="e.g. BCA, MCA, B.Tech CSE, M.Sc IT"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                  />
                  <datalist id="edit-mcu-degree-options">
                    <option value="Bachelor of Computer Applications (BCA)" />
                    <option value="Master of Computer Applications (MCA)" />
                    <option value="B.Tech in Computer Science & Engineering (CSE)" />
                    <option value="M.Sc. in Computer Science (M.Sc. CS)" />
                    <option value="M.Sc. in Information Technology (M.Sc. IT)" />
                    <option value="M.Sc. in Artificial Intelligence & Data Science" />
                    <option value="PGDCA (Post Graduate Diploma in Computer Applications)" />
                    <option value="Ph.D. in Computer Science & Applications" />
                  </datalist>
                </div>
              </div>

              {/* LinkedIn Profile */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  LinkedIn Profile (URL or Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-slate-50 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0A66C2]"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A66C2]">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Professional Bio */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Professional Bio / About You
                </label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={lang === 'hi'
                    ? 'कंप्यूटर अनुप्रयोग, सॉफ्टवेयर इंजीनियरिंग, टेक स्टैक एवं करियर यात्रा का संक्षिप्त विवरण...'
                    : 'Share a brief overview of your software engineering career, tech stack, and journey...'}
                  className="w-full bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                />
              </div>

              {/* Skills & Expertise Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#003366] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#fc4a00]" />
                    <span>{lang === 'hi' ? 'विशेषज्ञता एवं कौशल (Core Expertise & Skills)' : 'Core Expertise & Skills'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {formData.skills?.length || 0} / 12 {lang === 'hi' ? 'कौशल' : 'skills'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-3 leading-tight">
                  {lang === 'hi'
                    ? 'ये कौशल आपकी प्रोफाइल और डायरेक्टरी कार्ड पर दिखेंगे। पद के अनुसार सुझाव पर क्लिक करके जोड़ें:'
                    : 'These skills appear on your full profile and directory card. Click recommendations or type below:'}
                </p>

                {/* Active Skill Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px] p-2 bg-white rounded-xl border border-slate-200">
                  {(!formData.skills || formData.skills.length === 0) ? (
                    <span className="text-xs text-slate-400 italic py-0.5 px-1">
                      {lang === 'hi' ? 'कोई कौशल नहीं जोड़ा गया — नीचे से चुनें' : 'No skills added yet — choose suggestions below'}
                    </span>
                  ) : (
                    formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#003366]/10 text-[#003366] border border-[#003366]/20 text-xs font-semibold group hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(idx)}
                          className="text-slate-400 group-hover:text-rose-600 hover:scale-110 transition-transform"
                          title="Remove skill"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Custom Skill Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder={lang === 'hi' ? 'नया कौशल लिखें (उदा. React, Python, Java, Cloud)...' : 'Type skill (e.g. React.js, Python, Java, Cloud)...'}
                    className="flex-1 bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#003366]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    disabled={!newSkillInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'जोड़ें' : 'Add'}</span>
                  </button>
                </div>

                {/* Suggested Skills based on role */}
                {(() => {
                  const suggestions = getSuggestedSkills(formData.currentRole).filter(
                    (s) => !formData.skills?.some((existing) => existing.toLowerCase() === s.toLowerCase())
                  );
                  if (suggestions.length === 0) return null;
                  return (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#fc4a00]" />
                        <span>{lang === 'hi' ? 'सुझाए गए कौशल (क्लिक करके जोड़ें):' : 'Suggested for your role (click to add):'}</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {suggestions.slice(0, 8).map((sugg, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddSkill(sugg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-[#fc4a00]/10 hover:border-[#fc4a00] border border-slate-200 text-slate-700 hover:text-[#fc4a00] text-[11px] font-medium transition-all shadow-xs"
                          >
                            <Plus className="w-2.5 h-2.5 text-slate-400" />
                            <span>{sugg}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {!isStudent ? (
                <>
                  {/* Quick Callout to Post Opportunity */}
                  <div
                    onClick={() => setActiveTab('job')}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-300 flex items-center justify-between cursor-pointer hover:border-[#fc4a00] transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#8d0303] text-amber-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#003366] group-hover:text-[#fc4a00] transition-colors block">
                          {lang === 'hi' ? 'क्या आपके संस्थान में कोई नया अवसर या रिक्त पद है?' : 'Hiring at your organization?'}
                        </span>
                        <span className="text-[10px] text-slate-600 block">
                          {lang === 'hi' ? 'यहाँ क्लिक करके सीधे Jobs & Careers में अवसर प्रसारित करें →' : 'Click here to post and broadcast to Jobs & Careers →'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#fc4a00] text-white text-[10px] font-bold shrink-0 shadow-xs">
                      {lang === 'hi' ? 'अवसर पोस्ट करें' : 'Post Job'}
                    </span>
                  </div>

                  {/* Mentorship Toggle */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div className="pr-3">
                      <span className="text-xs font-bold text-[#8d0303] block flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#fc4a00]" />
                        <span>Volunteer as an Alumni Mentor</span>
                      </span>
                      <span className="text-[10px] text-slate-600">
                        Allow juniors and students to request 1-on-1 guidance sessions from you
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.openToMentor}
                      onChange={(e) => setFormData({ ...formData, openToMentor: e.target.checked })}
                      className="w-4 h-4 accent-[#fc4a00] rounded"
                    />
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-[#003366] block">
                      {lang === 'hi' ? '📘 अध्ययनरत विद्यार्थी प्रोफ़ाइल' : '📘 Current Student Profile'}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {lang === 'hi'
                        ? 'आप नौकरियों के लिए आवेदन कर सकते हैं और पूर्व छात्रों से मार्गदर्शन ले सकते हैं।'
                        : 'You can apply for alumni job referrals and request 1-on-1 mentorship from senior graduates.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'job' && (
            <div className="space-y-4 animate-fadeIn">
              {!isVerified ? (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/70 to-white border-2 border-amber-300 shadow-sm text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fc4a00] to-[#8d0303] text-white flex items-center justify-center mx-auto shadow-md">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">
                    <span>🔒 {lang === 'hi' ? 'एडमिन सत्यापन लंबित (Pending Admin Verification)' : 'Pending MCU Admin Verification'}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-extrabold text-[#003366] font-editorial">
                    {lang === 'hi'
                      ? 'एडमिन सत्यापन के बाद ही जॉब पोस्ट की जा सकेगी'
                      : 'Job Posting Unlocks After MCU Admin Verification'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    {lang === 'hi'
                      ? 'आपका पूर्व छात्र (Alumni) खाता और लिंक्डइन प्रोफ़ाइल वर्तमान में एमसीयू प्रशासन द्वारा सत्यापन के अधीन है। जैसे ही एडमिन आपकी प्रोफ़ाइल को सत्यापित (Verify) करेंगे, आप तुरंत जॉब एवं रेफरल अवसर पोस्ट कर सकेंगे।'
                      : 'Your Alumni account and LinkedIn profile are currently under review by the MCU Administration. As soon as the Admin verifies your profile, you will be able to post job openings and referrals.'}
                  </p>
                </div>
              ) : (
                <>
              {/* Broadcast Notice Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#003366]/5 via-[#fc4a00]/10 to-[#8d0303]/10 border border-[#fc4a00]/30 flex items-start gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fc4a00] to-[#8d0303] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                      {lang === 'hi' ? 'सीधा प्रसारण • Jobs & Careers' : 'Live Broadcast • Jobs & Careers'}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[9px] bg-red-600 text-white font-bold">
                      LIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 font-editorial">
                    {lang === 'hi' ? 'अपनी प्रोफ़ाइल से रोजगार अवसर पोस्ट करें' : 'Post an Opportunity from Your Profile'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {lang === 'hi'
                      ? 'यहाँ प्रकाशित किया गया अवसर सीधे मुख्य वेबसाइट के "Jobs & Careers" सेक्शन में सभी पूर्व छात्रों एवं कंप्यूटर विभाग के विद्यार्थियों के लिए लाइव प्रसारित हो जाएगा।'
                      : 'Opportunities posted here are instantly broadcasted to the university-wide Jobs & Careers board for all MCU alumni & students.'}
                  </p>
                </div>
              </div>

              {/* Shortcut to Received Student Applications */}
              <div
                onClick={() => setActiveTab('applications')}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-all shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors block">
                      {lang === 'hi' ? 'छात्रों के प्राप्त रेफरल आवेदन (Student Applications)' : 'Candidate Referral Applications'}
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      {myApplications.length > 0
                        ? (lang === 'hi' ? `${myApplications.length} विद्यार्थियों ने आपके अवसरों पर आवेदन किया है। रिज्यूमे देखें →` : `${myApplications.length} candidates applied for your jobs. Click to view resumes & status →`)
                        : (lang === 'hi' ? 'जब कोई छात्र आवेदन करेगा, उसका विवरण व रिज्यूमे यहाँ दिखाई देगा।' : 'When students apply via your referral, review resumes & track them here.')}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs flex items-center gap-1">
                  <span>{myApplications.length} {lang === 'hi' ? 'आवेदन' : 'Applications'}</span>
                  <span>→</span>
                </span>
              </div>

              {/* My Tracked Posted Jobs */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${myPostedJobs && myPostedJobs.length > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                    <h5 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                      {lang === 'hi' ? 'आपके द्वारा पोस्ट किए गए सक्रिय अवसर' : 'Your Active Posted Opportunities'} ({myPostedJobs ? myPostedJobs.length : 0})
                    </h5>
                  </div>
                  <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                    {lang === 'hi' ? 'हटाने का अधिकार केवल आपके पास है' : 'Exclusive Delete Access'}
                  </span>
                </div>

                {myPostedJobs && myPostedJobs.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {myPostedJobs.map((job) => (
                      <div key={job.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-amber-400 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">{job.title}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">Live</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{job.company || job.company_name} • {job.location || 'Remote'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(lang === 'hi' ? `क्या आप वाकई "${job.title}" अवसर को स्थायी रूप से हटाना चाहते हैं?` : `Are you sure you want to permanently delete "${job.title}"?`)) {
                              if (onDeleteJob) onDeleteJob(job.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                          title={lang === 'hi' ? 'अवसर हटाएं' : 'Delete Opportunity'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                    {lang === 'hi'
                      ? 'आपने अभी तक कोई अवसर पोस्ट नहीं किया है। आपके द्वारा पोस्ट किए गए सभी अवसर केवल यहीं दिखाई देंगे और केवल आप ही उन्हें हटा सकेंगे।'
                      : 'You have not posted any opportunities yet. Any job you post will be listed here and can be deleted only by you.'}
                  </p>
                )}
              </div>

              {/* Computer Dept Quick Presets */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 rounded-2xl">
                <span className="text-[11px] font-bold text-[#003366] flex items-center gap-1.5 mb-2">
                  <Laptop className="w-3.5 h-3.5 text-[#fc4a00]" />
                  <span>{lang === 'hi' ? 'कंप्यूटर विभाग क्विक टेम्पलेट्स (1-क्लिक ऑटो-फिल):' : 'Computer Dept Quick Templates (1-Click Fill):'}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTechPreset(
                      'Full Stack Web Developer (MERN / Go)',
                      'React, Node.js, Go, MongoDB, REST API, Tailwind',
                      'Looking for MCA/BCA alumni or skilled juniors proficient in React, Node.js/Go microservices, and modern web application development.'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:border-[#fc4a00] hover:text-[#fc4a00] text-slate-700 text-xs font-medium transition-all shadow-xs"
                  >
                    💻 Full Stack Dev
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTechPreset(
                      'Python / AI & Machine Learning Engineer',
                      'Python, FastAPI, PyTorch, LangChain, Data Engineering',
                      'Opportunity for Computer Science alumni to work on AI agents, LLM integrations, and backend microservices.'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:border-[#fc4a00] hover:text-[#fc4a00] text-slate-700 text-xs font-medium transition-all shadow-xs"
                  >
                    🐍 Python & AI
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTechPreset(
                      'DevOps & Cloud Engineer (AWS / Docker)',
                      'Docker, Kubernetes, AWS, Linux, CI/CD, Microservices',
                      'Hiring alumni with strong grasp of Docker containerization, Linux server management, and cloud architecture.'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:border-[#fc4a00] hover:text-[#fc4a00] text-slate-700 text-xs font-medium transition-all shadow-xs"
                  >
                    ☁️ Cloud & DevOps
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTechPreset(
                      'Software Engineer Trainee (MCA / BCA Freshers)',
                      'JavaScript, SQL, DSA, Problem Solving, Git',
                      'Direct alumni referral for MCA / BCA batch freshers with solid computer fundamentals and problem-solving skills.'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:border-[#fc4a00] hover:text-[#fc4a00] text-slate-700 text-xs font-medium transition-all shadow-xs"
                  >
                    🎓 MCA / BCA Fresher
                  </button>
                </div>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'पद / शीर्षक (Job Title) *' : 'Job Title / Designation *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                    placeholder="e.g. Full Stack Developer, MCA Fresher Trainee, Python Engineer"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'प्रकार (Type) *' : 'Engagement Type *'}
                  </label>
                  <select
                    value={jobFormData.type}
                    onChange={(e) => setJobFormData({ ...jobFormData, type: e.target.value })}
                    className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Fellowship / Contract">Fellowship / Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              {/* Company & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'संस्थान / कंपनी (Company / Tech Org) *' : 'Company / Tech Org *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={jobFormData.company}
                    onChange={(e) => setJobFormData({ ...jobFormData, company: e.target.value })}
                    placeholder="e.g. TCS, Infosys, Tech Mahindra, Product Startup"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'स्थान (Location) *' : 'Job Location *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={jobFormData.location}
                    onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                    placeholder="e.g. Bengaluru / Hyderabad / Pune / Bhopal / Remote"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                  />
                </div>
              </div>

              {/* Experience & Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'आवश्यक अनुभव (Experience)' : 'Experience Required'}
                  </label>
                  <input
                    type="text"
                    value={jobFormData.experience}
                    onChange={(e) => setJobFormData({ ...jobFormData, experience: e.target.value })}
                    placeholder="e.g. 1-3 Years / Freshers Welcome"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'वेतन / पैकेज (Salary / CTC)' : 'Compensation / CTC'}
                  </label>
                  <input
                    type="text"
                    value={jobFormData.salary}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary: e.target.value })}
                    placeholder="e.g. ₹6 - 12 LPA or Stipend ₹25,000/mo"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                  />
                </div>
              </div>

              {/* Posted By (Alumni Attribution) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>{lang === 'hi' ? 'रेफरल पूर्व छात्र का नाम व बैच (Posted By) *' : 'Posted By (Your Name & Batch) *'}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{lang === 'hi' ? 'सत्यापित कंप्यूटर विभाग पूर्व छात्र' : 'Verified Computer Dept Alumnus'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={jobFormData.postedBy}
                  onChange={(e) => setJobFormData({ ...jobFormData, postedBy: e.target.value })}
                  placeholder="e.g. Amit Sharma (MCA Batch of 2021)"
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'विवरण एवं मुख्य जिम्मेदारियां (Role Description) *' : 'Role Description & Requirements *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  placeholder="e.g. Key technical skills required (React, Node, Go, SQL), responsibilities, and how MCU Computer Dept alumni/students can apply..."
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00] resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'टैग्स / तकनीकी कौशल (Tags - comma separated)' : 'Skills / Tech Tags (comma separated)'}
                </label>
                <input
                  type="text"
                  value={jobFormData.tags}
                  onChange={(e) => setJobFormData({ ...jobFormData, tags: e.target.value })}
                  placeholder="e.g. React, Node.js, Python, SQL, MCA Fresher, Cloud"
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                />
              </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#003366]/5 via-emerald-500/10 to-[#fc4a00]/10 border border-emerald-300/60 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                        {lang === 'hi' ? 'प्राप्त छात्र रेफरल आवेदन' : 'Received Referral Applications'}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] bg-emerald-600 text-white font-bold">
                        {myApplications.length} {lang === 'hi' ? 'कुल' : 'Total'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 font-editorial">
                      {lang === 'hi' ? 'कंप्यूटर विभाग एवं एमसीयू विद्यार्थियों के आवेदन' : 'MCU & Computer Dept Student Referrals'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {lang === 'hi'
                        ? 'यहाँ आपके द्वारा पोस्ट किए गए अवसरों पर विद्यार्थियों के प्राप्त आवेदन, रिज्यूमे, संपर्क विवरण और स्थिति प्रबंधन उपलब्ध है।'
                        : 'Review student profiles, inspect submitted resumes, contact applicants directly, and track referral status.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: lang === 'hi' ? 'सभी (All)' : 'All', count: myApplications.length },
                    { id: 'submitted', label: lang === 'hi' ? 'नया / पेंडिंग' : 'Pending', count: myApplications.filter(a => a.status === 'submitted' || a.status === 'pending').length },
                    { id: 'under_review', label: lang === 'hi' ? 'समीक्षाधीन' : 'In Review', count: myApplications.filter(a => a.status === 'under_review').length },
                    { id: 'referred', label: lang === 'hi' ? 'अग्रेषित' : 'Referred', count: myApplications.filter(a => a.status === 'referred' || a.status === 'accepted').length },
                    { id: 'rejected', label: lang === 'hi' ? 'अस्वीकृत' : 'Declined', count: myApplications.filter(a => a.status === 'rejected').length },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setApplicationFilter(filter.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        applicationFilter === filter.id
                          ? 'bg-[#003366] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    value={applicationSearch}
                    onChange={(e) => setApplicationSearch(e.target.value)}
                    placeholder={lang === 'hi' ? 'नाम या पद से खोजें...' : 'Filter candidate...'}
                    className="w-full bg-white pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Applications List */}
              {filteredApplications.length > 0 ? (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {filteredApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all space-y-3"
                    >
                      {/* Top Row: Candidate name, Degree, Target Job & Status */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#003366] font-editorial">
                              {app.applicant_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#003366] border border-blue-200 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-[#fc4a00]" />
                              <span>{app.applicant_degree}</span>
                              {app.mcu_batch && <span>• {lang === 'hi' ? 'बैच' : 'Batch'} {app.mcu_batch}</span>}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">
                            <span className="text-slate-500">{lang === 'hi' ? 'पद के लिए आवेदन:' : 'Applied for:'}</span>{' '}
                            <span className="font-bold text-slate-900">{app.job_title}</span>{' '}
                            {app.company_name && <span className="text-slate-500">at {app.company_name}</span>}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
                            app.status === 'referred' || app.status === 'accepted'
                              ? 'bg-emerald-600 text-white'
                              : app.status === 'under_review'
                              ? 'bg-[#fc4a00] text-white'
                              : app.status === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            {app.status === 'referred' || app.status === 'accepted' ? '✅ Referred' :
                             app.status === 'under_review' ? '🔍 In Review' :
                             app.status === 'rejected' ? '❌ Declined' : '⏳ New / Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Contact & Links Bar */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <a
                          href={`mailto:${app.applicant_email}`}
                          className="hover:underline flex items-center gap-1 text-[#003366] font-medium"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-600" />
                          <span>{app.applicant_email}</span>
                        </a>
                        {app.applicant_phone && (
                          <a
                            href={`tel:${app.applicant_phone}`}
                            className="hover:underline flex items-center gap-1 text-emerald-700 font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{app.applicant_phone}</span>
                          </a>
                        )}
                        {app.portfolio_url && (
                          <a
                            href={app.portfolio_url.startsWith('http') ? app.portfolio_url : `https://${app.portfolio_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1 text-[#0A66C2] font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Portfolio / GitHub</span>
                          </a>
                        )}
                        {app.applied_at && (
                          <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>

                      {/* Pitch / Cover Note */}
                      {app.cover_note && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                          "{app.cover_note}"
                        </div>
                      )}

                      {/* Bottom Action Bar: Resume View/Download + Status Management + Delete */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        {/* Resume Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewingApp(app)}
                            className="px-3 py-1.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-300" />
                            <span>{lang === 'hi' ? '📄 रिज्यूमे देखें' : 'View Resume'}</span>
                          </button>

                          {app.resume_file_url && (
                            <button
                              type="button"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = app.resume_file_url;
                                a.download = app.resume_file_name || `${app.applicant_name}_Resume.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title={lang === 'hi' ? 'डाउनलोड करें' : 'Download Resume'}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{lang === 'hi' ? 'डाउनलोड' : 'Download'}</span>
                            </button>
                          )}
                        </div>

                        {/* Status Change Buttons & Delete */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onUpdateApplicationStatus && onUpdateApplicationStatus(app.id, 'referred')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                              app.status === 'referred' || app.status === 'accepted'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                            title="Refer to HR / Company"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{lang === 'hi' ? 'रेफर करें' : 'Refer'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateApplicationStatus && onUpdateApplicationStatus(app.id, 'under_review')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                              app.status === 'under_review'
                                ? 'bg-[#fc4a00] text-white shadow-xs'
                                : 'bg-orange-50 hover:bg-orange-100 text-[#fc4a00] border border-orange-200'
                            }`}
                            title="Mark Under Review"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{lang === 'hi' ? 'समीक्षा' : 'Review'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateApplicationStatus && onUpdateApplicationStatus(app.id, 'rejected')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                              app.status === 'rejected'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                            }`}
                            title="Decline"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>{lang === 'hi' ? 'अस्वीकृत' : 'Decline'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(lang === 'hi' ? `क्या आप वाकई ${app.applicant_name} का आवेदन हटाना चाहते हैं?` : `Are you sure you want to delete ${app.applicant_name}'s application?`)) {
                                if (onDeleteApplication) onDeleteApplication(app.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-editorial">
                      {lang === 'hi' ? 'अभी तक कोई छात्र आवेदन प्राप्त नहीं हुआ है' : 'No Student Applications Received Yet'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      {lang === 'hi'
                        ? 'जब कोई विद्यार्थी आपके द्वारा पोस्ट किए गए रोजगार अवसर पर "Apply via Alumni Referral" करेगा, तो उसका पूरा विवरण, संपर्क जानकारी एवं रिज्यूमे यहाँ दिखाई देगा तथा आपके ईमेल पर भी सूचना भेजी जाएगी।'
                        : 'When students apply for your posted opportunities via referral, their details, credentials, and resume files will appear here.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('job')}
                    className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                    <span>{lang === 'hi' ? 'नया रोजगार अवसर पोस्ट करें' : 'Post an Opportunity'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'my_applications' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#8d0303]/10 to-[#003366]/10 border border-amber-300/60 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8d0303] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-[#8d0303] uppercase tracking-wider">
                        {lang === 'hi' ? 'मेरे द्वारा किए गए रेफरल आवेदन' : 'My Applied Referral Requests'}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] bg-[#8d0303] text-white font-bold">
                        {submittedApplicationsList.length} {lang === 'hi' ? 'कुल आवेदन' : 'Total'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 font-editorial">
                      {lang === 'hi' ? 'आपके द्वारा पूर्व छात्रों से मांगे गए रेफरल एवं लाइव स्थिति' : 'Track Your Alumni Referral Applications & Live Status'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {lang === 'hi'
                        ? 'यहाँ आपके द्वारा विभिन्न नौकरियों के लिए किए गए आवेदन सूचीबद्ध हैं। जब पूर्व छात्र आपका रेफरल स्वीकार करेंगे, तो आपको तुरंत यहाँ व ईमेल पर सूचित किया जाएगा।'
                        : 'Track real-time status of your applications. Once an alumnus accepts your referral, you will be notified here and via email.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Celebratory Banner if ANY application is accepted/referred */}
              {acceptedApplicationsList.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-500/50 shadow-sm flex items-start gap-3.5 animate-fadeIn">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <PartyPopper className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-emerald-900 font-editorial">
                        {lang === 'hi'
                          ? `🎉 बधाई! आपके ${acceptedApplicationsList.length} रेफरल आवेदन स्वीकार कर लिए गए हैं!`
                          : `🎉 Congratulations! ${acceptedApplicationsList.length} Referral Request(s) Accepted!`}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                        Accepted
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      {lang === 'hi'
                        ? 'पूर्व छात्र ने आपके प्रोफाइल और रिज्यूमे को जांचकर हायरिंग टीम को अग्रेषित (Refer) कर दिया है। आपको आधिकारिक पुष्टि ईमेल भी भेज दिया गया है।'
                        : 'MCU alumni have reviewed your application and endorsed your profile directly to the company / recruitment team.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Applications List */}
              {submittedApplicationsList && submittedApplicationsList.length > 0 ? (
                <div className="space-y-3">
                  {submittedApplicationsList.map((app) => (
                    <div
                      key={app.id}
                      className={`p-4 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md ${
                        app.status === 'referred' || app.status === 'accepted'
                          ? 'border-emerald-400 bg-emerald-50/20'
                          : app.status === 'under_review'
                          ? 'border-[#fc4a00]/40 bg-orange-50/20'
                          : app.status === 'rejected'
                          ? 'border-red-200 bg-red-50/15'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-bold text-[#003366] font-editorial">
                              {app.job_title}
                            </span>
                            <span className="text-xs font-semibold text-[#8d0303] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                              {app.company_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            <span className="font-semibold text-slate-700">
                              {lang === 'hi' ? 'रेफरल पूर्व छात्र:' : 'Target Alumnus:'} {app.alumni_name || 'MCU Alumnus'}
                            </span>
                            {app.alumni_email && (
                              <span className="text-slate-400">• {app.alumni_email}</span>
                            )}
                            {app.applied_at && (
                              <span className="text-slate-400">
                                • {new Date(app.applied_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {app.status === 'referred' || app.status === 'accepted' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-xs animate-pulse">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>{lang === 'hi' ? '✅ रेफरल स्वीकृत (Accepted)' : '✅ Referred & Accepted!'}</span>
                            </div>
                          ) : app.status === 'under_review' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 text-[#fc4a00] border border-orange-300 font-bold text-xs shadow-xs">
                              <Clock className="w-4 h-4 text-[#fc4a00]" />
                              <span>{lang === 'hi' ? '🔍 समीक्षाधीन (Under Review)' : 'Under Review'}</span>
                            </div>
                          ) : app.status === 'rejected' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-800 border border-red-300 font-bold text-xs shadow-xs">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span>{lang === 'hi' ? '❌ अस्वीकृत (Declined)' : '❌ Declined'}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs shadow-xs">
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>{lang === 'hi' ? '⏳ प्रेषित / लंबित (Pending)' : 'Submitted / Pending'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          {app.cover_note && (
                            <p className="text-slate-600 line-clamp-1 italic text-[11px]">
                              "{app.cover_note}"
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                            <span>{app.applicant_degree}</span>
                            {app.mcu_batch && <span>• {app.mcu_batch}</span>}
                            {app.resume_file_name && <span>• 📄 {app.resume_file_name}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {app.resume_file_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewingApp(app)}
                              className="px-3 py-1.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.02]"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-300" />
                              <span>{lang === 'hi' ? 'रिज्यूमे देखें' : 'View Resume'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                    <Send className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-editorial">
                      {lang === 'hi' ? 'आपने अभी तक कोई रेफरल आवेदन नहीं भेजा है' : 'No Referral Applications Submitted Yet'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      {lang === 'hi'
                        ? 'Jobs & Careers सेक्शन में जाकर कंप्यूटर विभाग एवं अन्य पूर्व छात्रों द्वारा पोस्ट किए गए अवसरों को देखें और "Apply via Alumni Referral" पर क्लिक करें।'
                        : 'Explore jobs posted by MCU alumni in the Jobs & Careers section and request direct referrals.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        const el = document.getElementById('jobs');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    }}
                    className="px-4 py-2 rounded-xl btn-mcu-saffron text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'रोजगार अवसर देखें (Jobs & Careers)' : 'Explore Jobs & Careers'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: Mentorship Requests & Session Scheduler */}
          {activeTab === 'mentorship' && (
            <div className="space-y-6">
              {/* SECTION A: Incoming Mentorship Requests (For Alumni / Mentors) */}
              {(!isStudent || incomingMentorshipList.length > 0) && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-b from-emerald-100/85 via-emerald-50/90 to-teal-50/75 backdrop-blur-md border border-emerald-300/90 rounded-2xl p-4 sm:p-5 text-emerald-950 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.16),inset_0_1.5px_2px_rgba(255,255,255,0.95)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white border border-emerald-300/80 shadow-[0_4px_10px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0">
                          <Compass className="w-5 h-5 text-amber-200" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-[#002855] tracking-tight flex items-center gap-2">
                            <span>
                              {lang === 'hi'
                                ? 'प्राप्त मेन्टरशिप अनुरोध और सेशन शेड्यूलर'
                                : 'Incoming Mentorship Requests & Session Scheduler'}
                            </span>
                            {pendingIncomingMentorshipCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white animate-pulse">
                                {pendingIncomingMentorshipCount} {lang === 'hi' ? 'नया अनुरोध' : 'New'}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-emerald-900/85 font-medium mt-1">
                            {lang === 'hi'
                              ? 'जब आप खाली हों, तो नीचे तारीख और समय (Time Slot) चुनकर सेशन शेड्यूल करें — छात्र को तुरंत उनके अकाउंट और ईमेल पर नोटिफिकेशन मिल जाएगा।'
                              : 'When you are free, select a Date, Time Slot & Meeting Link below to schedule the session — the student will instantly receive a notification in their account & via email.'}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-white/80 border border-emerald-300/80 text-emerald-900 text-xs font-extrabold whitespace-nowrap self-start sm:self-center shadow-2xs">
                        {incomingMentorshipList.length} {lang === 'hi' ? 'कुल अनुरोध' : 'Total Requests'}
                      </span>
                    </div>
                  </div>

                  {incomingMentorshipList.length > 0 ? (
                    <div className="space-y-4">
                      {incomingMentorshipList.map((req, idx) => {
                        const reqKey = req.id || getMentorshipDedupeKey(req) || idx;
                        const draft = getScheduleDraft(req);
                        const isScheduled = req.status === 'scheduled' || req.status === 'accepted';
                        const isCompleted = req.status === 'completed';
                        const isDeclined = req.status === 'declined' || req.status === 'rejected';
                        const isSavingThis = schedulingId === reqKey;
                        const justScheduledThis = scheduledToastId === reqKey;

                        return (
                          <div
                            key={reqKey}
                            className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                              isScheduled
                                ? 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border-emerald-300'
                                : isDeclined
                                ? 'bg-slate-50 border-slate-200 opacity-80'
                                : 'bg-white border-sky-200 hover:border-sky-300'
                            }`}
                          >
                            {/* Top Student & Topic Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-slate-200/80">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm sm:text-base font-extrabold text-[#002855]">
                                    {req.mentee_name || 'MCU Student'}
                                  </span>
                                  {req.mentee_status && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#003366] border border-sky-200">
                                      {req.mentee_status}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                      isScheduled
                                        ? 'bg-emerald-600 text-white'
                                        : isCompleted
                                        ? 'bg-blue-600 text-white'
                                        : isDeclined
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}
                                  >
                                    {isScheduled
                                      ? lang === 'hi'
                                        ? '✓ सेशन शेड्यूल किया गया'
                                        : '✓ Session Scheduled'
                                      : isCompleted
                                      ? lang === 'hi'
                                        ? 'पूर्ण (Completed)'
                                        : 'Completed'
                                      : isDeclined
                                      ? lang === 'hi'
                                        ? 'अस्वीकृत'
                                        : 'Declined'
                                      : lang === 'hi'
                                      ? '⏳ स्लॉट शेड्यूल होना बाकी'
                                      : '⏳ Awaiting Your Free Slot'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                                  {req.mentee_email && (
                                    <a
                                      href={`mailto:${req.mentee_email}`}
                                      className="inline-flex items-center gap-1 text-[#0284c7] hover:underline font-semibold"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>{req.mentee_email}</span>
                                    </a>
                                  )}
                                  {req.mentee_phone && (
                                    <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{req.mentee_phone}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start">
                                <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[#8d0303] text-xs font-extrabold">
                                  🎯 {req.topic || 'Career Guidance'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleLocalDeleteMentorship(req);
                                  }}
                                  title={lang === 'hi' ? 'अनुरोध हटाएं' : 'Delete Request'}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Student's Preferred Slot & Message */}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/90 rounded-xl p-3 border border-slate-200/70 text-xs">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  {lang === 'hi' ? 'छात्र का पसंदीदा समय' : "Student's Preferred Time"}
                                </span>
                                <span className="font-bold text-[#003366] mt-0.5 inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  {req.preferred_slot || 'Flexible / Weekend'}
                                </span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  {lang === 'hi' ? 'छात्र का संदेश / प्रश्न (Career / Other)' : "Student's Career / Guidance Note"}
                                </span>
                                <p className="text-slate-700 font-medium mt-0.5 leading-relaxed">
                                  "{req.message || 'Would love your guidance on career opportunities and preparation.'}"
                                </p>
                              </div>
                            </div>

                            {/* ALUMNUS FREE-TIME SESSION SCHEDULER */}
                            <div className="mt-4 bg-gradient-to-b from-emerald-100/75 via-emerald-50/80 to-white rounded-xl p-3.5 sm:p-4 border border-emerald-300/80 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95)] space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-emerald-700" />
                                  <span className="text-xs font-extrabold text-[#002855]">
                                    {lang === 'hi'
                                      ? 'जब आप खाली हों, सेशन का समय निर्धारित करें (Schedule Session):'
                                      : 'Set When You Are Free to Take This Session:'}
                                  </span>
                                </div>
                                {/* Quick 1-Click Free Slot Presets */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-500">
                                    {lang === 'hi' ? 'त्वरित स्लॉट:' : 'Quick Slots:'}
                                  </span>
                                  {[
                                    { label: 'Tomorrow 6:00 PM', time: '6:00 PM - 6:45 PM IST' },
                                    { label: 'Saturday 11:00 AM', time: 'Saturday, 11:00 AM - 11:45 AM IST' },
                                    { label: 'Sunday 5:00 PM', time: 'Sunday, 5:00 PM - 5:45 PM IST' },
                                  ].map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() => updateScheduleDraft(req, 'session_time', preset.time)}
                                      className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    {lang === 'hi' ? 'सेशन की तारीख (Date)' : 'Session Date'}
                                  </label>
                                  <input
                                    type="date"
                                    value={draft.session_date}
                                    onChange={(e) => updateScheduleDraft(req, 'session_date', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#003366]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    {lang === 'hi' ? 'खाली समय (Time Slot)' : 'Free Time Slot'}
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.session_time}
                                    onChange={(e) => updateScheduleDraft(req, 'session_time', e.target.value)}
                                    placeholder="e.g. 6:00 PM - 6:45 PM IST"
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#003366]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    {lang === 'hi' ? 'माध्यम (Session Mode)' : 'Session Mode'}
                                  </label>
                                  <select
                                    value={draft.session_mode}
                                    onChange={(e) => updateScheduleDraft(req, 'session_mode', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#003366]"
                                  >
                                    <option value="Google Meet (Video Session)">Google Meet (Video Session)</option>
                                    <option value="Zoom Video Call">Zoom Video Call</option>
                                    <option value="Phone / WhatsApp Call">Phone / WhatsApp Call</option>
                                    <option value="In-Person at MCU Campus">In-Person at MCU Campus</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    {lang === 'hi' ? 'मीटिंग लिंक / नंबर' : 'Meeting Link / Contact'}
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.meeting_link}
                                    onChange={(e) => updateScheduleDraft(req, 'meeting_link', e.target.value)}
                                    placeholder="https://meet.google.com/..."
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#003366]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                  {lang === 'hi' ? 'छात्र के लिए संदेश (Mentor Note)' : 'Note / Instructions for Student'}
                                </label>
                                <input
                                  type="text"
                                  value={draft.mentor_note}
                                  onChange={(e) => updateScheduleDraft(req, 'mentor_note', e.target.value)}
                                  placeholder={
                                    lang === 'hi'
                                      ? 'मैं इस समय खाली हूँ, कृपया समय पर जुड़ें...'
                                      : 'I am free at this slot. Keep your resume/questions ready!'
                                  }
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#003366]"
                                />
                              </div>

                              {justScheduledThis && (
                                <div className="p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-400 text-emerald-950 text-xs font-bold flex items-center gap-2 shadow-sm">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                  <span>
                                    {lang === 'hi'
                                      ? 'सेशन सफलतापूर्वक शेड्यूल हो गया! छात्र के अकाउंट और ईमेल पर नोटिफिकेशन भेज दिया गया है।'
                                      : 'Session Scheduled! The student has been notified in their account and via email.'}
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isSavingThis}
                                    onClick={() => handleScheduleMentorshipSession(req, 'scheduled')}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                      {isSavingThis
                                        ? lang === 'hi'
                                          ? 'शेड्यूल हो रहा है...'
                                          : 'Scheduling...'
                                        : isScheduled
                                        ? lang === 'hi'
                                          ? 'सेशन समय अपडेट करें और छात्र को सूचित करें'
                                          : 'Update Session Slot & Notify Student'
                                        : lang === 'hi'
                                        ? 'सेशन कन्फर्म करें और छात्र को नोटिफिकेशन भेजें'
                                        : 'Confirm & Schedule Session (Notify Student)'}
                                    </span>
                                  </button>

                                  {isScheduled && (
                                    <button
                                      type="button"
                                      disabled={isSavingThis}
                                      onClick={() => handleScheduleMentorshipSession(req, 'completed')}
                                      className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#003366] text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      {lang === 'hi' ? 'पूर्ण चिह्नित करें' : 'Mark Completed'}
                                    </button>
                                  )}
                                </div>

                                {!isDeclined && (
                                  <button
                                    type="button"
                                    disabled={isSavingThis}
                                    onClick={() => handleScheduleMentorshipSession(req, 'declined')}
                                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    {lang === 'hi' ? 'अस्वीकार करें' : 'Decline'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                      <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm font-bold text-slate-700">
                        {lang === 'hi'
                          ? 'अभी कोई इनकमिंग मेन्टरशिप अनुरोध नहीं है'
                          : 'No incoming mentorship requests yet'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        {lang === 'hi'
                          ? 'जब कोई छात्र आपके कार्ड पर "Mentor" बटन दबाकर करियर या अन्य मार्गदर्शन मांगेगा, तो वह अनुरोध यहाँ दिखेगा और आपको ईमेल भी मिलेगा।'
                          : 'When a student clicks the "Mentor" button on your profile for Career Guidance or other topics, their request will appear here and in your email.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION B: Outgoing Mentorship Requests & Scheduled Sessions (For Student / Mentee) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#002855] flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#8d0303]" />
                      <span>
                        {lang === 'hi'
                          ? 'मेरे मेन्टरशिप अनुरोध और शेड्यूल किए गए सेशन'
                          : 'My Requested Mentorship Sessions'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'hi'
                        ? 'जब एलुमनाई अपना खाली समय (Date & Time Slot) तय करेंगे, तो आपको यहाँ सेशन की पूरी जानकारी और मीटिंग लिंक मिल जाएगी।'
                        : 'As soon as the Alumnus schedules when they are free to take your session, the exact Date, Time & Meeting Link appear here.'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-[#003366]">
                    {outgoingMentorshipList.length}
                  </span>
                </div>

                {/* Celebratory Notification Banner when Alumnus schedules a session (Light Green Water-Glass) */}
                {scheduledOutgoingMentorshipCount > 0 && (
                  <div className="rounded-2xl bg-gradient-to-b from-emerald-100/85 via-emerald-50/90 to-teal-50/75 backdrop-blur-md border border-emerald-300/90 text-emerald-950 p-4 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.16),inset_0_1.5px_2px_rgba(255,255,255,0.95)] flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white border border-emerald-300/80 shadow-[0_4px_10px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0">
                      <PartyPopper className="w-5 h-5 text-amber-200" />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-extrabold text-sm text-[#002855]">
                        {lang === 'hi'
                          ? `🎉 खुशखबरी! आपके ${scheduledOutgoingMentorshipCount} मेन्टरशिप सेशन शेड्यूल हो गए हैं!`
                          : `🎉 Great News! ${scheduledOutgoingMentorshipCount} Mentorship Session(s) Scheduled by Alumni!`}
                      </p>
                      <p className="text-emerald-900/90 font-medium">
                        {lang === 'hi'
                          ? 'एलुमनाई ने अपने खाली समय के अनुसार तारीख, समय और मीटिंग लिंक नीचे भेज दिया है। निर्धारित समय पर सेशन जॉइन करें।'
                          : 'Your Alumnus mentor has confirmed when they are free and shared the session Date, Time Slot, and Meeting Link below.'}
                      </p>
                    </div>
                  </div>
                )}

                {outgoingMentorshipList.length > 0 ? (
                  <div className="space-y-3.5">
                    {outgoingMentorshipList.map((req, idx) => {
                      const reqKey = req.id || getMentorshipDedupeKey(req) || idx;
                      const isScheduled = req.status === 'scheduled' || req.status === 'accepted';
                      const isCompleted = req.status === 'completed';
                      const isDeclined = req.status === 'declined' || req.status === 'rejected';

                      return (
                        <div
                          key={reqKey}
                          className={`rounded-2xl border p-4 transition-all shadow-sm ${
                            isScheduled
                              ? 'bg-gradient-to-b from-white via-emerald-50/35 to-teal-50/30 border-emerald-300/90 shadow-[0_8px_22px_-6px_rgba(16,185,129,0.12)]'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-emerald-200/60">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-extrabold text-[#002855]">
                                  {lang === 'hi' ? 'मेन्टर:' : 'Mentor:'} {req.mentor_name || 'MCU Alumnus'}
                                </span>
                                {(req.mentor_role || req.mentor_company) && (
                                  <span className="text-xs font-semibold text-slate-500">
                                    ({[req.mentor_role, req.mentor_company].filter(Boolean).join(' @ ')})
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[#8d0303] text-[11px] font-bold">
                                  🎯 {req.topic || 'Career Guidance'}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {lang === 'hi' ? 'आपका पसंदीदा समय:' : 'Requested Slot:'} {req.preferred_slot || 'Flexible'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <span
                                className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                                  isScheduled
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                                    : isCompleted
                                    ? 'bg-blue-600 text-white'
                                    : isDeclined
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {isScheduled
                                  ? lang === 'hi'
                                    ? '📅 सेशन शेड्यूल हो गया!'
                                    : '📅 Session Scheduled!'
                                  : isCompleted
                                  ? lang === 'hi'
                                    ? '✓ सेशन पूर्ण'
                                    : '✓ Session Completed'
                                  : isDeclined
                                  ? lang === 'hi'
                                    ? 'अस्वीकृत'
                                    : 'Unavailable'
                                  : lang === 'hi'
                                  ? '⏳ एलुमनाई के खाली समय की प्रतीक्षा'
                                  : "⏳ Waiting for Alumnus's Free Slot"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleLocalDeleteMentorship(req);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title={lang === 'hi' ? 'हटाएं' : 'Remove'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Scheduled Session Pass Details for Student (Light Green Water-Glass Style) */}
                          {isScheduled ? (
                            <div className="mt-3 bg-gradient-to-b from-emerald-100/80 via-emerald-50/85 to-teal-50/65 backdrop-blur-md text-emerald-950 rounded-2xl p-3.5 sm:p-4 space-y-3 border border-emerald-300/85 shadow-[0_6px_20px_-4px_rgba(16,185,129,0.14),inset_0_1.5px_2px_rgba(255,255,255,0.95)]">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                  {lang === 'hi'
                                    ? 'एलुमनाई द्वारा निर्धारित सेशन समय (Confirmed Schedule)'
                                    : 'Confirmed Session Schedule (When Alumnus is Free)'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <div className="bg-white/85 backdrop-blur-sm rounded-xl p-2.5 border border-emerald-200/90 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.08),inset_0_1px_1px_rgba(255,255,255,1)]">
                                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                                    {lang === 'hi' ? 'तारीख (Date)' : 'Session Date'}
                                  </span>
                                  <span className="font-extrabold text-[#002855] text-sm mt-0.5 block">
                                    📅 {req.session_date || 'Upcoming Slot'}
                                  </span>
                                </div>
                                <div className="bg-white/85 backdrop-blur-sm rounded-xl p-2.5 border border-emerald-200/90 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.08),inset_0_1px_1px_rgba(255,255,255,1)]">
                                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                                    {lang === 'hi' ? 'समय (Time Slot)' : 'Time Slot'}
                                  </span>
                                  <span className="font-extrabold text-[#b45309] text-sm mt-0.5 block">
                                    ⏰ {req.session_time || req.preferred_slot}
                                  </span>
                                </div>
                                <div className="bg-white/85 backdrop-blur-sm rounded-xl p-2.5 border border-emerald-200/90 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.08),inset_0_1px_1px_rgba(255,255,255,1)]">
                                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                                    {lang === 'hi' ? 'माध्यम (Mode)' : 'Session Mode'}
                                  </span>
                                  <span className="font-bold text-emerald-950 text-xs mt-0.5 block">
                                    💻 {req.session_mode || 'Online Video Session'}
                                  </span>
                                </div>
                              </div>

                              {req.mentor_note && (
                                <div className="bg-white/85 backdrop-blur-sm rounded-xl p-2.5 border border-emerald-200/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] text-xs">
                                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                                    {lang === 'hi' ? 'एलुमनाई का संदेश (Mentor Note):' : 'Message from Alumnus:'}
                                  </span>
                                  <p className="text-emerald-950 font-semibold mt-0.5">"{req.mentor_note}"</p>
                                </div>
                              )}

                              {req.meeting_link && (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                  <span className="text-[11px] text-emerald-800 font-semibold truncate max-w-xs">
                                    🔗 {req.meeting_link}
                                  </span>
                                  {req.meeting_link.startsWith('http') && (
                                    <a
                                      href={req.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-4 py-1.5 rounded-xl bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white border border-emerald-400/70 font-extrabold text-xs inline-flex items-center gap-1.5 transition-all shadow-[0_4px_12px_-2px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                      <span>{lang === 'hi' ? 'मीटिंग जॉइन करें' : 'Join Session Link'}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2.5 text-xs text-slate-600">
                              {lang === 'hi'
                                ? 'आपका अनुरोध एलुमनाई को ईमेल और उनके अकाउंट में भेज दिया गया है। जैसे ही वे अपना खाली समय चुनेंगे, आपको यहाँ नोटिफिकेशन मिल जाएगा।'
                                : 'Your request has been sent to the Alumnus via email & account notification. You will be notified here as soon as they schedule their free slot.'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                    <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      {lang === 'hi'
                        ? 'आपने अभी तक कोई मेन्टरशिप सेशन बुक नहीं किया है'
                        : 'You have not requested any mentorship sessions yet'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-3 max-w-md mx-auto">
                      {lang === 'hi'
                        ? 'एलुमनाई डायरेक्टरी में किसी भी वेरिफाइड एलुमनाई के कार्ड पर "Mentor" बटन दबाकर करियर गाइडेंस या अन्य सहायता प्राप्त करें।'
                        : 'Click the "Mentor" button on any Alumnus card in the Directory to request Career Guidance or a 1-on-1 session.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          const el = document.getElementById('directory');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 200);
                      }}
                      className="px-4 py-2 rounded-xl btn-mcu-saffron text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'एलुमनाई डायरेक्टरी से मेन्टर चुनें' : 'Find a Mentor in Alumni Directory'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {t.actions.cancel}
            </button>

            {activeTab === 'job' && isVerified ? (
              <button
                type="submit"
                disabled={isPostingJob}
                className="px-6 py-2.5 rounded-xl btn-mcu-saffron text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isPostingJob
                    ? (lang === 'hi' ? 'प्रसारित हो रहा है...' : 'Broadcasting...')
                    : (lang === 'hi' ? 'Jobs & Careers में प्रसारित करें' : 'Broadcast to Jobs & Careers')}
                </span>
              </button>
            ) : (activeTab === 'job' || activeTab === 'applications' || activeTab === 'my_applications' || activeTab === 'mentorship') ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'पूर्ण (Done)' : 'Done'}</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? (lang === 'hi' ? 'सहेज रहे हैं...' : 'Saving Changes...')
                    : (lang === 'hi' ? 'विवरण सुरक्षित करें' : 'Save Changes')}
                </span>
              </button>
            )}
          </div>
        </form>

        {previewingApp && (
          <ResumePreviewModal
            application={previewingApp}
            currentUser={user}
            isApplicant={isApplicantForUser(previewingApp)}
            canManageStatus={activeTab === 'applications' && !isApplicantForUser(previewingApp)}
            onClose={() => setPreviewingApp(null)}
            onUpdateStatus={(appId, newStatus) => {
              if (onUpdateApplicationStatus) onUpdateApplicationStatus(appId, newStatus);
              setPreviewingApp((prev) => prev ? { ...prev, status: newStatus } : null);
            }}
          />
        )}
      </div>
    </div>
  );
};
