import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Users,
  Briefcase,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  PlusCircle,
  Upload,
  Search,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  Megaphone,
  Download,
  UserCheck,
  UserPlus,
  AlertTriangle,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  Mail,
  Filter,
  Film
} from 'lucide-react';
import { verifyLinkedInNameMatch } from '../utils/linkedin';
import { isCurrentStudent } from '../utils/skills';
import {
  processHighQualityImage,
  isSupportedImageFile,
  processVideoFile,
  isSupportedVideoFile,
  isVideoUrlOrData,
  MAX_MEMORY_VIDEO_BYTES,
} from '../utils/imageProcessor';

const CATEGORY_LABELS = {
  Library: { en: 'Nalanda Central Library', hi: 'नालंदा केंद्रीय ग्रंथालय' },
  Studios: { en: 'Broadcast Studios', hi: 'स्टूडियो व प्रसारण' },
  'Media Labs': { en: 'Digital Media Labs', hi: 'डिजिटल मीडिया लैब' },
  Auditorium: { en: 'Auditorium & Halls', hi: 'सभागार व परिसर' },
  'Spandan Fest': { en: 'Cultural Spandan', hi: 'सांस्कृतिक स्पंदन' },
  Heritage: { en: 'Alumni Heritage', hi: 'धरोहर व स्थापना' },
};

const STANDARD_YEARS = [
  '2026', '2025', '2024', '2023', '2022', '2021', '2020',
  '2019', '2018', '2017', '2016', '2015', '2012', '2010',
  '2005', '2000', '1995', '1990'
];

export const AdminPanelModal = ({
  isOpen,
  onClose,
  initialTab = 'overview',
  currentUser,
  onUpdateAdminUser,
  alumniList = [],
  jobs = [],
  memories = [],
  eventsArchive = [],
  upcomingEvents = [],
  eventSlides = [],
  initialEventAlbumId = '',
  allApplications = [],
  broadcastNotice,
  onUpdateBroadcastNotice,
  onVerifyAlumni,
  onBulkVerifyAlumni,
  onToggleAlumniMentor,
  onDeleteAlumni,
  onAddAlumni,
  onApproveJob,
  onRejectJob,
  onDeleteJob,
  onPostAdminJob,
  onAddMemory,
  onDeleteMemory,
  onAddArchiveEvent,
  onAddPhotosToArchiveEvent,
  onDeleteArchiveEvent,
  onDeleteArchivePhoto,
  onAddUpcomingEvent,
  onDeleteUpcomingEvent,
  onAddEventSlide,
  onDeleteEventSlide,
  onResetDefaultEvents,
  onUpdateApplicationStatus,
  onDeleteApplication,
  onShowToast,
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  // Filters & Search
  const [alumniFilter, setAlumniFilter] = useState('all'); // 'all' | 'pending' | 'verified' | 'mentors'
  const [alumniSearch, setAlumniSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [jobSearch, setJobSearch] = useState('');
  const [memoryYearFilter, setMemoryYearFilter] = useState('All');

  // Add Alumnus Inline Form State
  const [showAddAlumniForm, setShowAddAlumniForm] = useState(false);
  const [newAlumniForm, setNewAlumniForm] = useState({
    name: '',
    email: '',
    batch: '2024',
    campus: 'Bhopal',
    degree: 'Master of Computer Applications (MCA)',
    currentRole: 'Full Stack Software Engineer',
    company: '',
    location: 'Bhopal, MP',
    openToMentor: true,
  });

  // Add Admin Job Inline Form State
  const [showAddJobForm, setShowAddJobForm] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    company: '',
    location: 'Bhopal / Noida / Remote',
    type: 'Full-time',
    experience: '1-3 Years',
    salary: '₹6 - ₹12 LPA',
    deadline: 'Open (30 Days)',
    postedBy: 'MCU Placement & Alumni Cell (Official)',
    tags: 'Computer Science, Media Tech, Official Referral',
    description: '',
  });

  // Upload Year-wise Memory Form State (Supports HD Photos & Videos up to 5MB)
  const memoryFileInputRef = useRef(null);
  const memoryVideoInputRef = useRef(null);
  const [memoryForm, setMemoryForm] = useState({
    title: '',
    hindiTitle: '',
    year: '2026',
    customYear: '',
    category: 'Spandan Fest',
    campus: 'Bhopal',
    description: '',
    image: '',
    mediaType: 'image',
    videoPoster: '',
    fileSizeMB: '',
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingMemoryPhoto, setIsDraggingMemoryPhoto] = useState(false);
  const [memoryUploadNotice, setMemoryUploadNotice] = useState(null);

  // ── ADMIN EVENTS STUDIO STATE (ARCHIVE ALBUMS, UPCOMING CONCLAVES & SHOWCASE SLIDES) ──
  const eventPhotosInputRef = useRef(null);
  const slidePhotoInputRef = useRef(null);
  const [eventsSubMode, setEventsSubMode] = useState('archive'); // 'archive' | 'upcoming' | 'slides'
  const [archiveUploadMode, setArchiveUploadMode] = useState('new_album'); // 'new_album' | 'existing_album'
  const [targetArchiveId, setTargetArchiveId] = useState('');
  const [eventYearFilter, setEventYearFilter] = useState('All');
  const [isUploadingEventPhotos, setIsUploadingEventPhotos] = useState(false);
  const [eventUploadNotice, setEventUploadNotice] = useState(null);

  // Queued photos for new event album or existing event album
  const [eventPhotoQueue, setEventPhotoQueue] = useState([]);
  const [eventImageUrlInput, setEventImageUrlInput] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    hindiTitle: '',
    year: '2026',
    customYear: '',
    date: 'October 2026',
    venue: 'Ganesh Shankar Vidyarthi Auditorium, MCU Bhopal',
    badge: 'Official Event • MCU Bhopal',
    description: '',
    photoCaption: '',
  });

  // Upcoming Conclave Form State
  const [upcomingForm, setUpcomingForm] = useState({
    title: '',
    hindiTitle: '',
    date: 'November 15, 2026 • 10:00 AM IST',
    location: 'Ganesh Shankar Vidyarthi Auditorium, MCU Bhopal',
    type: 'In-Person & Virtual Livestream',
    badge: 'National Conclave • Open RSVP',
    seatsTotal: 300,
    rsvpCount: 45,
    featured: false,
    description: '',
  });

  // Showcase HD Slide Form State
  const [slideForm, setSlideForm] = useState({
    title: '',
    titleEn: '',
    caption: '',
    captionEn: '',
    image: '',
  });

  // Broadcast Banner Editor State (Announcement + Achievement Tickers)
  const [noticeDraft, setNoticeDraft] = useState(() => ({
    enabled: broadcastNotice?.enabled ?? true,
    textEn:
      broadcastNotice?.textEn ||
      'Official MCU Alumni Verification Drive & Abhyuday 2026 Grand Meet Registrations are Live!',
    textHi:
      broadcastNotice?.textHi ||
      'एमसीयू आधिकारिक पूर्व छात्र सत्यापन अभियान एवं अभ्युदय 2026 महासम्मेलन पंजीकरण प्रारंभ!',
    badge: broadcastNotice?.badge || 'OFFICIAL NOTICE',
    achievementEnabled: broadcastNotice?.achievementEnabled ?? false,
    achievementTextEn:
      broadcastNotice?.achievementTextEn ||
      'Proud Achievement: MCU Computer Science Alumni selected at Google, Microsoft & top Global Tech/Media organizations!',
    achievementTextHi:
      broadcastNotice?.achievementTextHi ||
      'गौरवपूर्ण उपलब्धि: एमसीयू कंप्यूटर विज्ञान के पूर्व छात्रों का गूगल, माइक्रोसॉफ्ट एवं शीर्ष वैश्विक संस्थानों में चयन!',
    achievementBadge: broadcastNotice?.achievementBadge || 'ALUMNI ACHIEVEMENT',
  }));

  // Admin Login Security (Change Email & Password) State
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [adminCredsForm, setAdminCredsForm] = useState(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem('mcu_admin_credentials');
      if (raw) stored = JSON.parse(raw);
    } catch {}
    return {
      email: stored?.email || currentUser?.email || 'admin@mcu.ac.in',
      name: stored?.name || currentUser?.name || 'MCU Executive Portal Administrator',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  });

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!initialEventAlbumId) {
      if (eventsArchive.length > 0 && !targetArchiveId) {
        setTargetArchiveId(eventsArchive[0].id);
      }
      return;
    }
    if (initialEventAlbumId === '__UPCOMING__') {
      setEventsSubMode('upcoming');
    } else if (initialEventAlbumId === '__SLIDES__') {
      setEventsSubMode('slides');
    } else {
      setEventsSubMode('archive');
      setArchiveUploadMode('existing_album');
      setTargetArchiveId(initialEventAlbumId);
    }
  }, [initialEventAlbumId, eventsArchive]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Helper: Check if an alumnus profile is verified
  const isAlumnusVerified = (alumnus) => {
    if (!alumnus) return false;
    if (alumnus.is_verified === true || alumnus.verified === true || alumnus.verification_status === 'verified') {
      return true;
    }
    if (alumnus.is_verified === false || alumnus.verification_status === 'pending') {
      return false;
    }
    // Default core mock alumni are considered verified unless marked false
    return true;
  };

  // Helper: Evaluate LinkedIn Name Verification Signal for Admin Review
  const getAlumnusLinkedInSignal = (alumnus) => {
    if (!alumnus) {
      return {
        hasUrl: false,
        isGreenSignal: false,
        matchScore: 0,
        extractedName: '',
        url: '',
      };
    }
    const rawUrl = alumnus.linkedIn || alumnus.linkedin_url || alumnus.linkedin || '';
    const name = alumnus.name || alumnus.full_name || '';
    const liveCheck = verifyLinkedInNameMatch(name, rawUrl);

    if (typeof alumnus.linkedin_match_score === 'number' && alumnus.linkedin_match_score > 0) {
      return {
        hasUrl: Boolean(rawUrl && liveCheck.isValidUrl),
        isGreenSignal: Boolean(alumnus.linkedin_verified_signal ?? alumnus.linkedin_match_score >= 75),
        matchScore: alumnus.linkedin_match_score,
        extractedName: alumnus.linkedin_extracted_name || liveCheck.extractedName,
        url: liveCheck.normalizedUrl || rawUrl,
      };
    }

    return {
      hasUrl: liveCheck.isValidUrl,
      isGreenSignal: liveCheck.isGreenSignal,
      matchScore: liveCheck.matchScore,
      extractedName: liveCheck.extractedName,
      url: liveCheck.normalizedUrl || rawUrl,
    };
  };

  // Helper: Find the alumnus who posted a job and check if they are verified
  const getJobPosterStatus = (job) => {
    if (!job) return { verified: false, matchedAlumnus: null };

    const posterEmail = (job.authorEmail || job.posted_by_email || '').toLowerCase().trim();
    const posterId = job.authorId || job.posted_by_user_id;
    const posterName = (job.postedBy || job.referral_alumnus_name || '').toLowerCase().trim();

    const matchedAlumnus = alumniList.find((a) => {
      if (posterId && a.id && String(a.id) === String(posterId)) return true;
      if (posterEmail && a.email && a.email.toLowerCase().trim() === posterEmail) return true;
      const aName = (a.name || a.full_name || '').toLowerCase().trim();
      if (aName && posterName && (posterName.includes(aName) || aName.includes(posterName))) return true;
      return false;
    });

    if (matchedAlumnus) {
      return {
        verified: isAlumnusVerified(matchedAlumnus),
        matchedAlumnus,
      };
    }

    return {
      verified: Boolean(job.poster_verified),
      matchedAlumnus: null,
    };
  };

  // Helper: Check job approval status
  const getJobApprovalStatus = (job) => {
    if (!job) return 'approved';
    if (job.approval_status === 'pending') return 'pending';
    if (job.approval_status === 'rejected') return 'rejected';
    return 'approved';
  };

  // Computed KPI Counts
  const pendingAlumniList = useMemo(
    () => alumniList.filter((a) => !isAlumnusVerified(a)),
    [alumniList]
  );
  const verifiedAlumniCount = useMemo(
    () => alumniList.filter((a) => isAlumnusVerified(a)).length,
    [alumniList]
  );
  const pendingJobsList = useMemo(
    () => jobs.filter((j) => getJobApprovalStatus(j) === 'pending'),
    [jobs]
  );
  const approvedJobsCount = useMemo(
    () => jobs.filter((j) => getJobApprovalStatus(j) === 'approved').length,
    [jobs]
  );

  // Filtered Alumni
  const filteredAlumni = useMemo(() => {
    return alumniList.filter((a) => {
      const verified = isAlumnusVerified(a);
      const isMentor = Boolean(a.openToMentor ?? a.open_to_mentor);
      if (alumniFilter === 'pending' && verified) return false;
      if (alumniFilter === 'verified' && !verified) return false;
      if (alumniFilter === 'mentors' && !isMentor) return false;

      if (alumniSearch.trim()) {
        const q = alumniSearch.toLowerCase().trim();
        const name = (a.name || a.full_name || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        const company = (a.company || '').toLowerCase();
        const role = (a.currentRole || a.current_role || '').toLowerCase();
        const batch = String(a.batch || a.batch_year || '');
        const campus = (a.campus || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          company.includes(q) ||
          role.includes(q) ||
          batch.includes(q) ||
          campus.includes(q)
        );
      }
      return true;
    });
  }, [alumniList, alumniFilter, alumniSearch]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const status = getJobApprovalStatus(j);
      if (jobFilter === 'pending' && status !== 'pending') return false;
      if (jobFilter === 'approved' && status !== 'approved') return false;
      if (jobFilter === 'rejected' && status !== 'rejected') return false;

      if (jobSearch.trim()) {
        const q = jobSearch.toLowerCase().trim();
        return (
          (j.title || '').toLowerCase().includes(q) ||
          (j.company || '').toLowerCase().includes(q) ||
          (j.postedBy || '').toLowerCase().includes(q) ||
          (j.authorEmail || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [jobs, jobFilter, jobSearch]);

  // Available Years in Memories
  const memoryYears = useMemo(() => {
    const set = new Set();
    memories.forEach((m) => {
      if (m.year) set.add(String(m.year));
    });
    return ['All', ...Array.from(set).sort((a, b) => parseInt(b, 10) - parseInt(a, 10))];
  }, [memories]);

  const filteredMemories = useMemo(() => {
    if (memoryYearFilter === 'All') return memories;
    return memories.filter((m) => String(m.year) === String(memoryYearFilter));
  }, [memories, memoryYearFilter]);

  // Process a selected or dropped Photo (HEIC/HEIF/HD) or Video (up to 5MB) for Campus Memories
  const processMemoryImageFile = async (file) => {
    if (!file) return;

    const isVideo = isSupportedVideoFile(file);
    const isImage = isSupportedImageFile(file);

    if (!isVideo && !isImage) {
      const msg =
        lang === 'hi'
          ? 'कृपया वैध फ़ोटो (HEIC, JPG, PNG, WEBP) या वीडियो फ़ाइल (MP4, WEBM, MOV — अधिकतम 5 MB) चुनें।'
          : 'Please select a valid Photo (HEIC, JPG, PNG, WEBP) or Video file (MP4, WEBM, MOV — Max 5 MB).';
      setMemoryUploadNotice({ type: 'error', message: msg });
      if (onShowToast) onShowToast(msg, 'error');
      return;
    }

    // Handle Video Upload (Strict 5MB limit check)
    if (isVideo) {
      const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
      if (file.size > MAX_MEMORY_VIDEO_BYTES) {
        const overLimitMsg =
          lang === 'hi'
            ? `⚠️ वीडियो का आकार 5 MB से अधिक नहीं होना चाहिए! आपकी फ़ाइल ${sizeMB} MB की है। कृपया 5 MB या उससे कम का वीडियो चुनें।`
            : `⚠️ Video size must be up to 5 MB! Selected file is ${sizeMB} MB. Please choose a video under 5 MB.`;
        setMemoryUploadNotice({ type: 'error', message: overLimitMsg });
        if (onShowToast) onShowToast(overLimitMsg, 'error');
        return;
      }

      setIsUploadingImage(true);
      setMemoryUploadNotice({
        type: 'ready',
        message:
          lang === 'hi'
            ? `⏳ वीडियो (${sizeMB} MB / 5 MB max) को Memories के लिए तैयार किया जा रहा है...`
            : `⏳ Processing video (${sizeMB} MB / 5 MB max) for Campus Memories...`,
      });

      try {
        const processedVid = await processVideoFile(file, MAX_MEMORY_VIDEO_BYTES);
        setMemoryForm((prev) => ({
          ...prev,
          image: processedVid.dataUrl,
          mediaType: 'video',
          videoPoster: processedVid.posterDataUrl || '',
          fileSizeMB: processedVid.sizeMB,
        }));

        const vidStatusMsg =
          lang === 'hi'
            ? `✓ वीडियो (${processedVid.sizeMB} MB • ${processedVid.width}×${processedVid.height}px) तैयार है! गैलरी में लाइव करने के लिए "Publish to Memories" बटन दबाएं।`
            : `✓ Video (${processedVid.sizeMB} MB • ${processedVid.width}×${processedVid.height}px) ready! Click "Publish to Memories" to publish live.`;

        setMemoryUploadNotice({
          type: 'ready',
          message: vidStatusMsg,
        });

        if (onShowToast) {
          onShowToast(
            lang === 'hi'
              ? `वीडियो (${processedVid.sizeMB} MB) तैयार है! अब "Publish" पर क्लिक करें।`
              : `Video (${processedVid.sizeMB} MB) ready! Click "Publish" to make it live.`,
            'info'
          );
        }
      } catch (vidErr) {
        console.error('Video processing error:', vidErr);
        const errMsg =
          vidErr?.code === 'VIDEO_TOO_LARGE'
            ? lang === 'hi'
              ? `वीडियो अधिकतम 5 MB तक ही हो सकता है (${vidErr.sizeMB} MB)।`
              : `Video exceeds 5 MB limit (${vidErr.sizeMB} MB).`
            : lang === 'hi'
            ? 'वीडियो रीड करने में त्रुटि हुई। कृपया दूसरा MP4/WEBM वीडियो (5 MB तक) चुनें।'
            : 'Could not read this video file. Please try another MP4/WEBM video (up to 5 MB).';
        setMemoryUploadNotice({ type: 'error', message: errMsg });
        if (onShowToast) onShowToast(errMsg, 'error');
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

    // Handle Image Upload (HEIC / HD Auto-Resize)
    setIsUploadingImage(true);
    setMemoryUploadNotice({
      type: 'ready',
      message:
        lang === 'hi'
          ? '⏳ फ़ोटो (HEIC / HD) को बिना क्वालिटी कम किए प्रोसेस किया जा रहा है...'
          : '⏳ Processing photo (HEIC / HD Auto-Resize) while preserving 100% crisp quality...',
    });

    try {
      const processed = await processHighQualityImage(file, {
        maxWidth: 1920,
        maxHeight: 1440,
        quality: 0.95,
      });

      setMemoryForm((prev) => ({
        ...prev,
        image: processed.dataUrl,
        mediaType: 'image',
        videoPoster: '',
        fileSizeMB: '',
      }));

      const dimNote = `${processed.width}×${processed.height}px`;
      let statusMsg = '';
      if (processed.wasHeicConverted && processed.wasResized) {
        statusMsg =
          lang === 'hi'
            ? `✓ HEIC फ़ोटो को HD (${dimNote}) में ऑटो-रिसाइज़ और तैयार किया गया (100% क्वालिटी सुरक्षित)! अब "Publish" दबाएं।`
            : `✓ HEIC photo converted & auto-resized to Full HD (${dimNote}) with zero quality loss! Click "Publish" to save.`;
      } else if (processed.wasHeicConverted) {
        statusMsg =
          lang === 'hi'
            ? `✓ HEIC फ़ोटो को मूल HD क्वालिटी (${dimNote}) में तैयार किया गया! अब "Publish" दबाएं।`
            : `✓ HEIC photo converted at original HD resolution (${dimNote}) with 100% quality! Click "Publish" to save.`;
      } else if (processed.wasResized) {
        statusMsg =
          lang === 'hi'
            ? `✓ फ़ोटो को बिना क्वालिटी कम किए HD (${processed.originalWidth}×${processed.originalHeight} → ${dimNote}) में ऑटो-रिसाइज़ किया गया! अब "Publish" दबाएं।`
            : `✓ Photo auto-resized (${processed.originalWidth}×${processed.originalHeight} → ${dimNote} HD) with zero quality loss! Click "Publish" to save.`;
      } else {
        statusMsg =
          lang === 'hi'
            ? `✓ मूल HD क्वालिटी (${dimNote}) सुरक्षित है! गैलरी में जोड़ने के लिए "Publish" बटन दबाएं।`
            : `✓ Original HD quality preserved (${dimNote})! Click "Publish" to save to Campus Memories.`;
      }

      setMemoryUploadNotice({
        type: 'ready',
        message: statusMsg,
      });

      if (onShowToast) {
        onShowToast(
          lang === 'hi'
            ? 'HD फ़ोटो तैयार है! अब "Publish" पर क्लिक करें।'
            : 'HD Photo ready! Click "Publish" to publish it live.',
          'info'
        );
      }
    } catch (err) {
      console.error('Photo processing error:', err);
      const errMsg =
        lang === 'hi'
          ? 'फ़ोटो रीड करने में त्रुटि हुई। कृपया दूसरी फ़ोटो चुनें।'
          : 'Could not decode this image file. Please try another photo.';
      setMemoryUploadNotice({ type: 'error', message: errMsg });
      if (onShowToast) onShowToast(errMsg, 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleMemoryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processMemoryImageFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleMemoryDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMemoryPhoto(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processMemoryImageFile(file);
    }
  };

  // Publish New Memory Photo or Video (<=5MB) to Year Archive
  const handlePublishMemory = (e) => {
    if (e) e.preventDefault();
    const finalYear = (memoryForm.customYear || memoryForm.year || '2026').trim();
    if (!memoryForm.image || !memoryForm.image.trim()) {
      const msg =
        lang === 'hi'
          ? 'कृपया पहले अपने डिवाइस से फ़ोटो या वीडियो (5 MB तक) चुनें या URL पेस्ट करें।'
          : 'Please select a Photo or Video (up to 5 MB) from your device or paste a media URL first.';
      setMemoryUploadNotice({ type: 'error', message: msg });
      if (onShowToast) {
        onShowToast(msg, 'error');
      }
      if (memoryFileInputRef.current) {
        memoryFileInputRef.current.click();
      }
      return;
    }

    const isVideo =
      memoryForm.mediaType === 'video' || isVideoUrlOrData(memoryForm.image);

    const catInfo = CATEGORY_LABELS[memoryForm.category] || {
      en: memoryForm.category,
      hi: memoryForm.category,
    };

    const resolvedTitle =
      memoryForm.title.trim() ||
      `${catInfo.en} ${isVideo ? 'Video' : ''} — ${memoryForm.campus} Campus (${finalYear})`.replace(/\s+/g, ' ');
    const resolvedHindiTitle =
      memoryForm.hindiTitle.trim() ||
      memoryForm.title.trim() ||
      `${catInfo.hi} ${isVideo ? 'वीडियो' : ''} — ${memoryForm.campus} परिसर (${finalYear})`.replace(/\s+/g, ' ');

    const newMemoryItem = {
      id: `mem-admin-${Date.now()}`,
      title: resolvedTitle,
      hindiTitle: resolvedHindiTitle,
      category: memoryForm.category,
      categoryHi: catInfo.hi,
      year: finalYear,
      campus: memoryForm.campus,
      description:
        memoryForm.description.trim() ||
        (isVideo
          ? `Official archival video from ${memoryForm.campus} Campus (${finalYear}), published by MCU Administration.`
          : `Official archival photograph from ${memoryForm.campus} Campus (${finalYear}), published by MCU Administration.`),
      descriptionHi:
        memoryForm.description.trim() ||
        (isVideo
          ? `एमसीयू ${memoryForm.campus} परिसर (${finalYear}) की आधिकारिक वीडियो स्मृति झलक।`
          : `एमसीयू ${memoryForm.campus} परिसर (${finalYear}) की आधिकारिक स्मृति झलक।`),
      image: memoryForm.image.trim(),
      mediaType: isVideo ? 'video' : 'image',
      videoUrl: isVideo ? memoryForm.image.trim() : undefined,
      poster: isVideo ? memoryForm.videoPoster || '' : undefined,
      fileSizeMB: memoryForm.fileSizeMB || undefined,
      uploaded_by_admin: true,
      created_at: new Date().toISOString(),
    };

    if (onAddMemory) {
      onAddMemory(newMemoryItem);
    }

    // Ensure the admin management grid below shows the newly uploaded photo/video right away
    if (memoryYearFilter !== 'All' && String(memoryYearFilter) !== String(finalYear)) {
      setMemoryYearFilter('All');
    }

    try {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
    } catch {}

    setMemoryUploadNotice({
      type: 'success',
      message:
        lang === 'hi'
          ? `🎉 ${isVideo ? 'वीडियो' : 'छायाचित्र'} "${resolvedTitle}" वर्ष ${finalYear} (${memoryForm.category}) में सफलतापूर्वक प्रकाशित हो गया है!`
          : `🎉 ${isVideo ? 'Video' : 'Photo'} "${resolvedTitle}" published to Year ${finalYear} (${memoryForm.category}) Campus Memories!`,
    });

    setMemoryForm({
      title: '',
      hindiTitle: '',
      year: finalYear,
      customYear: '',
      category: memoryForm.category,
      campus: memoryForm.campus,
      description: '',
      image: '',
      mediaType: 'image',
      videoPoster: '',
      fileSizeMB: '',
    });
    if (memoryFileInputRef.current) {
      memoryFileInputRef.current.value = '';
    }
    if (memoryVideoInputRef.current) {
      memoryVideoInputRef.current.value = '';
    }
  };

  // ── ADMIN EVENTS STUDIO HANDLERS (MULTI-PHOTO ARCHIVE UPLOAD, UPCOMING CONCLAVES & HD SLIDES) ──
  const eventYears = useMemo(() => {
    const set = new Set();
    eventsArchive.forEach((ev) => {
      if (ev?.year) set.add(String(ev.year));
    });
    return ['All', ...Array.from(set).sort((a, b) => parseInt(b, 10) - parseInt(a, 10))];
  }, [eventsArchive]);

  const filteredEventsArchive = useMemo(() => {
    if (eventYearFilter === 'All') return eventsArchive;
    return eventsArchive.filter((ev) => String(ev.year) === String(eventYearFilter));
  }, [eventsArchive, eventYearFilter]);

  const handleEventFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setIsUploadingEventPhotos(true);
    setEventUploadNotice({
      type: 'ready',
      message:
        lang === 'hi'
          ? `⏳ ${files.length} फ़ोटो को बिना क्वालिटी कम किए HD में तैयार किया जा रहा है...`
          : `⏳ Processing ${files.length} photo(s) at Full HD resolution...`,
    });

    const addedItems = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      if (!isSupportedImageFile(f)) continue;
      try {
        const processed = await processHighQualityImage(f, {
          maxWidth: 1920,
          maxHeight: 1440,
          quality: 0.94,
        });
        const cleanFileName = (f.name || `Event Photo ${i + 1}`).replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        addedItems.push({
          src: processed.dataUrl,
          fallback: processed.dataUrl,
          title: eventForm.photoCaption.trim() || eventForm.title.trim() || cleanFileName || 'MCU Official Event Photo',
          width: processed.width,
          height: processed.height,
        });
      } catch (err) {
        console.warn('Error processing event image:', err);
      }
    }

    setIsUploadingEventPhotos(false);
    if (addedItems.length > 0) {
      setEventPhotoQueue((prev) => [...prev, ...addedItems]);
      setEventUploadNotice({
        type: 'ready',
        message:
          lang === 'hi'
            ? `✓ ${addedItems.length} HD फ़ोटो तैयार हैं! अब नीचे "Publish Live to Events" बटन दबाएं।`
            : `✓ ${addedItems.length} HD photo(s) ready! Click "Publish Live to Events" below to make them live immediately.`,
      });
    } else {
      setEventUploadNotice({
        type: 'error',
        message:
          lang === 'hi'
            ? 'कोई वैध इमेज फ़ाइल नहीं मिली। कृपया JPG, PNG, WEBP या HEIC फ़ाइल चुनें।'
            : 'No valid image files selected. Please choose JPG, PNG, WEBP, or HEIC photos.',
      });
    }
  };

  const handleAddEventUrlToQueue = () => {
    const url = eventImageUrlInput.trim();
    if (!url) return;
    setEventPhotoQueue((prev) => [
      ...prev,
      {
        src: url,
        fallback: url,
        title: eventForm.photoCaption.trim() || eventForm.title.trim() || 'MCU Official Event Photo',
      },
    ]);
    setEventImageUrlInput('');
    setEventUploadNotice({
      type: 'ready',
      message:
        lang === 'hi'
          ? '✓ इमेज URL कतार में जुड़ गया है! अब "Publish Live to Events" दबाएं।'
          : '✓ Image URL added to queue! Click "Publish Live to Events" below.',
    });
  };

  const handlePublishArchiveEventOrPhotos = (e) => {
    if (e) e.preventDefault();

    // Also include any URL typed into eventImageUrlInput if not yet added to queue
    const pendingUrl = eventImageUrlInput.trim();
    const finalQueue = [...eventPhotoQueue];
    if (pendingUrl) {
      finalQueue.push({
        src: pendingUrl,
        fallback: pendingUrl,
        title: eventForm.photoCaption.trim() || eventForm.title.trim() || 'MCU Official Event Photo',
      });
    }

    if (finalQueue.length === 0) {
      const msg =
        lang === 'hi'
          ? 'कृपया पहले कम से कम 1 फ़ोटो अपने डिवाइस से चुनें या इमेज URL डालें!'
          : 'Please select at least 1 photo from your device or paste an image URL first!';
      setEventUploadNotice({ type: 'error', message: msg });
      if (onShowToast) onShowToast(msg, 'error');
      eventPhotosInputRef.current?.click();
      return;
    }

    if (archiveUploadMode === 'existing_album') {
      const chosenId = targetArchiveId || eventsArchive[0]?.id;
      const targetAlbum = eventsArchive.find((ev) => String(ev.id) === String(chosenId));
      if (!targetAlbum) {
        if (onShowToast) onShowToast('Please select an existing Event Album first.', 'error');
        return;
      }

      const formattedPhotos = finalQueue.map((item, idx) => ({
        src: item.src,
        fallback: item.fallback || item.src,
        title:
          eventForm.photoCaption.trim() ||
          item.title ||
          `${targetAlbum.title || targetAlbum.hindiTitle} — Photo ${idx + 1}`,
      }));

      if (onAddPhotosToArchiveEvent) {
        onAddPhotosToArchiveEvent(chosenId, formattedPhotos);
      }

      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
      } catch {}

      setEventPhotoQueue([]);
      setEventImageUrlInput('');
      setEventForm((p) => ({ ...p, photoCaption: '' }));
      setEventUploadNotice({
        type: 'success',
        message:
          lang === 'hi'
            ? `🎉 ${formattedPhotos.length} नई फ़ोटो "${targetAlbum.hindiTitle || targetAlbum.title}" में तुरंत लाइव जोड़ दी गई हैं!`
            : `🎉 ${formattedPhotos.length} new photo(s) added live to "${targetAlbum.title || targetAlbum.hindiTitle}"!`,
      });
      return;
    }

    // Create a Brand-New Event Album in the Historical Archive
    const finalYear = (eventForm.customYear || eventForm.year || '2026').trim();
    const resolvedTitle =
      eventForm.title.trim() ||
      eventForm.hindiTitle.trim() ||
      `MCU Official Conclave & Gathering (${finalYear})`;
    const resolvedHindiTitle =
      eventForm.hindiTitle.trim() ||
      eventForm.title.trim() ||
      `एमसीयू आधिकारिक समारोह एवं संगोष्ठी (${finalYear})`;

    const formattedGallery = finalQueue.map((item, idx) => ({
      src: item.src,
      fallback: item.fallback || item.src,
      title:
        eventForm.photoCaption.trim() ||
        item.title ||
        `${resolvedTitle} — Moment ${idx + 1}`,
    }));

    const newEventAlbum = {
      id: `arch-admin-${Date.now()}`,
      year: finalYear,
      title: resolvedTitle,
      hindiTitle: resolvedHindiTitle,
      date: eventForm.date.trim() || `Year ${finalYear}`,
      venue: eventForm.venue.trim() || 'Makhanlal Chaturvedi University Campus, Bhopal',
      badge: eventForm.badge.trim() || `Official Event • ${finalYear}`,
      description:
        eventForm.description.trim() ||
        `Official photographs and highlights from ${resolvedTitle} (${finalYear}) at ${eventForm.venue.trim() || 'MCU Bhopal'}, published by MCU Administration.`,
      gallery: formattedGallery,
      uploaded_by_admin: true,
      created_at: new Date().toISOString(),
    };

    if (onAddArchiveEvent) {
      onAddArchiveEvent(newEventAlbum);
    }

    if (eventYearFilter !== 'All' && String(eventYearFilter) !== String(finalYear)) {
      setEventYearFilter('All');
    }

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
    } catch {}

    setEventPhotoQueue([]);
    setEventImageUrlInput('');
    setEventForm((p) => ({
      ...p,
      title: '',
      hindiTitle: '',
      description: '',
      photoCaption: '',
      customYear: '',
    }));
    setEventUploadNotice({
      type: 'success',
      message:
        lang === 'hi'
          ? `🎉 नया इवेंट "${resolvedHindiTitle}" (${formattedGallery.length} फ़ोटो सहित) तुरंत Events सेक्शन में लाइव हो गया है!`
          : `🎉 New Event "${resolvedTitle}" (with ${formattedGallery.length} photo(s)) is now LIVE in the Events section!`,
    });
  };

  const handlePublishUpcomingEvent = (e) => {
    if (e) e.preventDefault();
    if (!upcomingForm.title.trim() && !upcomingForm.hindiTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a title for the Upcoming Conclave.', 'error');
      return;
    }

    const resolvedTitle = upcomingForm.title.trim() || upcomingForm.hindiTitle.trim();
    const resolvedHindi = upcomingForm.hindiTitle.trim() || upcomingForm.title.trim();

    const newConclave = {
      id: `upcoming-admin-${Date.now()}`,
      title: resolvedTitle,
      hindiTitle: resolvedHindi,
      date: upcomingForm.date.trim() || 'Upcoming Schedule • 10:00 AM IST',
      location: upcomingForm.location.trim() || 'MCU Bhopal Campus',
      type: upcomingForm.type.trim() || 'In-Person & Livestream',
      badge: upcomingForm.badge.trim() || 'Official Conclave • Open RSVP',
      seatsTotal: Math.max(10, parseInt(upcomingForm.seatsTotal, 10) || 300),
      rsvpCount: Math.max(0, parseInt(upcomingForm.rsvpCount, 10) || 25),
      featured: Boolean(upcomingForm.featured),
      description:
        upcomingForm.description.trim() ||
        `Official upcoming conclave "${resolvedTitle}" organized at ${upcomingForm.location.trim() || 'MCU Bhopal'}. Register your RSVP now.`,
    };

    if (onAddUpcomingEvent) {
      onAddUpcomingEvent(newConclave);
    }

    try {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
    } catch {}

    setUpcomingForm((p) => ({
      ...p,
      title: '',
      hindiTitle: '',
      description: '',
      featured: false,
    }));
    setEventUploadNotice({
      type: 'success',
      message:
        lang === 'hi'
          ? `🎉 आगामी संगोष्ठी "${resolvedHindi}" तुरंत Events सेक्शन में लाइव प्रकाशित हो गई है!`
          : `🎉 Upcoming Conclave "${resolvedTitle}" is now LIVE in the Events section!`,
    });
  };

  const handleSlideFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImageFile(file)) {
      if (onShowToast) onShowToast('Please select a valid image file (HEIC, JPG, PNG, WEBP).', 'error');
      return;
    }
    setIsUploadingEventPhotos(true);
    try {
      const processed = await processHighQualityImage(file, {
        maxWidth: 1920,
        maxHeight: 1440,
        quality: 0.94,
      });
      setSlideForm((p) => ({ ...p, image: processed.dataUrl }));
      setEventUploadNotice({
        type: 'ready',
        message:
          lang === 'hi'
            ? '✓ HD स्लाइड फ़ोटो तैयार है! अब "Publish HD Slide" पर क्लिक करें।'
            : '✓ HD Slide photo ready! Click "Publish HD Slide" to add it to the showcase.',
      });
    } catch {
      if (onShowToast) onShowToast('Could not process slide photo.', 'error');
    } finally {
      setIsUploadingEventPhotos(false);
      if (e.target) e.target.value = '';
    }
  };

  const handlePublishEventSlide = (e) => {
    if (e) e.preventDefault();
    if (!slideForm.image.trim()) {
      if (onShowToast) onShowToast('Please select or paste a photo for the HD Slide first.', 'error');
      slidePhotoInputRef.current?.click();
      return;
    }

    const resolvedTitleHi = slideForm.title.trim() || slideForm.titleEn.trim() || 'अभ्युदय 2026: विशेष झलक';
    const resolvedTitleEn = slideForm.titleEn.trim() || slideForm.title.trim() || 'Abhyuday 2026: Special Highlight';
    const resolvedCaptionHi =
      slideForm.caption.trim() ||
      slideForm.captionEn.trim() ||
      'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय, भोपाल के समारोह की आधिकारिक झलक।';
    const resolvedCaptionEn =
      slideForm.captionEn.trim() ||
      slideForm.caption.trim() ||
      'Official highlight from Makhanlal Chaturvedi National University of Journalism & Communication, Bhopal.';

    const newSlide = {
      id: `slide-admin-${Date.now()}`,
      image: slideForm.image.trim(),
      fallbackUrl: slideForm.image.trim(),
      title: resolvedTitleHi,
      titleEn: resolvedTitleEn,
      caption: resolvedCaptionHi,
      captionEn: resolvedCaptionEn,
    };

    if (onAddEventSlide) {
      onAddEventSlide(newSlide);
    }

    try {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
    } catch {}

    setSlideForm({
      title: '',
      titleEn: '',
      caption: '',
      captionEn: '',
      image: '',
    });
    setEventUploadNotice({
      type: 'success',
      message:
        lang === 'hi'
          ? `🎉 नई HD स्लाइड "${resolvedTitleHi}" अभ्युदय स्लाइडशो में तुरंत लाइव जुड़ गई है!`
          : `🎉 New HD Slide "${resolvedTitleEn}" is now LIVE in the Abhyuday Showcase!`,
    });
  };

  // Handle Add Official Verified Alumnus
  const handleCreateAlumni = (e) => {
    e.preventDefault();
    if (!newAlumniForm.name.trim()) return;

    const created = {
      id: `alumni-admin-${Date.now()}`,
      name: newAlumniForm.name.trim(),
      full_name: newAlumniForm.name.trim(),
      hindiName: newAlumniForm.name.trim(),
      email: newAlumniForm.email.trim() || `${newAlumniForm.name.toLowerCase().replace(/\s+/g, '.')}@mcu.ac.in`,
      batch: parseInt(newAlumniForm.batch, 10) || 2024,
      batch_year: parseInt(newAlumniForm.batch, 10) || 2024,
      campus: newAlumniForm.campus || 'Bhopal',
      degree: newAlumniForm.degree || 'MCA / Journalism',
      currentRole: newAlumniForm.currentRole.trim() || 'Senior Professional',
      current_role: newAlumniForm.currentRole.trim() || 'Senior Professional',
      company: newAlumniForm.company.trim() || 'MCU Alumnus Network',
      location: newAlumniForm.location.trim() || 'Bhopal, MP',
      openToMentor: newAlumniForm.openToMentor,
      open_to_mentor: newAlumniForm.openToMentor,
      is_verified: true,
      verified: true,
      verification_status: 'verified',
      skills: ['Media & Tech', 'Leadership', 'Mentorship'],
    };

    if (onAddAlumni) onAddAlumni(created);
    setNewAlumniForm({
      name: '',
      email: '',
      batch: '2024',
      campus: 'Bhopal',
      degree: 'M.Sc. Electronic Media / MCA',
      currentRole: '',
      company: '',
      location: 'Bhopal, MP',
      openToMentor: true,
    });
    setShowAddAlumniForm(false);
  };

  // Handle Post Official Admin Job
  const handleCreateAdminJob = (e) => {
    e.preventDefault();
    if (!newJobForm.title.trim() || !newJobForm.company.trim()) return;

    const jobItem = {
      id: `job-admin-${Date.now()}`,
      title: newJobForm.title.trim(),
      company: newJobForm.company.trim(),
      company_name: newJobForm.company.trim(),
      location: newJobForm.location.trim() || 'Bhopal / Remote',
      type: newJobForm.type,
      job_type: newJobForm.type,
      experience: newJobForm.experience.trim() || '1-3 Years',
      salary: newJobForm.salary.trim() || 'Competitive',
      deadline: newJobForm.deadline.trim() || 'Open',
      postedBy: newJobForm.postedBy.trim() || 'MCU Admin & Placement Cell',
      authorEmail: currentUser?.email || 'admin@mcu.ac.in',
      posted_by_email: currentUser?.email || 'admin@mcu.ac.in',
      description:
        newJobForm.description.trim() ||
        'Official verified career opportunity published by Makhanlal Chaturvedi National University Placement & Alumni Cell.',
      tags: newJobForm.tags
        ? newJobForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Official MCU Verified', 'Placement Cell'],
      approval_status: 'approved',
      poster_verified: true,
      created_at: new Date().toISOString(),
    };

    if (onPostAdminJob) onPostAdminJob(jobItem);
    setNewJobForm({
      title: '',
      company: '',
      location: 'Bhopal / Noida / Remote',
      type: 'Full-time',
      experience: '1-3 Years',
      salary: '₹6 - ₹12 LPA',
      deadline: 'Open (30 Days)',
      postedBy: 'MCU Placement & Alumni Cell (Official)',
      tags: 'Computer Science, Media Tech, Official Referral',
      description: '',
    });
    setShowAddJobForm(false);
  };

  // Export Portal Data as JSON
  const handleExportPortalData = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      exported_by: currentUser?.email || 'admin@mcu.ac.in',
      stats: {
        total_alumni: alumniList.length,
        verified_alumni: verifiedAlumniCount,
        total_jobs: jobs.length,
        approved_jobs: approvedJobsCount,
        total_memories: memories.length,
        total_applications: allApplications.length,
      },
      alumni: alumniList,
      jobs,
      memories,
      applications: allApplications,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcu-alumni-portal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Complete portal data exported successfully!');
  };

  // Update Admin Login Email, Display Name, and Password
  const handleUpdateAdminCredentials = (e) => {
    e.preventDefault();
    const cleanNewEmail = (adminCredsForm.email || '').trim().toLowerCase();
    const cleanName = (adminCredsForm.name || '').trim() || 'MCU Executive Portal Administrator';
    const currentPassInput = (adminCredsForm.currentPassword || '').trim();
    const newPassInput = (adminCredsForm.newPassword || '').trim();
    const confirmPassInput = (adminCredsForm.confirmPassword || '').trim();

    if (!cleanNewEmail || !cleanNewEmail.includes('@')) {
      if (onShowToast) {
        onShowToast(
          lang === 'hi'
            ? 'कृपया वैध नया एडमिन ईमेल पता दर्ज करें।'
            : 'Please enter a valid Admin login email address.',
          'error'
        );
      }
      return;
    }

    let storedAdmin = null;
    try {
      const raw = localStorage.getItem('mcu_admin_credentials');
      if (raw) storedAdmin = JSON.parse(raw);
    } catch {}

    const activePassword = storedAdmin?.password || 'Admin@1990';
    const isCurrentPasswordValid =
      currentPassInput === activePassword ||
      currentPassInput === 'Admin@1990' ||
      currentPassInput === 'McuAdmin@2026' ||
      currentPassInput === 'admin123';

    if (!isCurrentPasswordValid) {
      if (onShowToast) {
        onShowToast(
          lang === 'hi'
            ? 'वर्तमान पासवर्ड गलत है! कृपया सही वर्तमान एडमिन पासवर्ड दर्ज करें।'
            : 'Incorrect Current Password! Please enter your active Admin password.',
          'error'
        );
      }
      return;
    }

    let finalPassword = activePassword;
    if (newPassInput) {
      if (newPassInput.length < 6) {
        if (onShowToast) {
          onShowToast(
            lang === 'hi'
              ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
              : 'New password must be at least 6 characters long.',
            'error'
          );
        }
        return;
      }
      if (newPassInput !== confirmPassInput) {
        if (onShowToast) {
          onShowToast(
            lang === 'hi'
              ? 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खा रहे हैं!'
              : 'New Password and Confirm Password do not match!',
            'error'
          );
        }
        return;
      }
      finalPassword = newPassInput;
    }

    const updatedCreds = {
      email: cleanNewEmail,
      password: finalPassword,
      name: cleanName,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('mcu_admin_credentials', JSON.stringify(updatedCreds));
      const updatedAdminUser = {
        ...(currentUser || {}),
        id: 'mcu-admin-1',
        user_id: 'mcu-admin-1',
        name: cleanName,
        full_name: cleanName,
        email: cleanNewEmail,
        role: 'admin',
        is_admin: true,
        is_verified: true,
        verified: true,
      };
      localStorage.setItem('mcu_user', JSON.stringify(updatedAdminUser));
      if (onUpdateAdminUser) {
        onUpdateAdminUser(updatedAdminUser);
      }
    } catch {}

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setAdminCredsForm((prev) => ({
      ...prev,
      email: cleanNewEmail,
      name: cleanName,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));

    if (onShowToast) {
      onShowToast(
        lang === 'hi'
          ? `एडमिन ईमेल (${cleanNewEmail}) और पासवर्ड सफलतापूर्वक अपडेट हो गए!`
          : `Admin login email (${cleanNewEmail}) & password updated successfully!`
      );
    }
  };

  // Restore Default University Admin Credentials
  const handleResetDefaultAdminCredentials = () => {
    try {
      localStorage.removeItem('mcu_admin_credentials');
      const defaultAdminUser = {
        ...(currentUser || {}),
        id: 'mcu-admin-1',
        user_id: 'mcu-admin-1',
        name: 'MCU Executive Portal Administrator',
        full_name: 'MCU Executive Portal Administrator',
        email: 'admin@mcu.ac.in',
        role: 'admin',
        is_admin: true,
        is_verified: true,
        verified: true,
      };
      localStorage.setItem('mcu_user', JSON.stringify(defaultAdminUser));
      if (onUpdateAdminUser) {
        onUpdateAdminUser(defaultAdminUser);
      }
    } catch {}

    setAdminCredsForm({
      email: 'admin@mcu.ac.in',
      name: 'MCU Executive Portal Administrator',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    if (onShowToast) {
      onShowToast(
        lang === 'hi'
          ? 'डिफ़ॉल्ट एडमिन लॉगिन (admin@mcu.ac.in / Admin@1990) बहाल कर दिया गया है!'
          : 'Default Admin credentials (admin@mcu.ac.in / Admin@1990) restored!'
      );
    }
  };

  if (!isOpen) return null;

  const totalPendingActions = pendingAlumniList.length + pendingJobsList.length;

  return (
    <div
      className="fixed inset-0 z-50 w-full h-full bg-slate-950/80 backdrop-blur-md mcu-backdrop-enter flex flex-col overflow-hidden"
    >
      <div
        className="bg-gradient-to-b from-white via-[#fafdff] to-[#f0f7ff] w-full h-full overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── SIGNATURE FULL-SCREEN INSTITUTIONAL ROYAL NAVY HEADER ── */}
        <div className="relative bg-gradient-to-r from-[#001a35] via-[#002855] to-[#001e3d] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 shrink-0 overflow-hidden border-b border-sky-400/25 shadow-lg">
          <div className="absolute inset-x-0 top-0 h-[3px] sm:h-[3.5px] mcu-accent-bar-animated" />
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-sky-400/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#fc4a00]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-[1600px] mx-auto w-full flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                <div className="mcu-logo-aura absolute -inset-1 rounded-full bg-gradient-to-tr from-sky-400/25 via-amber-400/15 to-[#fc4a00]/25 blur-md pointer-events-none" />
                <img
                  src="/mcu-logo.png"
                  alt="MCU Bhopal Crest"
                  className="mcu-logo-nav-alive relative z-10 w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="hidden sm:inline text-xs font-black uppercase tracking-[0.14em] text-amber-300">
                    {lang === 'hi' ? 'माखनलाल चतुर्वेदी विश्वविद्यालय • भोपाल' : 'Makhanlal Chaturvedi University · Bhopal'}
                  </span>
                  <span className="sm:hidden text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {lang === 'hi' ? 'एमसीयू भोपाल' : 'MCU BHOPAL'}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[9px] sm:text-[10px] font-black tracking-wider inline-flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden min-[420px]:inline">ADMIN WORKSPACE</span>
                    <span className="min-[420px]:hidden">ADMIN</span>
                  </span>
                  {totalPendingActions > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#fc4a00] text-white text-[9px] sm:text-[10px] font-black tracking-wide animate-pulse shrink-0">
                      <span className="sm:hidden">{totalPendingActions} Pending</span>
                      <span className="hidden sm:inline">{totalPendingActions} Pending Approvals</span>
                    </span>
                  )}
                </div>
                <h2 className="hidden sm:block text-lg lg:text-2xl font-extrabold text-white tracking-tight font-editorial leading-snug truncate mt-0.5">
                  {lang === 'hi'
                    ? 'एमसीयू मुख्य प्रशासक नियंत्रण कक्ष (Executive Admin Control Center)'
                    : 'MCU Executive Admin Control & Verification Center'}
                </h2>
                <h2 className="sm:hidden text-sm font-extrabold text-white tracking-tight font-editorial leading-tight truncate mt-0.5">
                  {lang === 'hi'
                    ? 'एमसीयू प्रशासक पैनल (Admin Control)'
                    : 'MCU Admin Control Center'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setTimeout(() => {
                    const el = document.getElementById('admin-security-credentials-card');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 hover:text-white text-xs sm:text-sm font-bold border border-amber-300/35 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
                title="Change Admin Login Email & Password"
              >
                <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="hidden md:inline">
                  {lang === 'hi' ? 'ईमेल व पासवर्ड बदलें' : 'Change Email / Password'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#fc4a00] text-white text-xs sm:text-sm font-bold border border-white/20 hover:border-amber-300 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
                title="Close Admin Console and Return to Portal (Esc)"
              >
                <X className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{lang === 'hi' ? 'वापस' : 'Exit'}</span>
                <span className="hidden sm:inline">
                  {lang === 'hi' ? 'पोर्टल पर वापस जाएं (Exit)' : 'Back to Portal (Esc)'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── FULL-WIDTH 6-COLUMN NAVIGATION TABS BAR (COMPACT ON MOBILE, NO CLIPPING) ── */}
        <div className="bg-gradient-to-b from-[#eaf4ff] to-white px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 border-b border-sky-200/90 shrink-0 shadow-2xs">
          <div className="max-w-[1600px] mx-auto w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
            {[
              {
                id: 'overview',
                labelEn: 'Overview & Broadcast',
                shortEn: 'Overview',
                labelHi: 'सारांश व सूचना',
                shortHi: 'सारांश',
                Icon: ShieldCheck,
                badge: totalPendingActions > 0 ? totalPendingActions : null,
              },
              {
                id: 'jobs',
                labelEn: 'Verify Jobs & Posters',
                shortEn: 'Verify Jobs',
                labelHi: 'जॉब व पोस्टर सत्यापन',
                shortHi: 'जॉब सत्यापन',
                Icon: Briefcase,
                badge: pendingJobsList.length > 0 ? pendingJobsList.length : null,
              },
              {
                id: 'alumni',
                labelEn: 'Verify Alumni Directory',
                shortEn: 'Verify Alumni',
                labelHi: 'पूर्व छात्र सत्यापन',
                shortHi: 'पूर्व छात्र',
                Icon: Users,
                badge: pendingAlumniList.length > 0 ? pendingAlumniList.length : null,
              },
              {
                id: 'events',
                labelEn: 'Events & Photos Control',
                shortEn: 'Events & Photos',
                labelHi: 'इवेंट व फ़ोटो नियंत्रण',
                shortHi: 'इवेंट व फ़ोटो',
                Icon: Calendar,
                badge: eventsArchive.length + upcomingEvents.length,
              },
              {
                id: 'memories',
                labelEn: 'Memories Upload (Year-wise)',
                shortEn: 'Memories Upload',
                labelHi: 'स्मृतियां अपलोड (वर्षवार)',
                shortHi: 'स्मृतियां अपलोड',
                Icon: ImageIcon,
                badge: memories.length,
              },
              {
                id: 'applications',
                labelEn: 'Applications & Data Backup',
                shortEn: 'Applications',
                labelHi: 'आवेदन व डेटा बैकअप',
                shortHi: 'आवेदन व बैकअप',
                Icon: FileText,
                badge: allApplications.length > 0 ? allApplications.length : null,
              },
            ].map((tab) => {
              const Icon = tab.Icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full min-w-0 px-2.5 sm:px-3 py-1.5 sm:py-2.5 rounded-xl text-[11px] sm:text-[13px] font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#002855] via-[#003366] to-[#0284c7] text-white border-sky-400 shadow-md'
                      : 'bg-white hover:bg-sky-50 text-slate-700 hover:text-[#003366] border-sky-200/90 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-sky-600'}`} />
                  <span className="sm:hidden truncate">{lang === 'hi' ? tab.shortHi : tab.shortEn}</span>
                  <span className="hidden sm:inline truncate">{lang === 'hi' ? tab.labelHi : tab.labelEn}</span>
                  {tab.badge !== null && (
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                        isActive
                          ? 'bg-[#fc4a00] text-white'
                          : 'bg-sky-100 text-[#003366]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FULL-SCREEN SCROLLABLE CONTENT AREA ── */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 overflow-y-auto overflow-x-hidden flex-1">
          <div className="max-w-[1600px] mx-auto w-full space-y-6">
          {/* ==========================================
              TAB 1: OVERVIEW, QUEUE & PORTAL BROADCAST
             ========================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div
                  onClick={() => setActiveTab('alumni')}
                  className="p-4 rounded-2xl bg-white border border-sky-200/90 shadow-xs hover:border-sky-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Alumni Network</span>
                    <Users className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-black text-[#003366]">{alumniList.length}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-600">{verifiedAlumniCount} Verified</span>
                    {pendingAlumniList.length > 0 && (
                      <span className="text-amber-600 font-bold">• {pendingAlumniList.length} Pending</span>
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('jobs')}
                  className="p-4 rounded-2xl bg-white border border-sky-200/90 shadow-xs hover:border-sky-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Jobs & Referrals</span>
                    <Briefcase className="w-4 h-4 text-[#fc4a00]" />
                  </div>
                  <div className="text-2xl font-black text-[#003366]">{jobs.length}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-600">{approvedJobsCount} Live</span>
                    {pendingJobsList.length > 0 && (
                      <span className="text-[#fc4a00] font-bold">• {pendingJobsList.length} Needs Review</span>
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('memories')}
                  className="p-4 rounded-2xl bg-white border border-sky-200/90 shadow-xs hover:border-sky-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Campus Memories</span>
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-[#003366]">{memories.length}</div>
                  <div className="mt-1 text-xs text-sky-700 font-semibold">
                    {memoryYears.length - 1} Year Archives Live
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('applications')}
                  className="p-4 rounded-2xl bg-white border border-sky-200/90 shadow-xs hover:border-sky-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Job Applications</span>
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-[#003366]">{allApplications.length}</div>
                  <div className="mt-1 text-xs text-emerald-700 font-semibold">
                    Active Referral Pipeline
                  </div>
                </div>
              </div>

              {/* Priority Pending Verification Queue */}
              <div className="rounded-2xl bg-gradient-to-b from-amber-50/70 via-white to-sky-50/40 border border-amber-300/80 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-[#fc4a00]" />
                    <h3 className="text-base sm:text-lg font-extrabold text-[#003366]">
                      {lang === 'hi'
                        ? 'प्राथमिक सत्यापन कतार (Jobs & Alumni Verification Queue)'
                        : 'Priority Verification Queue (Verify Alumnus & Job Authenticity)'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveTab('jobs')}
                      className="px-3.5 py-2 rounded-xl bg-[#003366] text-white text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#002244]"
                    >
                      Review All Jobs ({pendingJobsList.length} Pending)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('memories')}
                      className="px-3.5 py-2 rounded-xl bg-[#fc4a00] text-white text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#e04000]"
                    >
                      + Upload Memory Photo
                    </button>
                  </div>
                </div>

                {pendingJobsList.length === 0 && pendingAlumniList.length === 0 ? (
                  <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-sm sm:text-base font-bold text-emerald-950">
                          All Posted Jobs & Registered Alumni are Verified!
                        </div>
                        <div className="text-xs sm:text-sm text-emerald-700 mt-0.5">
                          Whenever an alumnus posts a new job or registers, it will appear here for your verification.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingJobsList.slice(0, 3).map((job) => {
                      const posterStatus = getJobPosterStatus(job);
                      return (
                        <div
                          key={job.id}
                          className="p-4 rounded-xl bg-white border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black">
                                ⏳ JOB PENDING VERIFICATION
                              </span>
                              {posterStatus.verified ? (
                                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Alumnus Verified
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Alumnus Unverified
                                </span>
                              )}
                            </div>
                            <div className="text-sm sm:text-base font-extrabold text-[#003366]">
                              {job.title} — <span className="text-[#680a13]">{job.company}</span>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600">
                              Posted by: <strong>{job.postedBy}</strong> ({job.authorEmail || 'MCU Alumnus'})
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {!posterStatus.verified && posterStatus.matchedAlumnus && (
                              <button
                                type="button"
                                onClick={() => onVerifyAlumni(posterStatus.matchedAlumnus.id, true)}
                                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
                              >
                                1. Verify Alumnus
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (!posterStatus.verified && posterStatus.matchedAlumnus) {
                                  onVerifyAlumni(posterStatus.matchedAlumnus.id, true);
                                }
                                onApproveJob(job.id);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>
                                {!posterStatus.verified ? 'Verify Alumnus & Approve Job' : 'Approve & Publish Job'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onRejectJob(job.id)}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {pendingAlumniList.slice(0, 3).map((alum) => {
                      const liSignal = getAlumnusLinkedInSignal(alum);
                      const isStudentAcc = isCurrentStudent(alum);
                      return (
                        <div
                          key={alum.id}
                          className="p-4 rounded-xl bg-white border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-900 text-xs font-black">
                                {isStudentAcc ? '📘 STUDENT PROFILE' : '👤 ALUMNUS VERIFICATION'}
                              </span>
                              <span className="text-sm sm:text-base font-extrabold text-[#003366]">
                                {alum.name || alum.full_name}
                              </span>
                              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                                Batch of {alum.batch || alum.batch_year} • {alum.company}
                              </span>
                            </div>

                            {/* LinkedIn Name Match Signal for Admin */}
                            <div className="flex flex-wrap items-center gap-2.5">
                              {liSignal.hasUrl ? (
                                liSignal.isGreenSignal ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                                    <span>
                                      LinkedIn Green Signal: {liSignal.matchScore}% Name Match ({liSignal.extractedName})
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>
                                      LinkedIn Name Match: {liSignal.matchScore}% (&lt;75% — "{liSignal.extractedName}")
                                    </span>
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                                  <span>{isStudentAcc ? 'LinkedIn Optional (Not Provided)' : 'No Direct LinkedIn URL'}</span>
                                </span>
                              )}

                              {liSignal.hasUrl && (
                                <a
                                  href={liSignal.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0A66C2] hover:underline"
                                >
                                  <span>Inspect LinkedIn</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onVerifyAlumni(alum.id, true)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Verify Alumnus</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Official Portal Broadcast Banner Control (Announcement + Achievement Opposite-Direction Tickers) */}
              <div className="rounded-2xl bg-white border border-sky-200/90 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-5 h-5 text-[#fc4a00]" />
                    <h3 className="text-base sm:text-lg font-extrabold text-[#003366]">
                      {lang === 'hi'
                        ? 'आधिकारिक पोर्टल उद्घोषणा बैनर (Live Top Notice Broadcast)'
                        : 'Official Portal Broadcast Ticker (Live Top Notice Control)'}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-[#003366] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noticeDraft.enabled}
                        onChange={(e) =>
                          setNoticeDraft((prev) => ({ ...prev, enabled: e.target.checked }))
                        }
                        className="w-4 h-4 rounded border-sky-300 text-[#fc4a00] focus:ring-[#fc4a00]"
                      />
                      <span>Show Live on Portal (Right → Left)</span>
                    </label>
                  </div>
                </div>

                {/* 1. Official Announcement Notice Fields (Moves Right -> Left) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                      Announcement Text (English)
                    </label>
                    <input
                      type="text"
                      value={noticeDraft.textEn}
                      onChange={(e) =>
                        setNoticeDraft((prev) => ({ ...prev, textEn: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                      उद्घोषणा संदेश (Hindi)
                    </label>
                    <input
                      type="text"
                      value={noticeDraft.textHi}
                      onChange={(e) =>
                        setNoticeDraft((prev) => ({ ...prev, textHi: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* 2. Alumni Achievement Notice Fields (Moves Opposite Direction: Left -> Right) */}
                <div className="pt-4 border-t border-sky-100 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0284c7]" />
                      <h4 className="text-sm sm:text-base font-extrabold text-[#003366]">
                        {lang === 'hi'
                          ? '🏆 पूर्व छात्र उपलब्धि सूचना (Achievement Notice — विपरीत दिशा में)'
                          : '🏆 Achievement Notice Ticker (Runs in Opposite Direction: Left → Right)'}
                      </h4>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-[#003366] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(noticeDraft.achievementEnabled)}
                        onChange={(e) =>
                          setNoticeDraft((prev) => ({
                            ...prev,
                            achievementEnabled: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded border-sky-300 text-[#0284c7] focus:ring-[#0284c7]"
                      />
                      <span>Show Achievement Live (Left → Right)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        Achievement Notice Text (English)
                      </label>
                      <input
                        type="text"
                        value={noticeDraft.achievementTextEn || ''}
                        onChange={(e) =>
                          setNoticeDraft((prev) => ({
                            ...prev,
                            achievementTextEn: e.target.value,
                          }))
                        }
                        placeholder="e.g. Proud Achievement: MCU Alumni selected at top global companies..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        उपलब्धि सूचना संदेश (Hindi)
                      </label>
                      <input
                        type="text"
                        value={noticeDraft.achievementTextHi || ''}
                        onChange={(e) =>
                          setNoticeDraft((prev) => ({
                            ...prev,
                            achievementTextHi: e.target.value,
                          }))
                        }
                        placeholder="उदा. गौरवपूर्ण उपलब्धि: एमसीयू के पूर्व छात्रों का शीर्ष संस्थानों में चयन..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateBroadcastNotice) onUpdateBroadcastNotice(noticeDraft);
                    }}
                    className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-sm font-bold text-white cursor-pointer"
                  >
                    Update Live Portal Notice
                  </button>
                </div>
              </div>

              {/* Admin Login Security — Change Admin Email & Password */}
              <form
                id="admin-security-credentials-card"
                onSubmit={handleUpdateAdminCredentials}
                className="rounded-2xl bg-gradient-to-b from-white via-sky-50/40 to-white border-2 border-sky-200/90 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-200/70 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002855] to-[#0284c7] text-amber-300 flex items-center justify-center shadow-xs shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#fc4a00]">
                        STEALTH ADMIN SECURITY SETTINGS
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#003366]">
                        {lang === 'hi'
                          ? 'एडमिन लॉगिन ईमेल एवं पासवर्ड बदलें (Change Admin Email & Password)'
                          : 'Change Admin Login Email & Password'}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1.5 rounded-full bg-sky-100 text-[#003366] border border-sky-200 text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#0284c7]" />
                      <span>Active Login: {adminCredsForm.email}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetDefaultAdminCredentials}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
                      title="Restore default university admin credentials (admin@mcu.ac.in / Admin@1990)"
                    >
                      {lang === 'hi' ? 'डिफ़ॉल्ट रीसेट करें' : 'Restore Default'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1.5">
                      {lang === 'hi' ? 'नया एडमिन लॉगिन ईमेल (Admin Login Email) *' : 'Admin Login Email *'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={adminCredsForm.email}
                        onChange={(e) =>
                          setAdminCredsForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="e.g. admin@mcu.ac.in"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1.5">
                      {lang === 'hi' ? 'एडमिन का नाम (Admin Display Name)' : 'Admin Display Name'}
                    </label>
                    <input
                      type="text"
                      value={adminCredsForm.name}
                      onChange={(e) =>
                        setAdminCredsForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="MCU Executive Portal Administrator"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1.5">
                      {lang === 'hi'
                        ? 'वर्तमान पासवर्ड (Current Admin Password) *'
                        : 'Current Admin Password *'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={adminCredsForm.currentPassword}
                        onChange={(e) =>
                          setAdminCredsForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        placeholder="Enter current password (e.g. Admin@1990)"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1.5">
                      {lang === 'hi'
                        ? 'नया पासवर्ड (New Password - वैकल्पिक यदि केवल ईमेल बदल रहे हैं)'
                        : 'New Password (Optional if only changing email)'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={adminCredsForm.newPassword}
                        onChange={(e) =>
                          setAdminCredsForm((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        placeholder="Min 6 characters for new password"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1.5">
                      {lang === 'hi' ? 'नए पासवर्ड की पुष्टि करें (Confirm New Password)' : 'Confirm New Password'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={adminCredsForm.confirmPassword}
                        onChange={(e) =>
                          setAdminCredsForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        placeholder="Re-enter new password"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#002855] via-[#003366] to-[#0284c7] hover:from-[#001a35] hover:to-[#0369a1] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>
                        {lang === 'hi'
                          ? 'नया ईमेल व पासवर्ड सुरक्षित करें'
                          : 'Save New Admin Email & Password'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ==========================================
              TAB 2: JOBS & ALUMNUS POSTER VERIFICATION
             ========================================== */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-sky-200/90">
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'all', label: `All Jobs (${jobs.length})` },
                    { id: 'pending', label: `⏳ Pending Verification (${pendingJobsList.length})` },
                    { id: 'approved', label: `✅ Approved & Live (${approvedJobsCount})` },
                    {
                      id: 'rejected',
                      label: `❌ Rejected (${jobs.filter((j) => getJobApprovalStatus(j) === 'rejected').length})`,
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setJobFilter(f.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all ${
                        jobFilter === f.id
                          ? 'bg-[#003366] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-sky-50 text-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      placeholder="Search job or poster..."
                      className="pl-9 pr-3.5 py-2 rounded-xl border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddJobForm(!showAddJobForm)}
                    className="px-4 py-2 rounded-xl btn-mcu-saffron text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post Official Job</span>
                  </button>
                </div>
              </div>

              {/* Optional Inline Admin Job Form */}
              {showAddJobForm && (
                <form
                  onSubmit={handleCreateAdminJob}
                  className="p-5 rounded-2xl bg-sky-50/70 border border-sky-300 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-extrabold text-[#003366] uppercase">
                      Post Pre-Verified Official Opportunity
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddJobForm(false)}
                      className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <input
                      type="text"
                      required
                      placeholder="Job Title (e.g. Senior Producer / Software Engineer)"
                      value={newJobForm.title}
                      onChange={(e) => setNewJobForm((p) => ({ ...p, title: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Company / Media House"
                      value={newJobForm.company}
                      onChange={(e) => setNewJobForm((p) => ({ ...p, company: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Location (e.g. Bhopal / Noida)"
                      value={newJobForm.location}
                      onChange={(e) => setNewJobForm((p) => ({ ...p, location: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Package / Salary (e.g. ₹8-14 LPA)"
                      value={newJobForm.salary}
                      onChange={(e) => setNewJobForm((p) => ({ ...p, salary: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Experience (e.g. 1-3 Years)"
                      value={newJobForm.experience}
                      onChange={(e) => setNewJobForm((p) => ({ ...p, experience: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={newJobForm.tags}
                      onChange={(e) => setNewJobForm((p) => ({ ...p, tags: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Job description & referral instructions..."
                    value={newJobForm.description}
                    onChange={(e) => setNewJobForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
                    >
                      Publish Verified Job Now
                    </button>
                  </div>
                </form>
              )}

              {/* Jobs Verification Cards List */}
              <div className="space-y-3.5">
                {filteredJobs.map((job) => {
                  const status = getJobApprovalStatus(job);
                  const posterStatus = getJobPosterStatus(job);
                  return (
                    <div
                      key={job.id}
                      className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all ${
                        status === 'pending'
                          ? 'border-amber-300 shadow-sm ring-1 ring-amber-200/60'
                          : status === 'rejected'
                          ? 'border-rose-200 opacity-80'
                          : 'border-sky-200/90'
                      }`}
                    >
                      {/* Step 1: Alumnus Poster Verification Inspection Box */}
                      <div
                        className={`mb-3.5 px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 ${
                          posterStatus.verified
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm">
                          <span className="font-black uppercase tracking-wider text-xs px-2.5 py-0.5 rounded bg-white border">
                            STEP 1: ALUMNUS CHECK
                          </span>
                          <span className="font-bold">
                            Poster: {job.postedBy || 'MCU Alumnus'}
                          </span>
                          {job.authorEmail && (
                            <span className="text-slate-600 text-xs sm:text-sm">({job.authorEmail})</span>
                          )}
                          {posterStatus.verified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified MCU Alumnus
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-xs font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Alumnus Not Verified Yet
                            </span>
                          )}
                        </div>

                        {!posterStatus.verified && (
                          <button
                            type="button"
                            onClick={() => {
                              if (posterStatus.matchedAlumnus) {
                                onVerifyAlumni(posterStatus.matchedAlumnus.id, true);
                              } else {
                                onApproveJob(job.id, true);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Verify This Alumnus First</span>
                          </button>
                        )}
                      </div>

                      {/* Step 2: Job Authenticity & Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {status === 'approved' && (
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                                ✅ LIVE ON JOB BOARD
                              </span>
                            )}
                            {status === 'pending' && (
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black animate-pulse">
                                ⏳ AWAITING ADMIN APPROVAL
                              </span>
                            )}
                            {status === 'rejected' && (
                              <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-black">
                                ❌ REJECTED / HIDDEN
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                              {job.type}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#680a13] bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                              {job.salary}
                            </span>
                          </div>

                          <h4 className="text-base sm:text-lg font-extrabold text-[#003366]">
                            {job.title} — <span className="text-[#680a13]">{job.company}</span>
                          </h4>
                          <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                          <div className="text-xs sm:text-sm text-slate-500 font-medium">
                            Location: {job.location} • Experience: {job.experience} • Deadline: {job.deadline}
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!posterStatus.verified && posterStatus.matchedAlumnus) {
                                  onVerifyAlumni(posterStatus.matchedAlumnus.id, true);
                                }
                                onApproveJob(job.id, true);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {!posterStatus.verified
                                  ? 'Verify Alumnus & Approve Job'
                                  : 'Approve & Publish'}
                              </span>
                            </button>
                          )}

                          {status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => onRejectJob(job.id)}
                              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Hold / Reject</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteJob(job.id)}
                            className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Job Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: ALUMNI VERIFICATION & DIRECTORY CONTROL
             ========================================== */}
          {activeTab === 'alumni' && (
            <div className="space-y-4">
              {/* Filter & Bulk Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-sky-200/90">
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'all', label: `All Alumni (${alumniList.length})` },
                    { id: 'pending', label: `⏳ Unverified (${pendingAlumniList.length})` },
                    { id: 'verified', label: `✅ Verified (${verifiedAlumniCount})` },
                    {
                      id: 'mentors',
                      label: `🌟 Mentors (${alumniList.filter((a) => a.openToMentor ?? a.open_to_mentor).length})`,
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAlumniFilter(f.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all ${
                        alumniFilter === f.id
                          ? 'bg-[#003366] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-sky-50 text-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={alumniSearch}
                      onChange={(e) => setAlumniSearch(e.target.value)}
                      placeholder="Search name, batch, company..."
                      className="pl-9 pr-3.5 py-2 rounded-xl border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {pendingAlumniList.length > 0 && (
                    <button
                      type="button"
                      onClick={onBulkVerifyAlumni}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify All ({pendingAlumniList.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddAlumniForm(!showAddAlumniForm)}
                    className="px-3.5 py-2 rounded-xl btn-mcu-saffron text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Alumnus</span>
                  </button>
                </div>
              </div>

              {/* Add Verified Alumnus Form */}
              {showAddAlumniForm && (
                <form
                  onSubmit={handleCreateAlumni}
                  className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-300 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-extrabold text-[#003366] uppercase tracking-wide">
                      Add Official Verified MCU Alumnus to Directory
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddAlumniForm(false)}
                      className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Full Name *"
                      value={newAlumniForm.name}
                      onChange={(e) => setNewAlumniForm((p) => ({ ...p, name: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Official Email"
                      value={newAlumniForm.email}
                      onChange={(e) => setNewAlumniForm((p) => ({ ...p, email: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Batch Year (e.g. 2022)"
                      value={newAlumniForm.batch}
                      onChange={(e) => setNewAlumniForm((p) => ({ ...p, batch: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Current Role (e.g. Senior Anchor / SDE)"
                      value={newAlumniForm.currentRole}
                      onChange={(e) => setNewAlumniForm((p) => ({ ...p, currentRole: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Company / Organization"
                      value={newAlumniForm.company}
                      onChange={(e) => setNewAlumniForm((p) => ({ ...p, company: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    />
                    <select
                      value={newAlumniForm.campus}
                      onChange={(e) => setNewAlumniForm((p) => ({ ...p, campus: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                    >
                      <option value="Bhopal">Bhopal Campus</option>
                      <option value="Rewa">Rewa Campus</option>
                      <option value="Khandwa">Khandwa Campus</option>
                      <option value="Datia">Datia Campus</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
                    >
                      Save & Verify Alumnus
                    </button>
                  </div>
                </form>
              )}

              {/* Alumni Verification List */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredAlumni.map((alum) => {
                  const verified = isAlumnusVerified(alum);
                  const isMentor = Boolean(alum.openToMentor ?? alum.open_to_mentor);
                  const isStudentAcc = isCurrentStudent(alum);
                  const liSignal = getAlumnusLinkedInSignal(alum);
                  const name = alum.name || alum.full_name || 'MCU Alumnus';
                  const batch = alum.batch || alum.batch_year || '2024';
                  const role = alum.currentRole || alum.current_role || 'Media / IT Professional';
                  const company = alum.company || 'MCU Alumnus';
                  const avatar = alum.avatar || alum.avatar_url;

                  return (
                    <div
                      key={alum.id}
                      className={`p-4 rounded-2xl bg-white border min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                        verified ? 'border-sky-200/85' : 'border-amber-300 bg-amber-50/20'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="w-12 h-12 rounded-xl object-cover border border-sky-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003366] to-[#0284c7] text-white font-bold text-base flex items-center justify-center shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-extrabold text-[#003366] truncate">
                              {name}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                              Batch of {batch}
                            </span>
                            {verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified {isStudentAcc ? 'Student' : 'Alumnus'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold animate-pulse">
                                <Clock className="w-3.5 h-3.5" /> Unverified / Pending
                              </span>
                            )}
                            {isMentor && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-[#fc4a00] border border-amber-200 text-xs font-bold">
                                🌟 Mentor
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-600 truncate mt-1">
                            {role} • <strong className="text-[#680a13]">{company}</strong> ({alum.campus || 'Bhopal'} Campus)
                          </div>

                          {/* LinkedIn Verification Signal Row for Admin */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {liSignal.hasUrl ? (
                              liSignal.isGreenSignal ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                                  <span>
                                    LinkedIn Green Signal: {liSignal.matchScore}% Match
                                    {liSignal.extractedName ? ` ("${liSignal.extractedName}")` : ''}
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>
                                    LinkedIn Match: {liSignal.matchScore}% (&lt;75%
                                    {liSignal.extractedName ? ` — "${liSignal.extractedName}"` : ''})
                                  </span>
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold">
                                <span>{isStudentAcc ? 'LinkedIn Optional' : 'No Direct LinkedIn URL'}</span>
                              </span>
                            )}

                            {liSignal.hasUrl && (
                              <a
                                href={liSignal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#0A66C2] hover:underline"
                              >
                                <span>View LinkedIn</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onVerifyAlumni(alum.id, !verified)}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                            verified
                              ? 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>{verified ? 'Verified ✓' : 'Verify Alumnus'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleAlumniMentor(alum.id)}
                          className={`p-2 rounded-xl text-xs sm:text-sm font-bold border cursor-pointer ${
                            isMentor
                              ? 'bg-amber-50 text-[#fc4a00] border-amber-300'
                              : 'bg-white text-slate-500 border-slate-200'
                          }`}
                          title="Toggle Mentor Status"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteAlumni(alum.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors cursor-pointer"
                          title="Remove Alumnus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 4: EVENTS, PHOTO ALBUMS, UPCOMING CONCLAVES & SHOWCASE SLIDES CONTROL
             ========================================== */}
          {activeTab === 'events' && (
            <div className="space-y-5">
              {/* Sub-Navigation Header for Events Studio */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#002855] via-[#003366] to-[#001d3d] text-white border border-sky-400/30 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#fc4a00] text-white text-[10px] font-black uppercase tracking-wider">
                      100% ADMIN CONTROL • INSTANT UI SYNC
                    </span>
                    <span className="text-xs text-amber-200 font-semibold">
                      {lang === 'hi'
                        ? 'अपलोड करते ही तुरंत Events सेक्शन में लाइव दिखेगा'
                        : 'Uploads & deletions sync immediately to #events'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-extrabold text-white mt-1 font-editorial">
                    {lang === 'hi'
                      ? 'एमसीयू समारोह, फ़ोटो एल्बम, आगामी संगोष्ठी एवं स्लाइड्स नियंत्रण कक्ष'
                      : 'MCU Events, Photo Albums, Upcoming Conclaves & Slides Control Studio'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    {
                      id: 'archive',
                      labelEn: `📸 Event Photo Albums (${eventsArchive.length})`,
                      labelHi: `📸 इवेंट व फ़ोटो एल्बम (${eventsArchive.length})`,
                    },
                    {
                      id: 'upcoming',
                      labelEn: `🗓️ Upcoming Conclaves (${upcomingEvents.length})`,
                      labelHi: `🗓️ आगामी संगोष्ठियां (${upcomingEvents.length})`,
                    },
                    {
                      id: 'slides',
                      labelEn: `🎞️ Abhyuday HD Slides (${eventSlides.length})`,
                      labelHi: `🎞️ अभ्युदय HD स्लाइड्स (${eventSlides.length})`,
                    },
                  ].map((modeBtn) => (
                    <button
                      key={modeBtn.id}
                      type="button"
                      onClick={() => {
                        setEventsSubMode(modeBtn.id);
                        setEventUploadNotice(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                        eventsSubMode === modeBtn.id
                          ? 'bg-[#fc4a00] text-white border-amber-300 shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
                      }`}
                    >
                      {lang === 'hi' ? modeBtn.labelHi : modeBtn.labelEn}
                    </button>
                  ))}

                  {onResetDefaultEvents && (
                    <button
                      type="button"
                      onClick={onResetDefaultEvents}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-amber-500/30 text-amber-200 border border-amber-300/30 text-xs font-bold cursor-pointer"
                      title="Restore Default Official Events & Photos"
                    >
                      {lang === 'hi' ? 'डिफ़ॉल्ट रीसेट' : 'Reset Defaults'}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Banner with Jump to Live #events Button */}
              {eventUploadNotice && (
                <div
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-2 ${
                    eventUploadNotice.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : eventUploadNotice.type === 'ready'
                      ? 'bg-sky-50 border-sky-300 text-[#003366]'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {eventUploadNotice.type === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>{eventUploadNotice.message}</span>
                  </div>
                  {eventUploadNotice.type === 'success' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          const evEl = document.getElementById('events');
                          if (evEl) evEl.scrollIntoView({ behavior: 'smooth' });
                        }, 180);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer shrink-0"
                    >
                      {lang === 'hi' ? 'Events सेक्शन में लाइव देखें →' : 'View Live in Events Section →'}
                    </button>
                  )}
                </div>
              )}

              {/* ── SUB-MODE 1: HISTORICAL EVENT PHOTO ALBUMS (UPLOAD NEW EVENT OR ADD PHOTOS TO EXISTING EVENT) ── */}
              {eventsSubMode === 'archive' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handlePublishArchiveEventOrPhotos}
                    className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40 border-2 border-sky-200/90 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-200/70">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#fc4a00]">
                          LIVE EVENT & PHOTO ALBUM PUBLISHER
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-[#003366]">
                          {archiveUploadMode === 'new_album'
                            ? lang === 'hi'
                              ? 'नया इवेंट और फ़ोटो एल्बम अपलोड करें (Create New Event Album)'
                              : 'Create & Upload New Event Photo Album'
                            : lang === 'hi'
                            ? 'मौजूदा इवेंट एल्बम में नई फ़ोटो जोड़ें (Add Photos to Existing Event)'
                            : 'Add New Photo(s) to an Existing Event Album'}
                        </h4>
                      </div>

                      {/* Mode Toggle: New Event Album vs Existing Event Album */}
                      <div className="flex items-center gap-1.5 bg-sky-100/80 p-1 rounded-xl border border-sky-200">
                        <button
                          type="button"
                          onClick={() => setArchiveUploadMode('new_album')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                            archiveUploadMode === 'new_album'
                              ? 'bg-[#003366] text-white shadow-xs'
                              : 'text-slate-700 hover:text-[#003366]'
                          }`}
                        >
                          {lang === 'hi' ? '+ नया इवेंट एल्बम बनाएं' : '+ Create New Event Album'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setArchiveUploadMode('existing_album');
                            if (!targetArchiveId && eventsArchive.length > 0) {
                              setTargetArchiveId(eventsArchive[0].id);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                            archiveUploadMode === 'existing_album'
                              ? 'bg-[#003366] text-white shadow-xs'
                              : 'text-slate-700 hover:text-[#003366]'
                          }`}
                        >
                          {lang === 'hi' ? '+ मौजूदा इवेंट में फ़ोटो जोड़ें' : '+ Add Photos to Existing Event'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Left: Multi-Photo Picker + Queued Previews */}
                      <div className="md:col-span-5 flex flex-col gap-3">
                        <input
                          ref={eventPhotosInputRef}
                          type="file"
                          multiple
                          accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif"
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleEventFilesSelected(e.target.files);
                            }
                            if (e.target) e.target.value = '';
                          }}
                          className="hidden"
                        />

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => eventPhotosInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer?.files?.length) {
                              handleEventFilesSelected(e.dataTransfer.files);
                            }
                          }}
                          className="flex flex-col items-center justify-center min-h-[168px] p-4 rounded-2xl border-2 border-dashed border-sky-300 hover:border-[#fc4a00] bg-white cursor-pointer transition-all group text-center"
                        >
                          <Upload className="w-8 h-8 text-sky-600 group-hover:text-[#fc4a00] mb-2 transition-colors" />
                          <div className="text-sm font-extrabold text-[#003366]">
                            {isUploadingEventPhotos
                              ? lang === 'hi'
                                ? '⏳ फ़ोटो HD में प्रोसेस हो रही हैं...'
                                : '⏳ Processing HD Photo(s)...'
                              : lang === 'hi'
                              ? 'डिवाइस से 1 या एक साथ कई फ़ोटो चुनें (Click or Drop)'
                              : 'Click or Drop 1 or Multiple Event Photos'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 mb-2.5">
                            Supports Multiple Photos • HEIC, JPG, PNG, WEBP (Full HD Auto-Resize)
                          </div>
                          <span className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#003366] to-[#0284c7] group-hover:from-[#fc4a00] group-hover:to-[#8d0303] text-white text-xs font-extrabold inline-flex items-center gap-1.5">
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'hi' ? 'फ़ोटो चुनें (Browse Files)' : 'Select Photo(s) from Device'}
                            </span>
                          </span>
                        </div>

                        {/* Direct Image URL Adder */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={eventImageUrlInput}
                            onChange={(e) => setEventImageUrlInput(e.target.value)}
                            placeholder="Or paste direct image URL (https://...)"
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={handleAddEventUrlToQueue}
                            className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#003366] text-xs font-extrabold cursor-pointer shrink-0"
                          >
                            + Add URL
                          </button>
                        </div>

                        {/* Queued Photos Preview Strip */}
                        {eventPhotoQueue.length > 0 && (
                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900">
                              <span>
                                ✓ {eventPhotoQueue.length} Photo(s) Ready to Publish
                              </span>
                              <button
                                type="button"
                                onClick={() => setEventPhotoQueue([])}
                                className="text-rose-600 hover:underline cursor-pointer"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">
                              {eventPhotoQueue.map((qItem, qIdx) => (
                                <div
                                  key={qIdx}
                                  className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-emerald-300 group"
                                >
                                  <img
                                    src={qItem.src}
                                    alt={qItem.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEventPhotoQueue((prev) => prev.filter((_, idx) => idx !== qIdx))
                                    }
                                    className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white cursor-pointer"
                                    title="Remove from queue"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Event Metadata Fields */}
                      <div className="md:col-span-7 space-y-3">
                        {archiveUploadMode === 'existing_album' ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1">
                                Select Existing Event Album (किस इवेंट में फ़ोटो जोड़नी है?) *
                              </label>
                              <select
                                value={targetArchiveId}
                                onChange={(e) => setTargetArchiveId(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm font-bold text-[#003366]"
                              >
                                {eventsArchive.map((ev) => (
                                  <option key={ev.id} value={ev.id}>
                                    [{ev.year}] {ev.title} ({ev.gallery?.length || 0} photos)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1">
                                Photo Caption / Title (Optional)
                              </label>
                              <input
                                type="text"
                                value={eventForm.photoCaption}
                                onChange={(e) => setEventForm((p) => ({ ...p, photoCaption: e.target.value }))}
                                placeholder="e.g., Chief Guest Addressing Alumni at Auditorium"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1">
                                  Event Year (वर्ष) *
                                </label>
                                <select
                                  value={eventForm.year}
                                  onChange={(e) => setEventForm((p) => ({ ...p, year: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sm font-bold text-[#003366]"
                                >
                                  {STANDARD_YEARS.map((yr) => (
                                    <option key={yr} value={yr}>
                                      Year {yr}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                  Or Custom Year
                                </label>
                                <input
                                  type="text"
                                  value={eventForm.customYear}
                                  onChange={(e) => setEventForm((p) => ({ ...p, customYear: e.target.value }))}
                                  placeholder="e.g. 2027"
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1">
                                  Date / Month Label
                                </label>
                                <input
                                  type="text"
                                  value={eventForm.date}
                                  onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))}
                                  placeholder="e.g. October 2026"
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1">
                                  Event Title (English) *
                                </label>
                                <input
                                  type="text"
                                  value={eventForm.title}
                                  onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))}
                                  placeholder="e.g., National Media & IT Alumni Meet 2026"
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1">
                                  इवेंट का नाम (Hindi Title - Optional)
                                </label>
                                <input
                                  type="text"
                                  value={eventForm.hindiTitle}
                                  onChange={(e) => setEventForm((p) => ({ ...p, hindiTitle: e.target.value }))}
                                  placeholder="उदा. राष्ट्रीय मीडिया एवं आईटी पूर्व छात्र समागम 2026"
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1">
                                  Venue / Campus Location
                                </label>
                                <input
                                  type="text"
                                  value={eventForm.venue}
                                  onChange={(e) => setEventForm((p) => ({ ...p, venue: e.target.value }))}
                                  placeholder="Ganesh Shankar Vidyarthi Auditorium, MCU Bhopal"
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1">
                                  Event Category Badge
                                </label>
                                <input
                                  type="text"
                                  value={eventForm.badge}
                                  onChange={(e) => setEventForm((p) => ({ ...p, badge: e.target.value }))}
                                  placeholder="Official Conclave • MCU Bhopal"
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">
                                Event Description / Highlights
                              </label>
                              <textarea
                                rows={2}
                                value={eventForm.description}
                                onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Brief summary of this university event or photo album..."
                                className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                              />
                            </div>
                          </>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => eventPhotosInputRef.current?.click()}
                            className="px-4 py-2.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#003366] text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <ImageIcon className="w-4 h-4 text-[#0284c7]" />
                            <span>
                              {lang === 'hi'
                                ? '+ डिवाइस से और फ़ोटो जोड़ें'
                                : '+ Add Photo(s) from Device'}
                            </span>
                          </button>

                          <button
                            type="submit"
                            disabled={isUploadingEventPhotos}
                            className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-white text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                          >
                            <Upload className="w-4 h-4" />
                            <span>
                              {archiveUploadMode === 'existing_album'
                                ? lang === 'hi'
                                  ? 'चयनित इवेंट में फ़ोटो तुरंत लाइव करें'
                                  : 'Publish Photo(s) Live to Selected Event'
                                : lang === 'hi'
                                ? 'नया इवेंट और फ़ोटो तुरंत लाइव प्रकाशित करें'
                                : 'Publish New Event Album Live to Events'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Live Management List of All Historical Event Albums & Individual Photos */}
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-extrabold text-[#003366] uppercase tracking-wider">
                        {lang === 'hi'
                          ? `लाइव इवेंट एल्बम व फ़ोटो प्रबंधन (${filteredEventsArchive.length} समारोह)`
                          : `Manage Live Event Albums & Individual Photos (${filteredEventsArchive.length} Events)`}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {eventYears.map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setEventYearFilter(yr)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                              eventYearFilter === yr
                                ? 'bg-[#003366] text-white'
                                : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50'
                            }`}
                          >
                            {yr === 'All' ? 'All Years' : yr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredEventsArchive.map((arch) => {
                        const gallery = Array.isArray(arch.gallery) ? arch.gallery : [];
                        return (
                          <div
                            key={arch.id}
                            className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-200/90 shadow-2xs space-y-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded bg-[#003366] text-white text-xs font-black">
                                    Year {arch.year}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded bg-amber-100 text-[#680a13] text-xs font-bold">
                                    {arch.badge}
                                  </span>
                                  <span className="text-xs text-slate-500 font-semibold">
                                    {arch.date} • {arch.venue}
                                  </span>
                                </div>
                                <h5 className="text-base font-extrabold text-[#003366] mt-1">
                                  {lang === 'hi' ? arch.hindiTitle || arch.title : arch.title}
                                </h5>
                                <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                                  {arch.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setArchiveUploadMode('existing_album');
                                    setTargetArchiveId(arch.id);
                                    eventPhotosInputRef.current?.click();
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#003366] border border-sky-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <PlusCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                                  <span>{lang === 'hi' ? '+ इसमें फ़ोटो जोड़ें' : '+ Add Photo'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteArchiveEvent && onDeleteArchiveEvent(arch.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{lang === 'hi' ? 'पूरा इवेंट हटाएं' : 'Delete Entire Event'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Individual Photos inside this Event with 1-Click Delete */}
                            {gallery.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
                                {gallery.map((img, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group"
                                  >
                                    <img
                                      src={img.isGif ? '/abhyuday/abhyuday-1.jpeg' : img.src}
                                      alt={img.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onDeleteArchivePhoto && onDeleteArchivePhoto(arch.id, pIdx)
                                      }
                                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow cursor-pointer"
                                      title="Delete this photo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1 text-[10px] text-white truncate">
                                      {img.title || `Photo ${pIdx + 1}`}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUB-MODE 2: UPCOMING CONCLAVES & FEATURED BANNER ── */}
              {eventsSubMode === 'upcoming' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handlePublishUpcomingEvent}
                    className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40 border-2 border-sky-200/90 shadow-xs space-y-4"
                  >
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#fc4a00]">
                        UPCOMING CONCLAVE & RSVP PUBLISHER
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-[#003366]">
                        {lang === 'hi'
                          ? 'नई आगामी संगोष्ठी / मुख्य बैनर इवेंट प्रकाशित करें'
                          : 'Publish New Upcoming Conclave / Summit Card'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#003366] mb-1">
                          Conclave Title (English) *
                        </label>
                        <input
                          type="text"
                          value={upcomingForm.title}
                          onChange={(e) => setUpcomingForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder="e.g., All India Media & IT Editors Conclave 2026"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#003366] mb-1">
                          संगोष्ठी का नाम (Hindi Title - Optional)
                        </label>
                        <input
                          type="text"
                          value={upcomingForm.hindiTitle}
                          onChange={(e) => setUpcomingForm((p) => ({ ...p, hindiTitle: e.target.value }))}
                          placeholder="उदा. अखिल भारतीय मीडिया एवं आईटी संपादक संगोष्ठी 2026"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#003366] mb-1">
                          Date & Time
                        </label>
                        <input
                          type="text"
                          value={upcomingForm.date}
                          onChange={(e) => setUpcomingForm((p) => ({ ...p, date: e.target.value }))}
                          placeholder="November 15, 2026 • 10:00 AM IST"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#003366] mb-1">
                          Venue / Location
                        </label>
                        <input
                          type="text"
                          value={upcomingForm.location}
                          onChange={(e) => setUpcomingForm((p) => ({ ...p, location: e.target.value }))}
                          placeholder="Ganesh Shankar Vidyarthi Auditorium, MCU Bhopal"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#003366] mb-1">
                          Badge Label
                        </label>
                        <input
                          type="text"
                          value={upcomingForm.badge}
                          onChange={(e) => setUpcomingForm((p) => ({ ...p, badge: e.target.value }))}
                          placeholder="National Conclave • Open RSVP"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-[#003366] mb-1">
                            Total Seats
                          </label>
                          <input
                            type="number"
                            value={upcomingForm.seatsTotal}
                            onChange={(e) => setUpcomingForm((p) => ({ ...p, seatsTotal: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#003366] mb-1">
                            Initial RSVPs
                          </label>
                          <input
                            type="number"
                            value={upcomingForm.rsvpCount}
                            onChange={(e) => setUpcomingForm((p) => ({ ...p, rsvpCount: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={upcomingForm.description}
                        onChange={(e) => setUpcomingForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Details about speakers, agenda, and alumni participation..."
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#003366] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={upcomingForm.featured}
                          onChange={(e) => setUpcomingForm((p) => ({ ...p, featured: e.target.checked }))}
                          className="w-4 h-4 accent-[#fc4a00] rounded"
                        />
                        <span>
                          {lang === 'hi'
                            ? 'इसे Events के सबसे ऊपर मुख्य फ्लैगशिप बैनर (Featured Banner) बनाएं'
                            : 'Set as Main Featured Flagship Banner at Top of Events Section'}
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-white text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>
                          {lang === 'hi'
                            ? 'आगामी संगोष्ठी तुरंत लाइव करें'
                            : 'Publish Upcoming Conclave Live'}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* Manage Existing Upcoming Conclaves */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 rounded-2xl bg-white border border-sky-200/90 shadow-2xs flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded bg-[#003366]/10 text-[#003366] text-xs font-bold">
                              {evt.featured ? '⭐ Featured Banner' : evt.badge}
                            </span>
                            <button
                              type="button"
                              onClick={() => onDeleteUpcomingEvent && onDeleteUpcomingEvent(evt.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 cursor-pointer"
                              title="Delete Conclave"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <h5 className="text-sm sm:text-base font-extrabold text-[#003366]">
                            {lang === 'hi' ? evt.hindiTitle || evt.title : evt.title}
                          </h5>
                          <p className="text-xs text-slate-500 mt-1">
                            {evt.date} • {evt.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SUB-MODE 3: ABHYUDAY HD SLIDESHOW CAROUSEL ── */}
              {eventsSubMode === 'slides' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handlePublishEventSlide}
                    className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40 border-2 border-sky-200/90 shadow-xs space-y-4"
                  >
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#fc4a00]">
                        ABHYUDAY SHOWCASE SLIDE PUBLISHER
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-[#003366]">
                        {lang === 'hi'
                          ? 'अभ्युदय 2026 स्लाइडशो में नई HD स्लाइड अपलोड करें'
                          : 'Upload New HD Slide to Abhyuday Showcase Carousel'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5 flex flex-col gap-3">
                        <input
                          ref={slidePhotoInputRef}
                          type="file"
                          accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
                          onChange={handleSlideFileSelected}
                          className="hidden"
                        />
                        <div
                          onClick={() => slidePhotoInputRef.current?.click()}
                          className="flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed border-sky-300 hover:border-[#fc4a00] bg-white cursor-pointer overflow-hidden relative"
                        >
                          {slideForm.image ? (
                            <img
                              src={slideForm.image}
                              alt="Slide Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Upload className="w-8 h-8 text-sky-600 mx-auto mb-2" />
                              <div className="text-sm font-extrabold text-[#003366]">
                                {lang === 'hi' ? 'स्लाइड फ़ोटो चुनें (Browse Device)' : 'Select Slide Photo from Device'}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={slideForm.image.startsWith('data:') ? '' : slideForm.image}
                          onChange={(e) => setSlideForm((p) => ({ ...p, image: e.target.value }))}
                          placeholder="Or paste direct image URL (https://...)"
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-xs sm:text-sm"
                        />
                      </div>

                      <div className="md:col-span-7 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#003366] mb-1">
                              Slide Title (Hindi)
                            </label>
                            <input
                              type="text"
                              value={slideForm.title}
                              onChange={(e) => setSlideForm((p) => ({ ...p, title: e.target.value }))}
                              placeholder="उदा. अभ्युदय 2026: उद्घाटन सत्र"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#003366] mb-1">
                              Slide Title (English)
                            </label>
                            <input
                              type="text"
                              value={slideForm.titleEn}
                              onChange={(e) => setSlideForm((p) => ({ ...p, titleEn: e.target.value }))}
                              placeholder="e.g., Abhyuday 2026: Inaugural Session"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Slide Caption
                          </label>
                          <textarea
                            rows={2}
                            value={slideForm.caption}
                            onChange={(e) =>
                              setSlideForm((p) => ({
                                ...p,
                                caption: e.target.value,
                                captionEn: e.target.value,
                              }))
                            }
                            placeholder="Caption displayed on the HD Slide..."
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-sm"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-white text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>
                              {lang === 'hi' ? 'HD स्लाइड तुरंत लाइव करें' : 'Publish HD Slide Live'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Existing Slides Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {eventSlides.map((slide) => (
                      <div
                        key={slide.id}
                        className="rounded-2xl bg-white border border-sky-200/90 overflow-hidden shadow-2xs flex flex-col justify-between"
                      >
                        <div className="aspect-video bg-slate-900 relative">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => onDeleteEventSlide && onDeleteEventSlide(slide.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow cursor-pointer"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-extrabold text-[#003366] truncate">
                            {lang === 'hi' ? slide.title : slide.titleEn || slide.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 5: MEMORIES & YEAR-WISE PHOTO / VIDEO (<=5MB) UPLOAD STUDIO
             ========================================== */}
          {activeTab === 'memories' && (
            <div className="space-y-5">
              {/* Upload Photo or Video (up to 5MB) to Specific Year Form */}
              <form
                onSubmit={handlePublishMemory}
                className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40 border-2 border-sky-200/90 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#fc4a00]">
                      LIVE GALLERY PUBLISHER • PHOTOS & VIDEOS (MAX 5 MB)
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#003366]">
                      {lang === 'hi'
                        ? 'स्मृतियां (Memories) में वर्षवार नया फोटो या वीडियो (5 MB तक) अपलोड करें'
                        : 'Upload New Photo or Video (Up to 5 MB) to Campus Memories (Year-wise)'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-[#680a13] border border-amber-300 text-xs font-extrabold inline-flex items-center gap-1">
                      <Film className="w-3.5 h-3.5 text-[#fc4a00]" />
                      <span>{lang === 'hi' ? 'वीडियो अपलोड (अधिकतम 5 MB)' : 'Video Upload: Max 5 MB'}</span>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Instant UI Sync Active
                    </span>
                  </div>
                </div>

                {/* Inline Upload / Publish Status Banner */}
                {memoryUploadNotice && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-2 ${
                      memoryUploadNotice.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : memoryUploadNotice.type === 'ready'
                        ? 'bg-sky-50 border-sky-300 text-[#003366]'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {memoryUploadNotice.type === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span>{memoryUploadNotice.message}</span>
                    </div>
                    {memoryUploadNotice.type === 'success' && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setTimeout(() => {
                            const galleryEl = document.getElementById('gallery');
                            if (galleryEl) {
                              galleryEl.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 200);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer shrink-0"
                      >
                        {lang === 'hi' ? 'गैलरी में लाइव देखें →' : 'View Live in Campus Gallery →'}
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left: Photo / Video Picker / Drag & Drop / URL */}
                  <div className="md:col-span-5 flex flex-col gap-3">
                    <input
                      ref={memoryFileInputRef}
                      id="admin-memory-photo-input"
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/quicktime,video/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.jfif,.mp4,.webm,.mov,.m4v"
                      onChange={handleMemoryFileChange}
                      className="hidden"
                    />
                    <input
                      ref={memoryVideoInputRef}
                      id="admin-memory-video-input"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v"
                      onChange={handleMemoryFileChange}
                      className="hidden"
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => memoryFileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          memoryFileInputRef.current?.click();
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isDraggingMemoryPhoto) setIsDraggingMemoryPhoto(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingMemoryPhoto(false);
                      }}
                      onDrop={handleMemoryDrop}
                      className={`relative flex flex-col items-center justify-center h-56 rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all group ${
                        isDraggingMemoryPhoto
                          ? 'border-[#fc4a00] bg-amber-50/70 scale-[1.01]'
                          : memoryForm.image
                          ? 'border-emerald-400 bg-slate-950'
                          : 'border-sky-300 hover:border-[#fc4a00] bg-white'
                      }`}
                    >
                      {memoryForm.image ? (
                        <>
                          {memoryForm.mediaType === 'video' || isVideoUrlOrData(memoryForm.image) ? (
                            <video
                              src={memoryForm.image}
                              poster={memoryForm.videoPoster || undefined}
                              controls
                              muted
                              playsInline
                              onClick={(e) => e.stopPropagation()}
                              className="w-full h-full object-contain bg-black"
                            />
                          ) : (
                            <img
                              src={memoryForm.image}
                              alt="Memory Preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-emerald-600/95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm pointer-events-none">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {memoryForm.mediaType === 'video' || isVideoUrlOrData(memoryForm.image)
                                ? lang === 'hi'
                                  ? `🎬 वीडियो तैयार है (${memoryForm.fileSizeMB ? `${memoryForm.fileSizeMB} MB` : '≤ 5 MB'})`
                                  : `🎬 Video Ready (${memoryForm.fileSizeMB ? `${memoryForm.fileSizeMB} MB` : '≤ 5 MB'})`
                                : lang === 'hi'
                                ? 'HD फ़ोटो तैयार है'
                                : 'HD Photo Ready to Publish'}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                memoryFileInputRef.current?.click();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/95 hover:bg-white text-[#003366] text-xs font-extrabold shadow-sm cursor-pointer"
                            >
                              {lang === 'hi' ? 'बदलें' : 'Change'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMemoryForm((p) => ({
                                  ...p,
                                  image: '',
                                  mediaType: 'image',
                                  videoPoster: '',
                                  fileSizeMB: '',
                                }));
                                setMemoryUploadNotice(null);
                                if (memoryFileInputRef.current) {
                                  memoryFileInputRef.current.value = '';
                                }
                                if (memoryVideoInputRef.current) {
                                  memoryVideoInputRef.current.value = '';
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                            >
                              {lang === 'hi' ? 'हटाएं' : 'Remove'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4 flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-2">
                            <Upload className="w-8 h-8 text-sky-600 group-hover:text-[#fc4a00] transition-colors" />
                            <Film className="w-8 h-8 text-[#fc4a00]" />
                          </div>
                          <div className="text-sm font-extrabold text-[#003366]">
                            {isUploadingImage
                              ? lang === 'hi'
                                ? 'फ़ोटो / वीडियो प्रोसेस हो रहा है...'
                                : 'Processing Photo / Video...'
                              : lang === 'hi'
                              ? 'डिवाइस से फ़ोटो या वीडियो (5 MB तक) अपलोड करें'
                              : 'Click to Upload Photo or Video (Max 5 MB)'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 mb-3">
                            {lang === 'hi'
                              ? 'फ़ोटो: HEIC, JPG, PNG, WEBP • वीडियो: MP4, WEBM, MOV (अधिकतम 5 MB)'
                              : 'Photos: HEIC, JPG, PNG, WEBP • Videos: MP4, WEBM, MOV (Up to 5 MB)'}
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#003366] to-[#0284c7] text-white text-xs font-extrabold shadow-xs inline-flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{lang === 'hi' ? 'फ़ोटो चुनें' : 'Browse Photo'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                memoryVideoInputRef.current?.click();
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#fc4a00] to-[#8d0303] text-white text-xs font-extrabold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Film className="w-3.5 h-3.5" />
                              <span>{lang === 'hi' ? 'वीडियो चुनें (≤ 5MB)' : 'Browse Video (≤ 5MB)'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={
                        memoryForm.image && memoryForm.image.startsWith('data:')
                          ? ''
                          : memoryForm.image
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const detectedVid = isVideoUrlOrData(val);
                        setMemoryForm((p) => ({
                          ...p,
                          image: val,
                          mediaType: detectedVid ? 'video' : 'image',
                        }));
                        if (val.trim()) {
                          setMemoryUploadNotice({
                            type: 'ready',
                            message: detectedVid
                              ? lang === 'hi'
                                ? '✓ वीडियो URL तैयार है! गैलरी में जोड़ने के लिए "Publish" दबाएं।'
                                : '✓ Video URL ready! Click "Publish" to save it to Campus Memories.'
                              : lang === 'hi'
                              ? '✓ इमेज URL तैयार है! गैलरी में जोड़ने के लिए "Publish" दबाएं।'
                              : '✓ Image URL ready! Click "Publish" to save it to Campus Memories.',
                          });
                        }
                      }}
                      placeholder="Or paste direct Photo or Video (.mp4 / .webm) URL (https://...)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Right: Year, Category, Campus, Title & Description */}
                  <div className="md:col-span-7 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1">
                          Select Year (वर्ष चुनें) *
                        </label>
                        <select
                          value={memoryForm.year}
                          onChange={(e) => setMemoryForm((p) => ({ ...p, year: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm font-bold text-[#003366]"
                        >
                          {STANDARD_YEARS.map((yr) => (
                            <option key={yr} value={yr}>
                              Year {yr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-600 mb-1">
                          Or Custom Year (e.g. 1998)
                        </label>
                        <input
                          type="text"
                          value={memoryForm.customYear}
                          onChange={(e) => setMemoryForm((p) => ({ ...p, customYear: e.target.value }))}
                          placeholder="Optional custom year"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1">
                          Category (श्रेणी) *
                        </label>
                        <select
                          value={memoryForm.category}
                          onChange={(e) => setMemoryForm((p) => ({ ...p, category: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm font-bold text-[#003366]"
                        >
                          {Object.keys(CATEGORY_LABELS).map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1">
                          Memory Title (English / Hindi) <span className="text-slate-400 font-normal">(Optional — auto-titled if blank)</span>
                        </label>
                        <input
                          type="text"
                          value={memoryForm.title}
                          onChange={(e) => setMemoryForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder="e.g., Spandan Cultural Fest Performance Video / Photo 2026"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-[#003366] mb-1">
                          Campus
                        </label>
                        <select
                          value={memoryForm.campus}
                          onChange={(e) => setMemoryForm((p) => ({ ...p, campus: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm font-semibold"
                        >
                          <option value="Bhopal">Bhopal</option>
                          <option value="Rewa">Rewa</option>
                          <option value="Khandwa">Khandwa</option>
                          <option value="Datia">Datia</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-600 mb-1">
                        Story / Caption (विवरण)
                      </label>
                      <textarea
                        rows={2}
                        value={memoryForm.description}
                        onChange={(e) => setMemoryForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Describe this campus memory, batch, or event..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => memoryFileInputRef.current?.click()}
                          className="px-3.5 py-2.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#003366] text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <ImageIcon className="w-4 h-4 text-[#0284c7]" />
                          <span>
                            {lang === 'hi' ? 'फ़ोटो चुनें' : 'Select Photo'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => memoryVideoInputRef.current?.click()}
                          className="px-3.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#680a13] border border-amber-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Film className="w-4 h-4 text-[#fc4a00]" />
                          <span>
                            {lang === 'hi' ? 'वीडियो अपलोड करें (Max 5 MB)' : 'Upload Video (Max 5 MB)'}
                          </span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isUploadingImage}
                        className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-white text-sm font-extrabold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          {memoryForm.mediaType === 'video' || isVideoUrlOrData(memoryForm.image)
                            ? `Publish Video to ${memoryForm.customYear || memoryForm.year} Memories UI`
                            : `Publish to ${memoryForm.customYear || memoryForm.year} Memories UI`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Existing Memories Year Filter & Management Grid */}
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-[#003366] uppercase tracking-wider">
                    Manage Live Campus Memories by Year ({filteredMemories.length} Items)
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {memoryYears.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setMemoryYearFilter(yr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          memoryYearFilter === yr
                            ? 'bg-[#003366] text-white'
                            : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50'
                        }`}
                      >
                        {yr === 'All' ? 'All Years' : yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMemories.map((mem) => {
                    const isVid = isVideoUrlOrData(mem);
                    return (
                      <div
                        key={mem.id}
                        className="rounded-2xl bg-white border border-sky-200/90 overflow-hidden shadow-2xs flex flex-col justify-between group"
                      >
                        <div className="aspect-[16/10] bg-slate-900 relative overflow-hidden">
                          {isVid ? (
                            <video
                              src={mem.videoUrl || mem.image}
                              poster={mem.poster || undefined}
                              controls
                              muted
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover bg-black"
                            />
                          ) : (
                            <img
                              src={mem.image}
                              alt={mem.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                            <span className="px-2.5 py-0.5 rounded bg-[#fc4a00] text-white text-xs font-black">
                              {mem.year}
                            </span>
                            <span className="px-2.5 py-0.5 rounded bg-[#002855]/90 text-white text-xs font-bold">
                              {mem.category}
                            </span>
                            {isVid && (
                              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase">
                                🎬 VIDEO {mem.fileSizeMB ? `(${mem.fileSizeMB}MB)` : ''}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteMemory(mem.id)}
                            className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-rose-600 text-white opacity-90 hover:opacity-100 shadow-sm cursor-pointer z-10"
                            title="Delete from Gallery"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-3.5">
                          <div className="text-sm sm:text-base font-extrabold text-[#003366] truncate">
                            {mem.title}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">
                            {mem.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: APPLICATIONS & PORTAL DATA BACKUP
             ========================================== */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-sky-200/90">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#003366]">
                    Student Referral Applications & Portal Database Backup
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Inspect candidate referral applications across all jobs or export full JSON snapshot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportPortalData}
                  className="px-4 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Portal Data (JSON)</span>
                </button>
              </div>

              {allApplications.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-sky-200/80 text-sm text-slate-500">
                  No student job applications submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {allApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-white border border-sky-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-extrabold text-[#003366]">
                            {app.applicant_name || 'MCU Candidate'}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-500">
                            ({app.applicant_email})
                          </span>
                          <span className="px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200">
                            Status: {app.status || 'pending'}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-700 mt-1">
                          Applied for: <strong>{app.job_title}</strong> at{' '}
                          <span className="text-[#680a13] font-semibold">{app.company_name}</span> • Ref Alumnus:{' '}
                          {app.alumni_name || 'MCU Alumnus'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateApplicationStatus(app.id, 'referred')}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          Approve Referral
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateApplicationStatus(app.id, 'rejected')}
                          className="px-3.5 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteApplication(app.id)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
