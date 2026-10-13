import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, PlusCircle, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { jobsAPI } from '../services/api';
import { FormProgressBar } from './FormProgressBar';
import { isVerifiedAlumnus } from '../utils/skills';

export const PostJobModal = ({ onClose, onJobPosted, currentUser, isVerifiedAlumni = false, initialAlumni }) => {
  const { lang } = useLanguage();
  const isAdminUser = Boolean(currentUser?.is_admin || currentUser?.role === 'admin');
  const isVerified = Boolean(isAdminUser || isVerifiedAlumni || isVerifiedAlumnus(currentUser));

  const targetAlumnus = initialAlumni || currentUser;
  const defaultPoster = targetAlumnus
    ? `${targetAlumnus.name || targetAlumnus.full_name || targetAlumnus.first_name || ''} ${targetAlumnus.batch || targetAlumnus.batch_year ? `(Batch of ${targetAlumnus.batch || targetAlumnus.batch_year})` : ''}`.trim()
    : '';
  const defaultCompany = targetAlumnus?.company || '';
  const defaultLocation = targetAlumnus?.location || '';

  const [formData, setFormData] = useState({
    title: '',
    company: defaultCompany,
    postedBy: defaultPoster,
    location: defaultLocation,
    type: 'Full-time',
    experience: '2-4 Years',
    salary: '₹8 - 12 LPA',
    deadline: '30 Days',
    description: '',
    tags: 'Computer Science, Software, React, Python, Cloud'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postJobFields = [
    Boolean(formData.title?.trim().length >= 3),
    Boolean(formData.company?.trim().length >= 2),
    Boolean(formData.postedBy?.trim().length >= 2),
    Boolean(formData.location?.trim().length >= 2),
    Boolean(formData.experience?.trim()),
    Boolean(formData.salary?.trim()),
    Boolean(formData.description?.trim().length >= 10),
    Boolean(formData.tags?.trim().length >= 2),
  ];
  const postJobCompleted = postJobFields.filter(Boolean).length;
  const postJobPercentage = Math.round((postJobCompleted / postJobFields.length) * 100);

  // Quick Preset Helper for Computer Science & IT
  const applyTechPreset = (title, tags, desc) => {
    setFormData((prev) => ({
      ...prev,
      title: title || prev.title,
      tags: tags || prev.tags,
      description: desc || prev.description,
      location: prev.location || 'Bengaluru / Remote'
    }));
  };

  useEffect(() => {
    if (defaultPoster && !formData.postedBy) {
      setFormData((prev) => ({
        ...prev,
        postedBy: defaultPoster,
        company: prev.company || defaultCompany,
        location: prev.location || defaultLocation
      }));
    }
  }, [defaultPoster, defaultCompany, defaultLocation]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      onClose();
      return;
    }
    if (!formData.title || !formData.company || !formData.description) return;

    setIsSubmitting(true);

    const userEmail = currentUser?.email || 'alumni@mcu.ac.in';
    const userId = currentUser?.id || 13;

    const isPosterVerified = Boolean(isAdminUser || isVerified);

    const newJob = {
      id: `job-${Date.now()}`,
      title: formData.title,
      company: formData.company,
      company_name: formData.company,
      postedBy: formData.postedBy,
      authorEmail: userEmail,
      posted_by_email: userEmail,
      authorId: userId,
      posted_by_user_id: userId,
      location: formData.location,
      type: formData.type,
      job_type: formData.type,
      experience: formData.experience,
      experience_required: formData.experience,
      salary: formData.salary,
      salary_range: formData.salary,
      deadline: formData.deadline,
      deadline_date: formData.deadline,
      description: formData.description,
      referral_alumnus_name: formData.postedBy,
      approval_status: isAdminUser ? 'approved' : 'pending',
      poster_verified: isPosterVerified,
      created_at: new Date().toISOString(),
      tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : ['Computer Science', 'Software']
    };

    // Save ID to local storage so creator can always track and delete it
    try {
      const myJobIds = JSON.parse(localStorage.getItem('mcu_my_job_ids') || '[]');
      if (!myJobIds.includes(newJob.id)) {
        myJobIds.push(newJob.id);
        localStorage.setItem('mcu_my_job_ids', JSON.stringify(myJobIds));
      }
    } catch {}

    // Sync with backend Jobs microservice (:8004 via gateway :8000) with a 3.5s timeout race
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
        author_email: userEmail,
        posted_by_user_id: userId,
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
      setIsSubmitting(false);
    }

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch {}

    if (onJobPosted) {
      onJobPosted(newJob);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="mcu-animated-border-modal mcu-modal-spring-enter bg-gradient-to-b from-white via-[#fafdff] to-[#f4f9ff] w-full max-w-[620px] rounded-2xl sm:rounded-3xl border border-sky-200/80 shadow-[0_28px_70px_-12px_rgba(2,132,199,0.26),0_10px_28px_-6px_rgba(0,34,68,0.16)] overflow-hidden relative max-h-[92vh] flex flex-col"
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
                  {lang === 'hi' ? 'पूर्व छात्र रोजगार अवसर पोस्ट करें' : 'Post an Opportunity'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                  <span className="hidden sm:inline">{lang === 'hi' ? 'एमसीयू समुदाय के लिए' : 'MCU Career Network'}</span>
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

        <form onSubmit={handleSubmit} className="p-6 pb-6 space-y-4 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll mcu-form-step-enter">
          <FormProgressBar
            percentage={postJobPercentage}
            completedFields={postJobCompleted}
            totalFields={postJobFields.length}
            title={lang === 'hi' ? 'अवसर पोस्टिंग प्रगति' : 'Job Opportunity Progress'}
            lang={lang}
          />
          {/* Computer Department Presets */}
          <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                <span>💻</span>
                <span>{lang === 'hi' ? 'कंप्यूटर विभाग त्वरित टेम्पलेट (Quick Tech Presets):' : 'Computer Dept Quick Presets:'}</span>
              </span>
              <span className="text-[10px] text-sky-700 font-semibold">{lang === 'hi' ? '1-क्लिक ऑटो-फिल' : '1-click fill'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyTechPreset(
                  'Full Stack Developer (React / Node / Go)',
                  'React, Node.js, Go, MySQL, Tailwind CSS, MCA / BCA',
                  'Seeking MCA / BCA / M.Sc Computer Science graduates for Full Stack Development. Strong understanding of React.js, Node.js REST APIs, database queries, and version control (Git).'
                )}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                💻 Full Stack Dev
              </button>

              <button
                type="button"
                onClick={() => applyTechPreset(
                  'Python & AI / Data Engineer',
                  'Python, Django, FastAPI, PostgreSQL, Data Science, AI/ML',
                  'Looking for Computer Science alumni with solid Python foundations, RESTful API building, data pipeline handling, and AI/ML model integration.'
                )}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                🐍 Python & AI
              </button>

              <button
                type="button"
                onClick={() => applyTechPreset(
                  'Cloud & DevOps Engineer (AWS / Docker)',
                  'AWS, Docker, Kubernetes, Linux, CI/CD, Git, Cloud',
                  'Manage cloud infrastructure, automated CI/CD pipelines, containerized deployments, and microservices reliability on AWS / Google Cloud.'
                )}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                ☁️ Cloud & DevOps
              </button>

              <button
                type="button"
                onClick={() => applyTechPreset(
                  'Junior Software Engineer (MCA / BCA Trainee)',
                  'MCA, BCA, Java, Python, SQL, Problem Solving, Freshers',
                  'Exciting opportunity for fresh MCA / BCA / B.Sc Computer Science batch graduates. Training on production web systems, debugging, and software testing will be provided.'
                )}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                🎓 MCA / BCA Fresher
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Job Title / Designation *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Full Stack Developer (React / Node / Go), Software Engineer, Cloud Architect"
              className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Company / Tech Enterprise *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. TCS, Infosys, Wipro, Google, Microsoft, Tech Startup"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Posted By (Your Name & Batch) *
              </label>
              <input
                type="text"
                required
                value={formData.postedBy}
                onChange={(e) => setFormData({ ...formData, postedBy: e.target.value })}
                placeholder="e.g. Manish Vishwakarma (MCA Batch of 2018)"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Job Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Bengaluru, Hyderabad, Pune, Indore, Noida / Remote"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Engagement Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
              >
                <option value="Full-time">Full-time</option>
                <option value="Fellowship / Contract">Fellowship / Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Experience Level *
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 0-2 Years (Freshers / MCA / BCA) or 3-5 Years"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Compensation / CTC
              </label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. ₹6 - 14 LPA or Stipend ₹25,000/mo"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Role Description & Requirements *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Seeking MCA / BCA / B.Tech / M.Sc Computer Science graduates. Roles involve React/Next.js frontend, Go/Node/Python REST APIs, Database design (MySQL/MongoDB), and cloud deployment..."
              className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00] resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Skills / Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g. React, Node.js, Python, MySQL, Cloud, MCA / BCA, Full Stack, Software"
              className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl btn-mcu-saffron text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Publish Opportunity'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
