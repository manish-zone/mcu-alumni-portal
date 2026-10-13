import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import {
  alumniProfiles,
  jobOpportunities,
  campusMemories,
  upcomingEvents as defaultUpcomingEvents,
  abhyudaySlides as defaultAbhyudaySlides,
  mcuEventsArchive as defaultEventsArchive,
} from './data/mockData';
import { alumniAPI, authAPI, jobsAPI, mentorshipAPI } from './services/api';

// Core Above-the-Fold & Section Components
import { Toast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AlumniDirectory } from './components/AlumniDirectory';
import { MentorshipSection } from './components/MentorshipSection';
import { JobBoard } from './components/JobBoard';
import { EventsSection } from './components/EventsSection';
import { CampusGallery } from './components/CampusGallery';
import { GivingSection } from './components/GivingSection';
import { Footer } from './components/Footer';
import { getProfileSkills, normalizeComputerProfile, isCurrentStudent, isVerifiedAlumnus } from './utils/skills';
import { deduplicateApplications } from './utils/applications';
import {
  saveCustomMemoriesToDB,
  loadCustomMemoriesFromDB,
  saveEventsStateToDB,
  loadEventsStateFromDB,
} from './utils/imageProcessor';
import { ScrollProgressHUD, Ambient3DBackground } from './components/ScrollReveal';
import { CommandPalette } from './components/CommandPalette';

// Interactive Form Modals
import { ProfileDetailModal } from './components/ProfileDetailModal';
import { EditProfileModal } from './components/EditProfileModal';
import { MentorshipModal } from './components/MentorshipModal';
import { JobApplicationModal } from './components/JobApplicationModal';
import { PostJobModal } from './components/PostJobModal';
import { EventRsvpModal } from './components/EventRsvpModal';
import { GivingModal } from './components/GivingModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';

const CUSTOM_JOBS_STORAGE_KEY = 'mcu_custom_jobs';
const MY_JOB_IDS_KEY = 'mcu_my_job_ids';
const JOB_STATUS_OVERRIDES_KEY = 'mcu_job_status_overrides';
const ALUMNI_VERIFICATIONS_KEY = 'mcu_alumni_verifications';
const CUSTOM_ALUMNI_KEY = 'mcu_custom_alumni';
const DELETED_ALUMNI_KEY = 'mcu_deleted_alumni_ids';
const CUSTOM_MEMORIES_KEY = 'mcu_custom_memories';
const DELETED_MEMORIES_KEY = 'mcu_deleted_memory_ids';
const ADMIN_BROADCAST_KEY = 'mcu_admin_broadcast';
const EVENTS_ARCHIVE_STORAGE_KEY = 'mcu_events_archive_state';
const UPCOMING_EVENTS_STORAGE_KEY = 'mcu_upcoming_events_state';
const EVENT_SLIDES_STORAGE_KEY = 'mcu_event_slides_state';


function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getStoredCustomJobs() {
  return getStoredJson(CUSTOM_JOBS_STORAGE_KEY, []);
}

function applyJobStatusOverrides(jobList) {
  const overrides = getStoredJson(JOB_STATUS_OVERRIDES_KEY, {});
  return jobList.map((j) => {
    const ov = overrides[j.id];
    if (ov) {
      return { ...j, ...ov };
    }
    return j;
  });
}

function applyAlumniOverrides(rawList) {
  const verifications = getStoredJson(ALUMNI_VERIFICATIONS_KEY, {});
  const deletedIds = new Set(getStoredJson(DELETED_ALUMNI_KEY, []).map(String));
  return rawList
    .filter((a) => !deletedIds.has(String(a.id)))
    .map((a) => {
      const emailKey = a.email ? String(a.email).trim().toLowerCase() : null;
      const ov =
        verifications[a.id] ||
        (a.user_id && verifications[a.user_id]) ||
        (emailKey && verifications[emailKey]);
      const merged = ov ? { ...a, ...ov } : a;
      return normalizeComputerProfile(merged, alumniProfiles);
    });
}

function getUserJobKey(user) {
  if (!user) return 'mcu_my_job_ids_guest';
  return `mcu_my_job_ids_${user.id || user.email}`;
}

function saveStoredCustomJob(newJob, user) {
  try {
    const existing = getStoredCustomJobs();
    const updated = [newJob, ...existing.filter((j) => j.id !== newJob.id)];
    localStorage.setItem(CUSTOM_JOBS_STORAGE_KEY, JSON.stringify(updated));

    if (user) {
      const userJobKey = getUserJobKey(user);
      const myIds = JSON.parse(localStorage.getItem(userJobKey) || '[]');
      if (!myIds.includes(newJob.id)) {
        myIds.push(newJob.id);
        localStorage.setItem(userJobKey, JSON.stringify(myIds));
      }
    }
  } catch (e) {
    console.warn('Could not cache custom job:', e);
  }
}

function removeStoredCustomJob(jobId, user) {
  try {
    const existing = getStoredCustomJobs();
    const updated = existing.filter((j) => j.id !== jobId && j.dbId !== jobId && j.id !== `db-job-${jobId}`);
    localStorage.setItem(CUSTOM_JOBS_STORAGE_KEY, JSON.stringify(updated));

    if (user) {
      const userJobKey = getUserJobKey(user);
      const myIds = JSON.parse(localStorage.getItem(userJobKey) || '[]');
      const updatedIds = myIds.filter((id) => id !== jobId && id !== `db-job-${jobId}`);
      localStorage.setItem(userJobKey, JSON.stringify(updatedIds));
    }
  } catch (e) {
    console.warn('Could not remove custom job from storage:', e);
  }
}

function MainApp() {
  // Global & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [alumniList, setAlumniList] = useState(() => {
    const customAlumni = getStoredJson(CUSTOM_ALUMNI_KEY, []);
    const customIds = new Set(customAlumni.map((a) => String(a.id)));
    return applyAlumniOverrides([
      ...customAlumni,
      ...alumniProfiles.filter((p) => !customIds.has(String(p.id))),
    ]);
  });
  const [jobs, setJobs] = useState(() => {
    const cachedCustom = getStoredCustomJobs();
    const cachedIds = new Set(cachedCustom.map((c) => c.id));
    return applyJobStatusOverrides([
      ...cachedCustom,
      ...jobOpportunities.filter((j) => !cachedIds.has(j.id)),
    ]);
  });
  const [memoriesList, setMemoriesList] = useState(() => {
    const customMem = getStoredJson(CUSTOM_MEMORIES_KEY, []);
    const deletedMemIds = new Set(getStoredJson(DELETED_MEMORIES_KEY, []).map(String));
    const customIds = new Set(customMem.map((m) => String(m.id)));
    return [
      ...customMem,
      ...campusMemories.filter((m) => !customIds.has(String(m.id))),
    ].filter((m) => !deletedMemIds.has(String(m.id)));
  });

  // Load high-resolution custom memories from IndexedDB (supports unlimited HD / HEIC uploads)
  useEffect(() => {
    loadCustomMemoriesFromDB().then((dbMemories) => {
      if (Array.isArray(dbMemories) && dbMemories.length > 0) {
        const localMem = getStoredJson(CUSTOM_MEMORIES_KEY, []);
        const deletedMemIds = new Set(getStoredJson(DELETED_MEMORIES_KEY, []).map(String));
        const seen = new Set();
        const combinedCustom = [];
        for (const item of [...dbMemories, ...localMem]) {
          if (item && item.id && !seen.has(String(item.id))) {
            seen.add(String(item.id));
            combinedCustom.push(item);
          }
        }
        setMemoriesList(
          [
            ...combinedCustom,
            ...campusMemories.filter((m) => !seen.has(String(m.id))),
          ].filter((m) => !deletedMemIds.has(String(m.id)))
        );
      }
    });
  }, []);

  // ── LIVE EVENTS STATE (ARCHIVE ALBUMS, UPCOMING CONCLAVES & SHOWCASE SLIDES) ──
  const [eventsArchiveList, setEventsArchiveList] = useState(() => {
    const stored = getStoredJson(EVENTS_ARCHIVE_STORAGE_KEY, null);
    return Array.isArray(stored) ? stored : defaultEventsArchive;
  });
  const [upcomingEventsList, setUpcomingEventsList] = useState(() => {
    const stored = getStoredJson(UPCOMING_EVENTS_STORAGE_KEY, null);
    return Array.isArray(stored) ? stored : defaultUpcomingEvents;
  });
  const [eventSlidesList, setEventSlidesList] = useState(() => {
    const stored = getStoredJson(EVENT_SLIDES_STORAGE_KEY, null);
    return Array.isArray(stored) ? stored : defaultAbhyudaySlides;
  });
  const [adminEventsTargetAlbumId, setAdminEventsTargetAlbumId] = useState('');

  // Load high-resolution Events state from IndexedDB on mount
  useEffect(() => {
    loadEventsStateFromDB(EVENTS_ARCHIVE_STORAGE_KEY).then((dbArchive) => {
      if (Array.isArray(dbArchive)) {
        setEventsArchiveList(dbArchive);
      }
    });
    loadEventsStateFromDB(UPCOMING_EVENTS_STORAGE_KEY).then((dbUpcoming) => {
      if (Array.isArray(dbUpcoming)) {
        setUpcomingEventsList(dbUpcoming);
      }
    });
    loadEventsStateFromDB(EVENT_SLIDES_STORAGE_KEY).then((dbSlides) => {
      if (Array.isArray(dbSlides)) {
        setEventSlidesList(dbSlides);
      }
    });
  }, []);

  const [broadcastNotice, setBroadcastNotice] = useState(() =>
    getStoredJson(ADMIN_BROADCAST_KEY, {
      enabled: false,
      textEn: 'Official MCU Alumni Verification Drive & Abhyuday 2026 Grand Meet Registrations are Live!',
      textHi: 'एमसीयू आधिकारिक पूर्व छात्र सत्यापन अभियान एवं अभ्युदय 2026 महासम्मेलन पंजीकरण प्रारंभ!',
      badge: 'OFFICIAL NOTICE',
      achievementEnabled: false,
      achievementTextEn:
        'Proud Achievement: MCU Computer Science Alumni selected at Google, Microsoft & top Global Tech/Media organizations!',
      achievementTextHi:
        'गौरवपूर्ण उपलब्धि: एमसीयू कंप्यूटर विज्ञान के पूर्व छात्रों का गूगल, माइक्रोसॉफ्ट एवं शीर्ष वैश्विक संस्थानों में चयन!',
      achievementBadge: 'ALUMNI ACHIEVEMENT',
    })
  );
  const [postingJobAlumni, setPostingJobAlumni] = useState(null);

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState(() => {
    const u = authAPI.getCurrentUser();
    return u ? normalizeComputerProfile(u, alumniProfiles) : null;
  });
  const isAdminUser = Boolean(currentUser?.is_admin || currentUser?.role === 'admin');

  // Load live alumni from Go REST API & MySQL and merge with local/mock records
  useEffect(() => {
    alumniAPI.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const customAlumni = getStoredJson(CUSTOM_ALUMNI_KEY, []);
          const regEmails = new Set(
            getStoredJson('mcu_registered_emails', []).map((e) => String(e).trim().toLowerCase())
          );
          const seenIds = new Set(customAlumni.map((a) => String(a.id)));
          const dbFiltered = data.filter((d) => {
            if (seenIds.has(String(d.id))) return false;
            const dEmail = (d.email || '').trim().toLowerCase();
            const isAutoPlaceholder =
              d.degree === 'Master of Journalism (MJ)' &&
              (d.current_role === 'Media Professional' || d.currentRole === 'Media Professional') &&
              d.company === 'MCU Alumnus' &&
              !d.enrollment_no &&
              !d.enrollmentNo &&
              !d.phone &&
              !regEmails.has(dEmail);
            if (isAutoPlaceholder) return false;
            seenIds.add(String(d.id));
            return true;
          });
          const mockFiltered = alumniProfiles.filter((m) => !seenIds.has(String(m.id)));
          setAlumniList(applyAlumniOverrides([...customAlumni, ...dbFiltered, ...mockFiltered]));
        }
      })
      .catch((err) => console.log('[Alumni] Using local alumni directory:', err.message));
  }, []);

  // Load live jobs from Go REST API & Microservices
  useEffect(() => {
    jobsAPI.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((d) => ({
            id: d.id ? `db-job-${d.id}` : `job-${Date.now()}`,
            dbId: d.id,
            posted_by_user_id: d.posted_by_user_id,
            posted_by_email: d.posted_by_email,
            authorEmail: d.posted_by_email,
            alumniEmail: d.posted_by_email,
            title: d.title,
            company: d.company_name || d.company || 'Media / IT Enterprise',
            postedBy: d.referral_alumnus_name || d.postedBy || 'Alumnus',
            location: d.location || 'Bhopal / Remote',
            type: d.job_type || d.type || 'Full-time',
            experience: d.experience_required || d.experience || '2-4 Years',
            salary: d.salary_range || d.salary || 'Competitive',
            deadline: d.deadline_date || d.deadline || 'Open',
            description: d.description || '',
            tags: ['Computer Science', 'Software', ...(d.job_type ? [d.job_type] : [])]
          }));

          const cachedCustom = getStoredCustomJobs();
          const customIds = new Set(cachedCustom.map((c) => c.id));
          const dbIds = new Set(formatted.map((f) => f.id));

          const merged = applyJobStatusOverrides([
            ...cachedCustom,
            ...formatted.filter((f) => !customIds.has(f.id)),
            ...jobOpportunities.filter((j) => !customIds.has(j.id) && !dbIds.has(j.id))
          ]);
          setJobs(merged);
        }
      })
      .catch((err) => console.log('[Jobs] Using local fallback jobs:', err.message));
  }, []);

  // Sync / refresh authenticated user profile on app load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('auth_token');
    const authError = params.get('auth_error');

    if (authError) {
      showToast(`Google Sign-in: ${authError}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token) {
      localStorage.setItem('mcu_auth_token', token);
      authAPI.getMe()
        .then((userData) => {
          if (userData) {
            setCurrentUser(userData);
            localStorage.setItem('mcu_user', JSON.stringify(userData));
            showToast(`Welcome, ${userData.full_name || userData.name || 'Alumnus'}!`);
          }
        })
        .catch(() => {});
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (localStorage.getItem('mcu_auth_token') === 'mcu-stealth-admin-token-1990') {
      // Preserve stealth Admin session
      const savedUser = authAPI.getCurrentUser();
      if (savedUser) setCurrentUser(savedUser);
    } else if (authAPI.isAuthenticated()) {
      authAPI.getMe()
        .then((userData) => {
          if (userData) {
            setCurrentUser(userData);
            localStorage.setItem('mcu_user', JSON.stringify(userData));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleAlumniRegistered = (newProfile) => {
    if (newProfile) {
      const normalized = normalizeComputerProfile(newProfile, alumniProfiles);
      try {
        const existingCustom = getStoredJson(CUSTOM_ALUMNI_KEY, []);
        const updatedCustom = [normalized, ...existingCustom.filter((p) => p.id !== normalized.id)];
        localStorage.setItem(CUSTOM_ALUMNI_KEY, JSON.stringify(updatedCustom));
      } catch {}
      setAlumniList((prev) => [normalized, ...prev.filter((p) => p.id !== normalized.id)]);
    }
  };

  // Modals State
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileInitialTab, setEditProfileInitialTab] = useState('photo');
  const [mentorshipMentor, setMentorshipMentor] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState(null);
  const [givingInitiative, setGivingInitiative] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'register' });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [adminModal, setAdminModal] = useState({ isOpen: false, tab: 'overview' });

  // Global Ctrl+K / Cmd+K Shortcut for Instant Spotlight Search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleQuickSearch = () => {
    setIsCommandPaletteOpen(true);
  };

  const handleJobPosted = (newJob) => {
    saveStoredCustomJob(newJob, currentUser);
    setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
    if (newJob.approval_status === 'pending') {
      showToast(
        `Opportunity "${newJob.title}" submitted! It will go live to all visitors once verified by MCU Admin.`
      );
    } else {
      showToast(`Opportunity "${newJob.title}" broadcasted to Jobs & Careers successfully!`);
    }
    setTimeout(() => {
      const el = document.getElementById('jobs');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 350);
  };

  const handleDeleteJob = async (jobId) => {
    removeStoredCustomJob(jobId, currentUser);
    setJobs((prev) => prev.filter((j) => j.id !== jobId && j.dbId !== jobId));

    const cleanId = typeof jobId === 'string' && jobId.startsWith('db-job-')
      ? jobId.replace('db-job-', '')
      : jobId;
    if (!isNaN(cleanId)) {
      try {
        await jobsAPI.delete(cleanId, currentUser?.email);
      } catch (e) {
        console.log('Backend job delete sync:', e?.message || e);
      }
    }

    showToast('Job opportunity removed successfully.', 'info');
  };

  // ── EXECUTIVE ADMIN PANEL HANDLERS ──
  const handleVerifyAlumni = (alumniId, isVerified = true) => {
    const targetAlum = alumniList.find((a) => String(a.id) === String(alumniId));
    const targetEmail = targetAlum?.email ? String(targetAlum.email).trim().toLowerCase() : null;
    const targetUserId = targetAlum?.user_id ? String(targetAlum.user_id) : null;
    const verificationPayload = {
      is_verified: isVerified,
      verified: isVerified,
      verification_status: isVerified ? 'verified' : 'pending',
    };

    setAlumniList((prev) =>
      prev.map((a) =>
        String(a.id) === String(alumniId) ||
        (targetEmail && a.email && String(a.email).trim().toLowerCase() === targetEmail)
          ? {
              ...a,
              ...verificationPayload,
            }
          : a
      )
    );
    try {
      const verifications = getStoredJson(ALUMNI_VERIFICATIONS_KEY, {});
      verifications[String(alumniId)] = {
        ...(verifications[String(alumniId)] || {}),
        ...verificationPayload,
      };
      if (targetUserId) {
        verifications[targetUserId] = {
          ...(verifications[targetUserId] || {}),
          ...verificationPayload,
        };
      }
      if (targetEmail) {
        verifications[targetEmail] = {
          ...(verifications[targetEmail] || {}),
          ...verificationPayload,
        };
      }
      localStorage.setItem(ALUMNI_VERIFICATIONS_KEY, JSON.stringify(verifications));

      const customList = getStoredJson(CUSTOM_ALUMNI_KEY, []);
      if (Array.isArray(customList) && customList.length > 0) {
        const updatedCustom = customList.map((c) => {
          const cEmail = c.email ? String(c.email).trim().toLowerCase() : null;
          if (
            String(c.id) === String(alumniId) ||
            (targetUserId && String(c.user_id) === targetUserId) ||
            (targetEmail && cEmail === targetEmail)
          ) {
            return { ...c, ...verificationPayload };
          }
          return c;
        });
        localStorage.setItem(CUSTOM_ALUMNI_KEY, JSON.stringify(updatedCustom));
      }
    } catch {}
    showToast(
      isVerified
        ? 'Alumnus verified by MCU Administration! Job posting unlocked for this alumnus.'
        : 'Alumnus verification status set to pending. Job posting locked until verified.',
      'success'
    );
  };

  const handleBulkVerifyAlumni = () => {
    const verificationPayload = {
      is_verified: true,
      verified: true,
      verification_status: 'verified',
    };
    setAlumniList((prev) =>
      prev.map((a) => ({
        ...a,
        ...verificationPayload,
      }))
    );
    try {
      const verifications = getStoredJson(ALUMNI_VERIFICATIONS_KEY, {});
      alumniList.forEach((a) => {
        if (a.id) {
          verifications[String(a.id)] = {
            ...(verifications[String(a.id)] || {}),
            ...verificationPayload,
          };
        }
        if (a.user_id) {
          verifications[String(a.user_id)] = {
            ...(verifications[String(a.user_id)] || {}),
            ...verificationPayload,
          };
        }
        if (a.email) {
          const emailKey = String(a.email).trim().toLowerCase();
          verifications[emailKey] = {
            ...(verifications[emailKey] || {}),
            ...verificationPayload,
          };
        }
      });
      localStorage.setItem(ALUMNI_VERIFICATIONS_KEY, JSON.stringify(verifications));

      const customList = getStoredJson(CUSTOM_ALUMNI_KEY, []);
      if (Array.isArray(customList) && customList.length > 0) {
        const updatedCustom = customList.map((c) => ({ ...c, ...verificationPayload }));
        localStorage.setItem(CUSTOM_ALUMNI_KEY, JSON.stringify(updatedCustom));
      }
    } catch {}
    showToast('All pending alumni verified successfully! Job posting unlocked for verified alumni.');
  };

  const handleToggleAlumniMentor = (alumniId) => {
    setAlumniList((prev) =>
      prev.map((a) => {
        if (String(a.id) === String(alumniId)) {
          const nextMentor = !(a.openToMentor ?? a.open_to_mentor);
          try {
            const verifications = getStoredJson(ALUMNI_VERIFICATIONS_KEY, {});
            verifications[alumniId] = {
              ...(verifications[alumniId] || {}),
              openToMentor: nextMentor,
              open_to_mentor: nextMentor,
            };
            localStorage.setItem(ALUMNI_VERIFICATIONS_KEY, JSON.stringify(verifications));
          } catch {}
          return { ...a, openToMentor: nextMentor, open_to_mentor: nextMentor };
        }
        return a;
      })
    );
    showToast('Alumnus Mentorship status updated!');
  };

  const handleDeleteAlumni = (alumniId) => {
    setAlumniList((prev) => prev.filter((a) => String(a.id) !== String(alumniId)));
    try {
      const deleted = getStoredJson(DELETED_ALUMNI_KEY, []);
      if (!deleted.includes(alumniId)) {
        deleted.push(alumniId);
        localStorage.setItem(DELETED_ALUMNI_KEY, JSON.stringify(deleted));
      }
      const customAlumni = getStoredJson(CUSTOM_ALUMNI_KEY, []);
      localStorage.setItem(
        CUSTOM_ALUMNI_KEY,
        JSON.stringify(customAlumni.filter((a) => String(a.id) !== String(alumniId)))
      );
    } catch {}
    showToast('Alumnus removed from directory.', 'info');
  };

  const handleAddAlumni = (newAlumnus) => {
    setAlumniList((prev) => [newAlumnus, ...prev]);
    try {
      const customAlumni = getStoredJson(CUSTOM_ALUMNI_KEY, []);
      localStorage.setItem(CUSTOM_ALUMNI_KEY, JSON.stringify([newAlumnus, ...customAlumni]));
    } catch {}
    showToast(`Official verified alumnus "${newAlumnus.name}" added to directory!`);
  };

  const handleApproveJob = (jobId, alsoMarkPosterVerified = true) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              approval_status: 'approved',
              poster_verified: alsoMarkPosterVerified ? true : j.poster_verified,
            }
          : j
      )
    );
    try {
      const overrides = getStoredJson(JOB_STATUS_OVERRIDES_KEY, {});
      overrides[jobId] = { approval_status: 'approved', poster_verified: true };
      localStorage.setItem(JOB_STATUS_OVERRIDES_KEY, JSON.stringify(overrides));

      const customJobs = getStoredCustomJobs().map((j) =>
        j.id === jobId ? { ...j, approval_status: 'approved', poster_verified: true } : j
      );
      localStorage.setItem(CUSTOM_JOBS_STORAGE_KEY, JSON.stringify(customJobs));
    } catch {}
    showToast('Job verified & published live to Jobs & Careers!');
  };

  const handleRejectJob = (jobId) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, approval_status: 'rejected' } : j))
    );
    try {
      const overrides = getStoredJson(JOB_STATUS_OVERRIDES_KEY, {});
      overrides[jobId] = { approval_status: 'rejected' };
      localStorage.setItem(JOB_STATUS_OVERRIDES_KEY, JSON.stringify(overrides));

      const customJobs = getStoredCustomJobs().map((j) =>
        j.id === jobId ? { ...j, approval_status: 'rejected' } : j
      );
      localStorage.setItem(CUSTOM_JOBS_STORAGE_KEY, JSON.stringify(customJobs));
    } catch {}
    showToast('Job marked as rejected / hidden from public board.', 'info');
  };

  const handleAddMemory = (newMemory) => {
    setMemoriesList((prev) => {
      const next = [newMemory, ...prev.filter((m) => String(m.id) !== String(newMemory.id))];
      const defaultIds = new Set(campusMemories.map((m) => String(m.id)));
      const customOnly = next.filter((m) => !defaultIds.has(String(m.id)) || m.uploaded_by_admin);
      saveCustomMemoriesToDB(customOnly);
      return next;
    });
    try {
      const existing = getStoredJson(CUSTOM_MEMORIES_KEY, []).filter(
        (m) => String(m.id) !== String(newMemory.id)
      );
      let candidateList = [newMemory, ...existing];
      while (candidateList.length > 0) {
        try {
          localStorage.setItem(CUSTOM_MEMORIES_KEY, JSON.stringify(candidateList));
          break;
        } catch (quotaErr) {
          if (candidateList.length === 1) {
            console.warn('Memory stored in IndexedDB HD storage (localStorage full):', quotaErr);
            break;
          }
          candidateList = candidateList.slice(0, candidateList.length - 1);
        }
      }
    } catch (e) {
      console.warn('Could not save memory to localStorage:', e);
    }
    const isVid = newMemory?.mediaType === 'video';
    showToast(
      `${isVid ? 'Video' : 'Photo'} uploaded to Year ${newMemory.year} Campus Memories! Now visible to everyone on UI.`
    );
  };

  const handleDeleteMemory = (memoryId) => {
    setMemoriesList((prev) => {
      const next = prev.filter((m) => String(m.id) !== String(memoryId));
      const defaultIds = new Set(campusMemories.map((m) => String(m.id)));
      const customOnly = next.filter((m) => !defaultIds.has(String(m.id)) || m.uploaded_by_admin);
      saveCustomMemoriesToDB(customOnly);
      return next;
    });
    try {
      const existing = getStoredJson(CUSTOM_MEMORIES_KEY, []);
      localStorage.setItem(
        CUSTOM_MEMORIES_KEY,
        JSON.stringify(existing.filter((m) => String(m.id) !== String(memoryId)))
      );
      const deleted = getStoredJson(DELETED_MEMORIES_KEY, []);
      if (!deleted.includes(String(memoryId))) {
        deleted.push(String(memoryId));
        localStorage.setItem(DELETED_MEMORIES_KEY, JSON.stringify(deleted));
      }
    } catch {}
    showToast('Item removed from Campus Memories.', 'info');
  };

  // ── ADMIN EVENTS FULL CONTROL HANDLERS (INSTANT UI SYNC + INDEXEDDB + LOCALSTORAGE) ──
  const persistEventsSlice = (key, nextData) => {
    saveEventsStateToDB(key, nextData);
    try {
      localStorage.setItem(key, JSON.stringify(nextData));
    } catch (e) {
      console.warn(`Events stored in IndexedDB HD storage (${key}):`, e);
    }
  };

  const handleAddArchiveEvent = (newEventAlbum) => {
    setEventsArchiveList((prev) => {
      const next = [newEventAlbum, ...prev.filter((ev) => String(ev.id) !== String(newEventAlbum.id))];
      persistEventsSlice(EVENTS_ARCHIVE_STORAGE_KEY, next);
      return next;
    });
    showToast(
      `Event "${newEventAlbum.title || newEventAlbum.hindiTitle}" (${newEventAlbum.year}) published live to Events!`,
      'success'
    );
  };

  const handleAddPhotosToArchiveEvent = (eventId, newPhotoItems) => {
    const photosArr = Array.isArray(newPhotoItems) ? newPhotoItems : [newPhotoItems];
    if (photosArr.length === 0) return;

    let targetTitle = 'Event';
    setEventsArchiveList((prev) => {
      const next = prev.map((ev) => {
        if (String(ev.id) === String(eventId)) {
          targetTitle = ev.title || ev.hindiTitle || 'Event';
          const currentGallery = Array.isArray(ev.gallery) ? ev.gallery : [];
          return {
            ...ev,
            gallery: [...photosArr, ...currentGallery],
          };
        }
        return ev;
      });
      persistEventsSlice(EVENTS_ARCHIVE_STORAGE_KEY, next);
      return next;
    });
    showToast(
      `${photosArr.length} new photo(s) uploaded live to "${targetTitle}"!`,
      'success'
    );
  };

  const handleDeleteArchiveEvent = (eventId) => {
    setEventsArchiveList((prev) => {
      const next = prev.filter((ev) => String(ev.id) !== String(eventId));
      persistEventsSlice(EVENTS_ARCHIVE_STORAGE_KEY, next);
      return next;
    });
    showToast('Event album deleted from Events Archive.', 'info');
  };

  const handleDeleteArchivePhoto = (eventId, photoIndex) => {
    setEventsArchiveList((prev) => {
      const next = prev.map((ev) => {
        if (String(ev.id) !== String(eventId)) return ev;
        const currentGallery = Array.isArray(ev.gallery) ? ev.gallery : [];
        const updatedGallery = currentGallery.filter((_, idx) => idx !== photoIndex);
        return {
          ...ev,
          gallery: updatedGallery,
        };
      });
      persistEventsSlice(EVENTS_ARCHIVE_STORAGE_KEY, next);
      return next;
    });
    showToast('Photo removed from event album.', 'info');
  };

  const handleAddUpcomingEvent = (newConclave) => {
    setUpcomingEventsList((prev) => {
      const filtered = prev.filter((ev) => String(ev.id) !== String(newConclave.id));
      const adjusted = newConclave.featured
        ? filtered.map((ev) => ({ ...ev, featured: false }))
        : filtered;
      const next = [newConclave, ...adjusted];
      persistEventsSlice(UPCOMING_EVENTS_STORAGE_KEY, next);
      return next;
    });
    showToast(
      `Upcoming Conclave "${newConclave.title || newConclave.hindiTitle}" published live to Events!`,
      'success'
    );
  };

  const handleDeleteUpcomingEvent = (eventId) => {
    setUpcomingEventsList((prev) => {
      const next = prev.filter((ev) => String(ev.id) !== String(eventId));
      persistEventsSlice(UPCOMING_EVENTS_STORAGE_KEY, next);
      return next;
    });
    showToast('Conclave removed from Upcoming Events.', 'info');
  };

  const handleAddEventSlide = (newSlide) => {
    setEventSlidesList((prev) => {
      const next = [newSlide, ...prev.filter((s) => String(s.id) !== String(newSlide.id))];
      persistEventsSlice(EVENT_SLIDES_STORAGE_KEY, next);
      return next;
    });
    showToast('New HD Slide published live to Abhyuday Showcase!', 'success');
  };

  const handleDeleteEventSlide = (slideId) => {
    setEventSlidesList((prev) => {
      const next = prev.filter((s) => String(s.id) !== String(slideId));
      persistEventsSlice(EVENT_SLIDES_STORAGE_KEY, next);
      return next;
    });
    showToast('Slide removed from Abhyuday Showcase.', 'info');
  };

  const handleResetDefaultEvents = () => {
    setEventsArchiveList(defaultEventsArchive);
    setUpcomingEventsList(defaultUpcomingEvents);
    setEventSlidesList(defaultAbhyudaySlides);
    persistEventsSlice(EVENTS_ARCHIVE_STORAGE_KEY, defaultEventsArchive);
    persistEventsSlice(UPCOMING_EVENTS_STORAGE_KEY, defaultUpcomingEvents);
    persistEventsSlice(EVENT_SLIDES_STORAGE_KEY, defaultAbhyudaySlides);
    showToast('Default University Events & Photo Archives restored!', 'success');
  };

  const handleUpdateBroadcastNotice = (newNotice) => {
    setBroadcastNotice(newNotice);
    try {
      localStorage.setItem(ADMIN_BROADCAST_KEY, JSON.stringify(newNotice));
    } catch {}
    showToast('Official portal broadcast notice updated!');
  };

  // Received Referral Applications State (Incoming for Alumnus)
  const [receivedApplications, setReceivedApplications] = useState([]);
  // Submitted Referral Applications State (Outgoing for Student / Applicant)
  const [mySubmittedApplications, setMySubmittedApplications] = useState([]);

  const setListIfChanged = useCallback((setter, nextList) => {
    setter((prev) => {
      if (prev.length === 0 && nextList.length === 0) return prev;
      if (prev.length !== nextList.length) return nextList;
      const prevSig = prev.map((x) => `${x?.id}|${x?.status}|${x?.session_date || ''}`).join(';;');
      const nextSig = nextList.map((x) => `${x?.id}|${x?.status}|${x?.session_date || ''}`).join(';;');
      return prevSig === nextSig ? prev : nextList;
    });
  }, []);

  const fetchApplicationsData = useCallback(() => {
    if (!currentUser) {
      setListIfChanged(setReceivedApplications, []);
      setListIfChanged(setMySubmittedApplications, []);
      return;
    }

    const curEmail = (currentUser.email || '').toLowerCase().trim();
    const curId = currentUser.id ? String(currentUser.id) : null;
    const curName = (currentUser.name || currentUser.full_name || '').toLowerCase().trim();

    // 1. Get from localStorage
    let localApps = [];
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_received_applications') || '[]');
      if (Array.isArray(stored)) {
        localApps = stored;
      }
    } catch (e) {
      console.warn('Could not read mcu_received_applications:', e);
    }

    const isApplicant = (app) => {
      if (!app) return false;
      if (app.applicant_user_id && curId && String(app.applicant_user_id) === curId) return true;
      if (app.applicant_email && curEmail && app.applicant_email.toLowerCase().trim() === curEmail) return true;
      return false;
    };

    const isTargetAlumnus = (app) => {
      if (!app) return false;
      // Target alumnus matches by email, ID, name, or posted job ownership
      if (app.alumni_email && curEmail && app.alumni_email.toLowerCase().trim() === curEmail) return true;
      if (app.alumni_id && curId && String(app.alumni_id) === curId) return true;
      if (curName && app.alumni_name && app.alumni_name.toLowerCase().includes(curName)) return true;

      const userJobKey = getUserJobKey(currentUser);
      const myJobIds = JSON.parse(localStorage.getItem(userJobKey) || '[]');
      if (app.job_id && myJobIds.includes(app.job_id)) return true;

      return false;
    };

    const localReceived = localApps.filter(isTargetAlumnus);
    const localSubmitted = localApps.filter(isApplicant);

    // 2. Fetch Alumnus Received Applications from Go Backend
    jobsAPI.getApplications({ role: 'alumni', alumni_email: currentUser.email || '' })
      .then((serverApps) => {
        const sApps = Array.isArray(serverApps) ? serverApps : [];
        setListIfChanged(setReceivedApplications, deduplicateApplications([...sApps, ...localReceived]));
      })
      .catch(() => {
        setListIfChanged(setReceivedApplications, deduplicateApplications(localReceived));
      });

    // 3. Fetch Applicant Submitted Applications from Go Backend
    jobsAPI.getMyApplications({ applicant_email: currentUser.email || '' })
      .then((serverSubmitted) => {
        const sSub = Array.isArray(serverSubmitted) ? serverSubmitted : [];
        setListIfChanged(setMySubmittedApplications, deduplicateApplications([...sSub, ...localSubmitted]));
      })
      .catch(() => {
        setListIfChanged(setMySubmittedApplications, deduplicateApplications(localSubmitted));
      });
  }, [currentUser, setListIfChanged]);

  useEffect(() => {
    fetchApplicationsData();
    if (!currentUser) return;
    const interval = setInterval(fetchApplicationsData, 8000);
    const handleSync = () => fetchApplicationsData();
    window.addEventListener('focus', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchApplicationsData, currentUser]);

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    setReceivedApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
    setMySubmittedApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );

    try {
      const stored = JSON.parse(localStorage.getItem('mcu_received_applications') || '[]');
      const updated = stored.map((app) =>
        app.id === appId ? { ...app, status: newStatus } : app
      );
      localStorage.setItem('mcu_received_applications', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('LocalStorage status update error:', e);
    }

    const cleanId = typeof appId === 'string' && appId.startsWith('app-') ? null : appId;
    if (cleanId && !isNaN(cleanId)) {
      try {
        await jobsAPI.updateApplicationStatus(cleanId, newStatus);
      } catch (e) {
        console.log('Backend application status sync error:', e?.message || e);
      }
    }

    fetchApplicationsData();

    const statusLabel = newStatus === 'referred' ? 'Referred & Accepted!' : newStatus === 'under_review' ? 'Under Review' : newStatus === 'rejected' ? 'Declined' : 'Pending';
    showToast(`Application status updated to: ${statusLabel}`);
  };

  const handleDeleteApplication = async (appId) => {
    setReceivedApplications((prev) => prev.filter((app) => app.id !== appId));
    setMySubmittedApplications((prev) => prev.filter((app) => app.id !== appId));

    try {
      const stored = JSON.parse(localStorage.getItem('mcu_received_applications') || '[]');
      const updated = stored.filter((app) => app.id !== appId);
      localStorage.setItem('mcu_received_applications', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage delete application error:', e);
    }

    const cleanId = typeof appId === 'string' && appId.startsWith('app-') ? null : appId;
    if (cleanId && !isNaN(cleanId)) {
      try {
        await jobsAPI.deleteApplication(cleanId);
      } catch (e) {
        console.log('Backend delete application sync error:', e?.message || e);
      }
    }

    showToast('Application deleted successfully.', 'info');
  };

  // ── MENTORSHIP REQUESTS & SESSION SCHEDULING STATE ──
  const [receivedMentorshipRequests, setReceivedMentorshipRequests] = useState([]);
  const [myMentorshipRequests, setMyMentorshipRequests] = useState([]);

  const getMentorshipDedupeKey = (req) => {
    if (!req) return '';
    const sEmail = (req.mentee_email || req.mentee_name || String(req.mentee_user_id || '')).toLowerCase().trim();
    const topic = (req.topic || '').toLowerCase().trim();
    const msg = (req.message || '').toLowerCase().trim();
    return `${sEmail}|${topic}|${msg}`;
  };

  const getMentorshipDeletedSignatures = (req) => {
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

  const isMentorshipReqDeleted = (req) => {
    if (!req) return true;
    try {
      const deletedList = JSON.parse(localStorage.getItem('mcu_deleted_mentorship_keys') || '[]');
      if (!Array.isArray(deletedList) || deletedList.length === 0) return false;
      const deletedSet = new Set(deletedList);
      const sigs = getMentorshipDeletedSignatures(req);
      return sigs.some((s) => deletedSet.has(s));
    } catch {
      return false;
    }
  };

  const deduplicateMentorshipList = (list) => {
    const mapByKey = new Map();
    for (const item of list) {
      if (!item || isMentorshipReqDeleted(item)) continue;
      const key = getMentorshipDedupeKey(item) || String(item.id);
      const numericId =
        item.dbId ||
        (item.id && !String(item.id).startsWith('mentor-req-') && !isNaN(item.id) ? item.id : null);
      const normalizedItem = numericId ? { ...item, dbId: numericId } : item;

      const existing = mapByKey.get(key);
      if (!existing) {
        mapByKey.set(key, normalizedItem);
      } else {
        const mergedDbId = existing.dbId || normalizedItem.dbId || null;
        const existingScheduled = existing.status === 'scheduled' || existing.status === 'accepted' || Boolean(existing.session_date);
        const currentScheduled = normalizedItem.status === 'scheduled' || normalizedItem.status === 'accepted' || Boolean(normalizedItem.session_date);
        if (currentScheduled && !existingScheduled) {
          mapByKey.set(key, { ...existing, ...normalizedItem, dbId: mergedDbId });
        } else {
          mapByKey.set(key, { ...normalizedItem, ...existing, dbId: mergedDbId });
        }
      }
    }
    return Array.from(mapByKey.values());
  };

  const fetchMentorshipData = useCallback(() => {
    if (!currentUser) {
      setListIfChanged(setReceivedMentorshipRequests, []);
      setListIfChanged(setMyMentorshipRequests, []);
      return;
    }

    const curEmail = (currentUser.email || '').toLowerCase().trim();
    const curId = currentUser.id ? String(currentUser.id) : null;
    const curName = (currentUser.name || currentUser.full_name || '').toLowerCase().trim();

    let localReqs = [];
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_mentorship_requests') || '[]');
      if (Array.isArray(stored)) localReqs = stored.filter((r) => !isMentorshipReqDeleted(r));
    } catch {}

    const isMentee = (req) => {
      if (!req) return false;
      if (req.mentee_user_id && curId && String(req.mentee_user_id) === curId) return true;
      if (req.mentee_email && curEmail && req.mentee_email.toLowerCase().trim() === curEmail) return true;
      return false;
    };

    const isMentor = (req) => {
      if (!req || isMentee(req)) return false;
      if (req.mentor_id && curId && String(req.mentor_id) === curId) return true;
      if (req.mentor_email && curEmail && req.mentor_email.toLowerCase().trim() === curEmail) return true;
      if (curName && req.mentor_name && req.mentor_name.toLowerCase().trim().includes(curName)) return true;
      return false;
    };

    const localMentorReqs = localReqs.filter(isMentor);
    const localMenteeReqs = localReqs.filter(isMentee);

    // 1. Fetch Incoming Mentorship Requests for Alumnus
    mentorshipAPI
      .getMyRequests({
        role: 'mentor',
        mentor_email: currentUser.email || '',
        mentor_name: currentUser.name || currentUser.full_name || '',
      })
      .then((serverReqs) => {
        const sList = Array.isArray(serverReqs) ? serverReqs : [];
        const combined = deduplicateMentorshipList([...sList, ...localMentorReqs]);
        setListIfChanged(setReceivedMentorshipRequests, combined);

        // Live notification alert for Alumnus when a new mentorship request arrives
        try {
          const notifiedKey = `mcu_notified_mentor_reqs_${curEmail || curId}`;
          const seenIds = new Set(JSON.parse(localStorage.getItem(notifiedKey) || '[]'));
          let hasNew = false;
          for (const req of combined) {
            const k = getMentorshipDedupeKey(req) || String(req.id);
            if (k && !seenIds.has(k) && (!req.status || req.status === 'pending')) {
              seenIds.add(k);
              hasNew = true;
              showToast(
                `🔔 New Mentorship Request from ${req.mentee_name || 'Student'} on "${req.topic || 'Career Guidance'}"! Schedule your free slot in Mentorship tab.`,
                'success'
              );
            }
          }
          if (hasNew) {
            localStorage.setItem(notifiedKey, JSON.stringify(Array.from(seenIds)));
          }
        } catch {}
      })
      .catch(() => {
        setListIfChanged(setReceivedMentorshipRequests, deduplicateMentorshipList(localMentorReqs));
      });

    // 2. Fetch Outgoing Mentorship Requests for Student / Mentee
    mentorshipAPI
      .getMyRequests({
        role: 'mentee',
        mentee_email: currentUser.email || '',
      })
      .then((serverSub) => {
        const sSub = Array.isArray(serverSub) ? serverSub : [];
        const combined = deduplicateMentorshipList([...sSub, ...localMenteeReqs]);
        setListIfChanged(setMyMentorshipRequests, combined);

        // Live notification alert for Student when Alumnus schedules a session!
        try {
          const notifiedKey = `mcu_notified_scheduled_sessions_${curEmail || curId}`;
          const seenScheduled = new Set(JSON.parse(localStorage.getItem(notifiedKey) || '[]'));
          let hasNewSchedule = false;
          for (const req of combined) {
            if (req.status === 'scheduled' || req.status === 'accepted') {
              const k = `${getMentorshipDedupeKey(req)}|${req.session_date || ''}|${req.session_time || ''}`;
              if (!seenScheduled.has(k)) {
                seenScheduled.add(k);
                hasNewSchedule = true;
                showToast(
                  `🎉 ${req.mentor_name || 'Alumnus'} scheduled your "${req.topic || 'Career'}" session for ${req.session_date || 'Upcoming Slot'} (${req.session_time || 'Confirmed'})!`,
                  'success'
                );
              }
            }
          }
          if (hasNewSchedule) {
            localStorage.setItem(notifiedKey, JSON.stringify(Array.from(seenScheduled)));
          }
        } catch {}
      })
      .catch(() => {
        setListIfChanged(setMyMentorshipRequests, deduplicateMentorshipList(localMenteeReqs));
      });
  }, [currentUser, setListIfChanged]);

  useEffect(() => {
    fetchMentorshipData();
    if (!currentUser) return;
    const interval = setInterval(fetchMentorshipData, 8000);
    const handleSync = () => fetchMentorshipData();
    window.addEventListener('focus', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchMentorshipData, currentUser]);

  const isMatchingMentorshipReq = (targetReq, item) => {
    if (!targetReq || !item) return false;
    if (targetReq.id && item.id && String(targetReq.id) === String(item.id)) return true;
    if (targetReq.dbId && item.id && String(targetReq.dbId) === String(item.id)) return true;
    if (targetReq.id && item.dbId && String(targetReq.id) === String(item.dbId)) return true;
    const tKey = getMentorshipDedupeKey(targetReq);
    const iKey = getMentorshipDedupeKey(item);
    if (tKey && iKey && tKey === iKey) return true;
    const tEmail = (targetReq.mentee_email || '').toLowerCase().trim();
    const iEmail = (item.mentee_email || '').toLowerCase().trim();
    const tTopic = (targetReq.topic || '').toLowerCase().trim();
    const iTopic = (item.topic || '').toLowerCase().trim();
    if (tEmail && iEmail && tEmail === iEmail && tTopic === iTopic) return true;
    return false;
  };

  const handleUpdateMentorshipStatus = async (targetReq, schedulePayload) => {
    if (!targetReq) return;

    const updatedFields = {
      status: schedulePayload.status || 'scheduled',
      session_date: schedulePayload.session_date || targetReq.session_date || '',
      session_time: schedulePayload.session_time || targetReq.session_time || '',
      session_mode: schedulePayload.session_mode || targetReq.session_mode || 'Google Meet (Video Session)',
      meeting_link: schedulePayload.meeting_link || targetReq.meeting_link || '',
      mentor_note: schedulePayload.mentor_note || targetReq.mentor_note || '',
    };

    setReceivedMentorshipRequests((prev) =>
      prev.map((item) => (isMatchingMentorshipReq(targetReq, item) ? { ...item, ...updatedFields } : item))
    );
    setMyMentorshipRequests((prev) =>
      prev.map((item) => (isMatchingMentorshipReq(targetReq, item) ? { ...item, ...updatedFields } : item))
    );

    try {
      const stored = JSON.parse(localStorage.getItem('mcu_mentorship_requests') || '[]');
      let matchedInStorage = false;
      const updatedStorage = (Array.isArray(stored) ? stored : []).map((item) => {
        if (isMatchingMentorshipReq(targetReq, item)) {
          matchedInStorage = true;
          return { ...item, ...updatedFields };
        }
        return item;
      });
      if (!matchedInStorage) {
        updatedStorage.unshift({ ...targetReq, ...updatedFields });
      }
      localStorage.setItem('mcu_mentorship_requests', JSON.stringify(updatedStorage));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Could not update mcu_mentorship_requests in localStorage:', e);
    }

    const rawId = targetReq.dbId || targetReq.id;
    const cleanId = typeof rawId === 'string' && rawId.startsWith('mentor-req-') ? null : rawId;
    if (cleanId && !isNaN(cleanId)) {
      try {
        await mentorshipAPI.updateRequestStatus(cleanId, updatedFields);
      } catch (e) {
        console.log('Backend mentorship schedule sync:', e?.message || e);
      }
    }

    fetchMentorshipData();
    if (updatedFields.status === 'scheduled' || updatedFields.status === 'accepted') {
      showToast(
        `Session scheduled for ${updatedFields.session_date} (${updatedFields.session_time})! Notification & email sent to ${targetReq.mentee_name || 'student'}.`,
        'success'
      );
    } else if (updatedFields.status === 'completed') {
      showToast('Mentorship session marked as completed!', 'success');
    } else if (updatedFields.status === 'declined') {
      showToast('Mentorship request declined.', 'info');
    }
  };

  const handleDeleteMentorshipRequest = async (targetReq) => {
    if (!targetReq) return;

    // 1. Persist deleted signatures in localStorage so polling or old DB rows never bring it back
    try {
      const existingDeleted = JSON.parse(localStorage.getItem('mcu_deleted_mentorship_keys') || '[]');
      const deletedSet = new Set(Array.isArray(existingDeleted) ? existingDeleted : []);
      getMentorshipDeletedSignatures(targetReq).forEach((sig) => deletedSet.add(sig));

      // Also add signatures of any matching items in state
      [...receivedMentorshipRequests, ...myMentorshipRequests].forEach((item) => {
        if (isMatchingMentorshipReq(targetReq, item)) {
          getMentorshipDeletedSignatures(item).forEach((sig) => deletedSet.add(sig));
        }
      });

      localStorage.setItem('mcu_deleted_mentorship_keys', JSON.stringify(Array.from(deletedSet)));
    } catch (e) {
      console.warn('Could not persist deleted mentorship key:', e);
    }

    // 2. Collect all numeric DB IDs to delete from backend
    const dbIdsToDelete = new Set();
    const addCandidateId = (val) => {
      if (val !== undefined && val !== null && !String(val).startsWith('mentor-req-') && !isNaN(val)) {
        dbIdsToDelete.add(String(val));
      }
    };
    addCandidateId(targetReq.id);
    addCandidateId(targetReq.dbId);
    [...receivedMentorshipRequests, ...myMentorshipRequests].forEach((item) => {
      if (isMatchingMentorshipReq(targetReq, item)) {
        addCandidateId(item.id);
        addCandidateId(item.dbId);
      }
    });

    // 3. Remove immediately from React state
    setReceivedMentorshipRequests((prev) => prev.filter((item) => !isMatchingMentorshipReq(targetReq, item)));
    setMyMentorshipRequests((prev) => prev.filter((item) => !isMatchingMentorshipReq(targetReq, item)));

    // 4. Remove from localStorage mcu_mentorship_requests
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_mentorship_requests') || '[]');
      const updatedStorage = (Array.isArray(stored) ? stored : []).filter(
        (item) => !isMatchingMentorshipReq(targetReq, item)
      );
      localStorage.setItem('mcu_mentorship_requests', JSON.stringify(updatedStorage));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // 5. Delete from Go Backend DB
    for (const cleanId of dbIdsToDelete) {
      try {
        await mentorshipAPI.deleteRequest(cleanId);
      } catch {}
    }

    showToast('Mentorship request deleted successfully.', 'info');
  };

  const handleLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    showToast('Signed out of portal successfully.');
  };

  const handleProfileUpdated = (updatedProfile) => {
    const isAvatarFieldPresent = updatedProfile && ('avatar_url' in updatedProfile || 'avatar' in updatedProfile);
    const newAvatar = isAvatarFieldPresent
      ? (updatedProfile.avatar_url || updatedProfile.avatar || null)
      : (currentUser?.avatar_url || currentUser?.avatar || null);

    const resolvedSkills = (Array.isArray(updatedProfile?.skills) && updatedProfile.skills.length > 0)
      ? updatedProfile.skills
      : (currentUser?.skills?.length > 0 ? currentUser.skills : getProfileSkills(updatedProfile));

    const mergedUser = {
      ...(currentUser || {}),
      ...updatedProfile,
      skills: resolvedSkills,
      avatar_url: newAvatar,
      avatar: newAvatar,
    };
    setCurrentUser(mergedUser);
    try {
      localStorage.setItem('mcu_user', JSON.stringify(mergedUser));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    // Instant update in alumni directory list
    setAlumniList((prev) => {
      let found = false;
      const updated = prev.map((item) => {
        const isMatch = (updatedProfile.id && item.id === updatedProfile.id) ||
                        (updatedProfile.user_id && item.user_id === updatedProfile.user_id) ||
                        (updatedProfile.email && item.email === updatedProfile.email);
        if (isMatch) {
          found = true;
          return {
            ...item,
            ...updatedProfile,
            name: updatedProfile.name || updatedProfile.full_name || item.name,
            avatar: isAvatarFieldPresent ? newAvatar : item.avatar,
            avatar_url: isAvatarFieldPresent ? newAvatar : item.avatar_url,
            currentRole: updatedProfile.current_role || updatedProfile.currentRole || item.currentRole,
            company: updatedProfile.company || item.company,
            location: updatedProfile.location || item.location,
            batch: updatedProfile.batch_year || updatedProfile.batch || item.batch,
            bio: updatedProfile.bio || item.bio,
            linkedIn: updatedProfile.linkedin_url || updatedProfile.linkedIn || item.linkedIn,
            skills: resolvedSkills,
          };
        }
        return item;
      });
      if (!found && updatedProfile) {
        return [{
          id: updatedProfile.id || Date.now(),
          ...updatedProfile,
          name: updatedProfile.name || updatedProfile.full_name || 'Alumnus',
          avatar: newAvatar,
          avatar_url: newAvatar,
          currentRole: updatedProfile.current_role || updatedProfile.currentRole || 'Media Professional',
          company: updatedProfile.company || 'MCU Alumnus',
          location: updatedProfile.location || 'Bhopal, MP',
          batch: updatedProfile.batch_year || updatedProfile.batch || 2024,
          skills: resolvedSkills,
        }, ...updated];
      }
      return updated;
    });

    // Also update selectedAlumni modal if it's currently open
    setSelectedAlumni((prev) => {
      if (!prev) return null;
      const isCurrentMatch = (updatedProfile.id && prev.id === updatedProfile.id) ||
                             (updatedProfile.user_id && prev.user_id === updatedProfile.user_id) ||
                             (updatedProfile.email && prev.email === updatedProfile.email);
      if (isCurrentMatch) {
        return {
          ...prev,
          ...updatedProfile,
          avatar: isAvatarFieldPresent ? newAvatar : prev.avatar,
          avatar_url: isAvatarFieldPresent ? newAvatar : prev.avatar_url,
          skills: resolvedSkills,
        };
      }
      return prev;
    });

    showToast('Profile & photo updated successfully!');
  };

  const isCurrentAlumniVerified = isVerifiedAlumnus(currentUser, alumniList);

  const handleOpenPostJobGate = (alumnus = null) => {
    if (!currentUser) {
      showToast('Please sign in with an Admin-verified Alumni account to post job opportunities.', 'info');
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }
    if (isCurrentStudent(currentUser)) {
      showToast('Job posting is exclusively available for graduated MCU Alumni. Students can apply for referrals!', 'info');
      return;
    }
    if (!isCurrentAlumniVerified) {
      showToast(
        '🔒 Admin Verification Pending: You can post job opportunities only after MCU Admin verifies your Alumni profile.',
        'error'
      );
      return;
    }
    setPostingJobAlumni(alumnus || currentUser);
    setIsPostingJob(true);
  };

  const adminPendingCount =
    alumniList.filter((a) => a.is_verified === false || a.verification_status === 'pending').length +
    jobs.filter((j) => j.approval_status === 'pending').length;

  const allPortalApplications = (() => {
    const localApps = getStoredJson('mcu_received_applications', []);
    return deduplicateApplications([...receivedApplications, ...mySubmittedApplications, ...localApps]);
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-[#fc4a00] selection:text-white relative">
      {/* Global Light-Palette 3D Animated Background */}
      <Ambient3DBackground />

      {/* Live Top Scroll Progress Bar, Section Spy & Circular Scroll-Ring Back-to-Top */}
      <ScrollProgressHUD />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Navigation (Includes Official Portal Broadcast Ticker when enabled) */}
      <Navbar
        currentUser={currentUser}
        isVerifiedAlumni={isCurrentAlumniVerified}
        applicationCount={receivedApplications.length}
        mySubmittedCount={mySubmittedApplications.length}
        acceptedApplicationCount={mySubmittedApplications.filter((a) => a.status === 'referred' || a.status === 'accepted').length}
        underReviewApplicationCount={mySubmittedApplications.filter((a) => a.status === 'under_review').length}
        rejectedApplicationCount={mySubmittedApplications.filter((a) => a.status === 'rejected').length}
        receivedMentorshipCount={receivedMentorshipRequests.length}
        myMentorshipCount={myMentorshipRequests.length}
        scheduledMentorshipCount={myMentorshipRequests.filter((r) => r.status === 'scheduled' || r.status === 'accepted').length}
        adminPendingCount={adminPendingCount}
        broadcastNotice={broadcastNotice}
        onOpenAdminPanel={(tab = 'overview') => setAdminModal({ isOpen: true, tab })}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
        onQuickSearch={handleQuickSearch}
        onOpenProfile={(tab = 'photo') => {
          if ((tab === 'job' || tab === 'applications') && isCurrentStudent(currentUser)) {
            showToast('Job posting & management is reserved for graduated MCU Alumni. Students can track their applied referrals!', 'info');
            setEditProfileInitialTab('my_applications');
          } else if (tab === 'job' && !isCurrentAlumniVerified) {
            showToast(
              '🔒 Admin Verification Pending: You can post job opportunities only after MCU Admin verifies your Alumni profile.',
              'error'
            );
            setEditProfileInitialTab('job');
          } else {
            setEditProfileInitialTab(tab);
          }
          setIsEditProfileOpen(true);
        }}
        onOpenMyJobs={() => {
          if (isCurrentStudent(currentUser)) {
            showToast('Only graduated MCU Alumni can post or manage job opportunities.', 'info');
            return;
          }
          if (!isCurrentAlumniVerified) {
            showToast(
              '🔒 Admin Verification Pending: You can post job opportunities only after MCU Admin verifies your Alumni profile.',
              'error'
            );
            return;
          }
          setEditProfileInitialTab('job');
          setIsEditProfileOpen(true);
        }}
        onOpenApplications={() => {
          if (isCurrentStudent(currentUser)) {
            setEditProfileInitialTab('my_applications');
            setIsEditProfileOpen(true);
            return;
          }
          setEditProfileInitialTab('applications');
          setIsEditProfileOpen(true);
        }}
        onOpenMyApplications={() => {
          setEditProfileInitialTab('my_applications');
          setIsEditProfileOpen(true);
        }}
        onOpenMentorship={() => {
          setEditProfileInitialTab('mentorship');
          setIsEditProfileOpen(true);
        }}
        onOpenPostJob={(alumnus) => handleOpenPostJobGate(alumnus)}
        onLogout={handleLogout}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          broadcastNotice={broadcastNotice}
        />

        {/* Alumni Directory */}
        <AlumniDirectory
          profiles={alumniList}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectAlumni={(alumni) => setSelectedAlumni(alumni)}
          onRequestMentorship={(mentor) => setMentorshipMentor(mentor)}
        />

        {/* Mentorship Hub */}
        <MentorshipSection
          profiles={alumniList}
          onRequestMentorship={(mentor) => setMentorshipMentor(mentor)}
        />

        {/* Job Board & Careers */}
        <JobBoard
          jobs={jobs}
          currentUser={currentUser}
          isVerifiedAlumni={isCurrentAlumniVerified}
          onApplyJob={(job) => setApplyingJob(job)}
          onApproveJob={handleApproveJob}
          onOpenAdminJobs={() => setAdminModal({ isOpen: true, tab: 'jobs' })}
          onOpenPostJob={() => handleOpenPostJobGate(currentUser)}
          onPostJob={() => handleOpenPostJobGate(currentUser)}
        />

        {/* Events & Abhyuday 2026 (Synced with Admin Events & Photo Uploads) */}
        <EventsSection
          onRSVP={(event) => setRsvpEvent(event)}
          onRsvpEvent={(event) => setRsvpEvent(event)}
          archiveEvents={eventsArchiveList}
          upcomingEventsList={upcomingEventsList}
          slidesList={eventSlidesList}
          isAdmin={isAdminUser}
          onOpenAdminEvents={(targetAlbumId = '') => {
            setAdminEventsTargetAlbumId(targetAlbumId || '');
            setAdminModal({ isOpen: true, tab: 'events' });
          }}
          onDeleteArchiveEvent={handleDeleteArchiveEvent}
          onDeleteArchivePhoto={handleDeleteArchivePhoto}
          onDeleteUpcomingEvent={handleDeleteUpcomingEvent}
          onDeleteEventSlide={handleDeleteEventSlide}
        />

        {/* Campus Gallery & Archives (Synced with Admin Year-wise Photo Uploads) */}
        <CampusGallery
          memories={memoriesList}
          isAdmin={isAdminUser}
          onOpenAdminMemories={() => setAdminModal({ isOpen: true, tab: 'memories' })}
          onDeleteMemory={handleDeleteMemory}
        />

        {/* Giving & Initiatives */}
        <GivingSection
          onDonate={(initiative) => setGivingInitiative(initiative)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Code-Split Interactive Modals & Global Ctrl+K Spotlight Command Palette */}
      <Suspense fallback={null}>
        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            alumniList={alumniList}
            jobs={jobs}
            onSelectAlumni={(alumni) => setSelectedAlumni(alumni)}
            onApplyJob={(job) => setApplyingJob(job)}
            onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
            onSearchDirectory={(q) => setSearchQuery(q)}
          />
        )}

        {selectedAlumni && (
          <ProfileDetailModal
            alumni={selectedAlumni}
            currentUser={currentUser}
            isVerifiedAlumni={isCurrentAlumniVerified}
            allJobs={jobs}
            receivedApplications={receivedApplications}
            mySubmittedApplications={mySubmittedApplications}
            onDeleteJob={handleDeleteJob}
            onClose={() => setSelectedAlumni(null)}
            onOpenManageApplications={() => {
              setSelectedAlumni(null);
              setEditProfileInitialTab('applications');
              setIsEditProfileOpen(true);
            }}
            onOpenMyApplications={() => {
              setSelectedAlumni(null);
              setEditProfileInitialTab('my_applications');
              setIsEditProfileOpen(true);
            }}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onRequestMentorship={(mentor) => {
              setSelectedAlumni(null);
              setMentorshipMentor(mentor);
            }}
            onOpenPostJob={(alumnus) => {
              setSelectedAlumni(null);
              handleOpenPostJobGate(alumnus);
            }}
          />
        )}

        {isEditProfileOpen && currentUser && (
          <EditProfileModal
            user={currentUser}
            isVerifiedAlumni={isCurrentAlumniVerified}
            allJobs={jobs}
            receivedApplications={receivedApplications}
            mySubmittedApplications={mySubmittedApplications}
            receivedMentorshipRequests={receivedMentorshipRequests}
            myMentorshipRequests={myMentorshipRequests}
            initialTab={editProfileInitialTab}
            onClose={() => {
              setIsEditProfileOpen(false);
              setEditProfileInitialTab('photo');
            }}
            onProfileUpdated={handleProfileUpdated}
            onJobPosted={handleJobPosted}
            onDeleteJob={handleDeleteJob}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
            onUpdateMentorshipStatus={handleUpdateMentorshipStatus}
            onDeleteMentorshipRequest={handleDeleteMentorshipRequest}
          />
        )}

        {mentorshipMentor && (
          <MentorshipModal
            mentor={mentorshipMentor}
            currentUser={currentUser}
            onClose={() => setMentorshipMentor(null)}
            onSuccess={(msg) => {
              showToast(msg, 'success');
              fetchMentorshipData();
            }}
          />
        )}

        {applyingJob && (
          <JobApplicationModal
            job={applyingJob}
            currentUser={currentUser}
            alumniList={alumniList}
            onClose={() => setApplyingJob(null)}
            onSuccess={(msg) => {
              showToast(msg, 'success');
              fetchApplicationsData();
            }}
          />
        )}

        {isPostingJob && (
          <PostJobModal
            currentUser={currentUser}
            isVerifiedAlumni={isCurrentAlumniVerified}
            initialAlumni={postingJobAlumni}
            onClose={() => {
              setIsPostingJob(false);
              setPostingJobAlumni(null);
            }}
            onJobPosted={handleJobPosted}
          />
        )}

        {rsvpEvent && (
          <EventRsvpModal
            event={rsvpEvent}
            onClose={() => setRsvpEvent(null)}
            onSuccess={(msg) => showToast(msg, 'success')}
          />
        )}

        {givingInitiative && (
          <GivingModal
            initiative={givingInitiative}
            onClose={() => setGivingInitiative(null)}
            onSuccess={(msg) => showToast(msg, 'success')}
          />
        )}

        {authModal.isOpen && (
          <AuthModal
            initialMode={authModal.mode}
            alumniList={alumniList}
            onClose={() => setAuthModal({ isOpen: false, mode: 'register' })}
            onSuccess={(msg) => showToast(msg, 'success')}
            onAlumniRegistered={handleAlumniRegistered}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              if (user?.is_admin || user?.role === 'admin') {
                setTimeout(() => {
                  setAdminModal({ isOpen: true, tab: 'overview' });
                }, 300);
              }
            }}
          />
        )}

        {isAdminUser && adminModal.isOpen && (
          <AdminPanelModal
            isOpen={adminModal.isOpen}
            initialTab={adminModal.tab}
            onClose={() => setAdminModal((prev) => ({ ...prev, isOpen: false }))}
            currentUser={currentUser}
            onUpdateAdminUser={(updatedAdmin) => setCurrentUser(updatedAdmin)}
            alumniList={alumniList}
            jobs={jobs}
            memories={memoriesList}
            eventsArchive={eventsArchiveList}
            upcomingEvents={upcomingEventsList}
            eventSlides={eventSlidesList}
            initialEventAlbumId={adminEventsTargetAlbumId}
            allApplications={allPortalApplications}
            broadcastNotice={broadcastNotice}
            onUpdateBroadcastNotice={handleUpdateBroadcastNotice}
            onVerifyAlumni={handleVerifyAlumni}
            onBulkVerifyAlumni={handleBulkVerifyAlumni}
            onToggleAlumniMentor={handleToggleAlumniMentor}
            onDeleteAlumni={handleDeleteAlumni}
            onAddAlumni={handleAddAlumni}
            onApproveJob={handleApproveJob}
            onRejectJob={handleRejectJob}
            onDeleteJob={handleDeleteJob}
            onPostAdminJob={handleJobPosted}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onAddArchiveEvent={handleAddArchiveEvent}
            onAddPhotosToArchiveEvent={handleAddPhotosToArchiveEvent}
            onDeleteArchiveEvent={handleDeleteArchiveEvent}
            onDeleteArchivePhoto={handleDeleteArchivePhoto}
            onAddUpcomingEvent={handleAddUpcomingEvent}
            onDeleteUpcomingEvent={handleDeleteUpcomingEvent}
            onAddEventSlide={handleAddEventSlide}
            onDeleteEventSlide={handleDeleteEventSlide}
            onResetDefaultEvents={handleResetDefaultEvents}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
            onShowToast={showToast}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
