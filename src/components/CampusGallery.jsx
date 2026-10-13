import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { campusMemories } from '../data/mockData';
import {
  Image as ImageIcon,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  PlusCircle,
  Trash2,
  ShieldCheck,
  Film,
  Play
} from 'lucide-react';
import { ScrollReveal, Tilt3DCard } from './ScrollReveal';
import { isVideoUrlOrData } from '../utils/imageProcessor';

export const CampusGallery = ({
  memories: externalMemories = null,
  isAdmin = false,
  onOpenAdminMemories = null,
  onDeleteMemory = null,
}) => {
  const { lang, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 memory archives per page (2 rows of 3 columns)

  const effectiveMemories = useMemo(() => {
    const raw =
      Array.isArray(externalMemories) && externalMemories.length > 0
        ? externalMemories
        : campusMemories;
    const duplicateEventIds = new Set([
      'mem-cult-1',
      'mem-cult-2',
      'mem-cult-3',
      'mem-alumni-1',
      'mem-alumni-2',
      'mem-alumni-3',
      'mem-alumni-4',
    ]);
    const seenSrc = new Set();
    return raw.filter((item) => {
      if (!item || duplicateEventIds.has(String(item.id))) return false;
      const key = item.videoUrl || item.image || '';
      if (!key || seenSrc.has(key)) return false;
      seenSrc.add(key);
      return true;
    });
  }, [externalMemories]);

  // Dynamically derive available years from memories (including Admin year-wise uploads)
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    effectiveMemories.forEach((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return;
      if (item.year) yearSet.add(String(item.year));
    });
    const sorted = Array.from(yearSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a.localeCompare(b);
    });
    return ['All', ...sorted];
  }, [effectiveMemories, selectedCategory]);

  const categories = useMemo(() => {
    const base = [
      {
        id: 'All',
        labelEn: `All Memories (${effectiveMemories.length})`,
        labelHi: `सभी स्मृतियां (${effectiveMemories.length})`,
      },
      { id: 'Library', labelEn: 'Nalanda Central Library', labelHi: 'नालंदा केंद्रीय ग्रंथालय' },
      { id: 'Studios', labelEn: 'Broadcast Studios', labelHi: 'स्टूडियो व प्रसारण' },
      { id: 'Media Labs', labelEn: 'Digital Media Labs', labelHi: 'डिजिटल मीडिया लैब' },
      { id: 'Auditorium', labelEn: 'Auditorium & Halls', labelHi: 'सभागार व परिसर' },
    ];
    if (effectiveMemories.some((m) => m.category === 'Spandan Fest')) {
      base.push({ id: 'Spandan Fest', labelEn: 'Cultural Spandan', labelHi: 'सांस्कृतिक स्पंदन' });
    }
    if (effectiveMemories.some((m) => m.category === 'Heritage')) {
      base.push({ id: 'Heritage', labelEn: 'Alumni Heritage', labelHi: 'धरोहर व स्थापना' });
    }
    return base;
  }, [effectiveMemories]);

  const filteredMemories = useMemo(() => {
    return effectiveMemories.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesYear = selectedYear === 'All' || String(item.year) === String(selectedYear);
      return matchesCat && matchesYear;
    });
  }, [effectiveMemories, selectedCategory, selectedYear]);

  // Reset to first page when category, year, or memory count changes
  useEffect(() => {
    setCurrentPage(1);
    setActivePhotoIndex(null);
  }, [selectedCategory, selectedYear, effectiveMemories.length]);

  const totalPages = Math.ceil(filteredMemories.length / itemsPerPage) || 1;

  // Paginated slice of memory archives
  const paginatedMemories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMemories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMemories, currentPage, itemsPerPage]);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handlePageChange = (page) => {
    if (page === '...' || page === currentPage) return;
    setCurrentPage(page);
    const frameEl = document.getElementById('gallery-frame-container');
    if (frameEl) {
      frameEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const activePhoto = activePhotoIndex !== null ? filteredMemories[activePhotoIndex] : null;

  // Zoom & Pan state for Lightbox Modal
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showCaption, setShowCaption] = useState(true);
  const hasMovedRef = useRef(false);

  // Reset zoom, pan & caption when active photo changes
  useEffect(() => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setShowCaption(true);
  }, [activePhotoIndex]);

  const handleZoomIn = (e) => {
    if (e) e.stopPropagation();
    setZoomScale((prev) => Math.min(3, +(prev + 0.5).toFixed(1)));
  };

  const handleZoomOut = (e) => {
    if (e) e.stopPropagation();
    setZoomScale((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomReset = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleToggleZoom = (e) => {
    if (e) e.stopPropagation();
    if (zoomScale === 1) {
      setZoomScale(2);
    } else {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  };

  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    hasMovedRef.current = false;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    e.preventDefault();
    hasMovedRef.current = true;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    hasMovedRef.current = false;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - panPosition.x,
      y: e.touches[0].clientY - panPosition.y,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    hasMovedRef.current = true;
    setPanPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (hasMovedRef.current) return;
    handleToggleZoom(e);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev + 1) % filteredMemories.length);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev - 1 + filteredMemories.length) % filteredMemories.length);
      } else if (e.key === '+' || e.key === '=') {
        setZoomScale((prev) => Math.min(3, +(prev + 0.5).toFixed(1)));
      } else if (e.key === '-' || e.key === '_') {
        setZoomScale((prev) => {
          const next = Math.max(1, +(prev - 0.5).toFixed(1));
          if (next === 1) setPanPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setZoomScale(1);
        setPanPosition({ x: 0, y: 0 });
        setIsDragging(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, filteredMemories.length]);

  return (
    <section id="gallery" className="py-20 relative z-10 bg-gradient-to-b from-[#f8fbff]/95 via-white/95 to-[#f0f9ff]/90 border-t border-sky-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-white via-sky-50 to-sky-100/90 text-[#0c4a6e] border border-sky-300/90 text-xs font-extrabold mb-3.5 shadow-[0_8px_20px_-4px_rgba(2,132,199,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)]">
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>{lang === 'hi' ? 'परिसर की यादें • mcu.ac.in' : 'Nostalgic Archives • mcu.ac.in'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003366] tracking-tight font-editorial">
              {t.sections.galleryTitle}
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
              {lang === 'hi'
                ? 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता विश्वविद्यालय के नालंदा ग्रंथालय, टीवी स्टूडियो, मीडिया लैब एवं स्पंदन की अनमोल यादें'
                : 'Authentic archival memories directly from official MCU website: Nalanda Central Library, TV studios, newsroom labs & Spandan fest'}
            </p>

            {isAdmin && onOpenAdminMemories && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onOpenAdminMemories}
                  className="px-4 py-2 rounded-xl btn-mcu-saffron text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {lang === 'hi'
                      ? '+ नया वर्षवार फोटो / वीडियो (5MB तक) अपलोड करें (Admin)'
                      : '+ Upload Year-wise Photo / Video (Max 5 MB) (Admin)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* 3D Water-Glass Category Filter Pills */}
        <ScrollReveal variant="fade-up" delay={60}>
          <div className="flex flex-wrap items-center justify-center gap-2 pb-2 mb-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedYear('All');
                  setActivePhotoIndex(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-b from-sky-500 via-blue-600 to-[#003366] text-white border-sky-300 shadow-[0_6px_16px_-3px_rgba(2,132,199,0.38),inset_0_1.5px_1px_rgba(255,255,255,0.4)]'
                    : 'bg-gradient-to-b from-white to-sky-50/80 text-slate-700 hover:text-[#003366] hover:border-sky-300 border-sky-200/90 shadow-[0_2px_6px_rgba(2,132,199,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                }`}
              >
                <span>{lang === 'hi' ? cat.labelHi : cat.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Year-wise Archive Filter Bar */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pb-3 mb-8">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100/80 text-[#003366] text-[11px] font-extrabold shrink-0">
              <Calendar className="w-3 h-3 text-[#fc4a00]" />
              <span>{lang === 'hi' ? 'वर्ष (Year):' : 'Year Archive:'}</span>
            </span>
            {availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setSelectedYear(yr);
                  setActivePhotoIndex(null);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedYear === yr
                    ? 'bg-gradient-to-r from-[#fc4a00] to-[#8d0303] text-white border-amber-300 shadow-xs'
                    : 'bg-white text-slate-700 hover:text-[#003366] border-sky-200/90 hover:border-sky-300'
                }`}
              >
                {yr === 'All' ? (lang === 'hi' ? 'सभी वर्ष (All Years)' : 'All Years') : yr}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Section 10: Campus Memories Enclosed Frame with Pagination */}
        <div id="gallery-frame-container" className="relative rounded-3xl border-2 border-sky-200/90 bg-gradient-to-b from-sky-50/70 via-white to-sky-50/60 p-4 sm:p-7 shadow-sm">

          {/* Frame Header Console */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 bg-gradient-to-b from-white via-sky-50/60 to-white rounded-2xl border border-sky-200/90 shadow-[0_6px_16px_-4px_rgba(2,132,199,0.1),inset_0_1.5px_1px_rgba(255,255,255,1)] text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)] animate-pulse" />
              <span className="text-[#002244] font-extrabold">
                {lang === 'hi' ? 'परिसर स्मृतियां फ्रेम' : 'Campus Memories Console'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">
                {lang === 'hi'
                  ? `पृष्ठ ${currentPage} पर ${paginatedMemories.length} छायाचित्र (कुल ${filteredMemories.length} स्मृतियां)`
                  : `Showing ${paginatedMemories.length} of ${filteredMemories.length} Archival Photos`}
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sky-900 font-mono text-[11px] font-extrabold bg-gradient-to-b from-white to-sky-100/80 px-3 py-1 rounded-xl border border-sky-300/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                <span>PAGE {currentPage} OF {totalPages}</span>
              </div>
            )}
          </div>

          {filteredMemories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {lang === 'hi' ? 'कोई छायाचित्र उपलब्ध नहीं' : 'No Photos Available'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {lang === 'hi' ? 'इस श्रेणी या वर्ष में कोई स्मृति नहीं मिली।' : 'No memories found in this category or year.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedMemories.map((photo, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                const isVideo = isVideoUrlOrData(photo);
                return (
                  <ScrollReveal key={photo.id} variant="tilt-in" delay={idx * 75}>
                    <Tilt3DCard intensity={7} className="h-full">
                      <div
                        onClick={() => setActivePhotoIndex(globalIdx)}
                        className="mcu-interactive-card h-full group relative rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-amber-400/50 cursor-pointer shadow-sm flex flex-col justify-between"
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-slate-900 relative">
                          {isVideo ? (
                            <video
                              src={photo.videoUrl || photo.image}
                              poster={photo.poster || undefined}
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              onMouseEnter={(e) => {
                                e.currentTarget.play().catch(() => {});
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                              }}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <img
                              src={photo.image}
                              alt={photo.title}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                if (photo.fallbackUrl && e.target.src !== photo.fallbackUrl) {
                                  e.target.src = photo.fallbackUrl;
                                }
                              }}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#002244] via-[#002244]/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity pointer-events-none" />

                          {/* Center Play Button Badge for Video Memories */}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-[#fc4a00]/90 text-white flex items-center justify-center shadow-lg border-2 border-white/80 group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                          )}

                          {/* Official Source Pill Top Left */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#680a13]/95 text-amber-200 text-[10px] font-bold border border-amber-300/30 shadow-xs">
                              {photo.uploaded_by_admin ? 'MCU Official Upload' : 'mcu.ac.in'}
                            </span>
                            {isVideo && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-600/95 text-white text-[10px] font-extrabold border border-rose-300/40 inline-flex items-center gap-1 shadow-xs">
                                <Film className="w-3 h-3" />
                                <span>VIDEO</span>
                              </span>
                            )}
                            {photo.campus && (
                              <span className="px-2 py-0.5 rounded-md bg-[#002855]/95 text-sky-200 text-[10px] font-bold border border-sky-300/30">
                                {photo.campus}
                              </span>
                            )}
                          </div>

                          {/* Zoom & Admin Delete Top Right */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {isAdmin && onDeleteMemory && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMemory(photo.id);
                                }}
                                className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
                                title={isVideo ? 'Delete Video (Admin)' : 'Delete Photo (Admin)'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-white/95 text-[#003366] shadow-sm">
                              {isVideo ? (
                                <Play className="w-4 h-4 text-[#fc4a00] fill-current" />
                              ) : (
                                <ZoomIn className="w-4 h-4 text-[#fc4a00]" />
                              )}
                            </div>
                          </div>

                          {/* Content Overlay */}
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#fc4a00] text-white shadow-xs">
                                {lang === 'hi' ? (photo.categoryHi || photo.category) : photo.category}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-black/45 text-[10px] text-amber-300 font-mono font-bold">
                                {photo.year}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white font-editorial truncate">
                              {lang === 'hi' ? (photo.hindiTitle || photo.title) : photo.title}
                            </h4>
                          </div>
                        </div>

                        {/* Description Below Card */}
                        <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-normal">
                            {lang === 'hi' ? (photo.descriptionHi || photo.description) : photo.description}
                          </p>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#003366] font-semibold">
                            <span>
                              {isVideo
                                ? lang === 'hi'
                                  ? 'वीडियो चलाएं (Click to play video)'
                                  : 'Click to play video'
                                : 'विस्तार से देखें (Click to expand)'}
                            </span>
                            <span className="text-[#fc4a00] group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      </div>
                    </Tilt3DCard>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

          {/* Frame Bottom Pagination Bar with Prev, Bullets/Pages 1 2 3 4, Next */}
          {filteredMemories.length > 0 && totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-amber-900/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Pagination Info */}
              <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
                {lang === 'hi' ? (
                  <span>
                    कुल <strong>{filteredMemories.length}</strong> में से{' '}
                    <strong className="text-[#003366]">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredMemories.length)}</strong> स्मृतियां • पृष्ठ{' '}
                    <strong className="text-[#fc4a00] font-bold">{currentPage}</strong> / <strong>{totalPages}</strong>
                  </span>
                ) : (
                  <span>
                    Showing <strong className="text-[#003366]">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredMemories.length)}</strong> of{' '}
                    <strong>{filteredMemories.length}</strong> Archival Photos • Page{' '}
                    <strong className="text-[#fc4a00] font-bold">{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>
                )}
              </div>

              {/* Pagination Action Controls: Prev, Bullets/Pages 1 2 3 4, Next */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    currentPage === 1
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-white hover:bg-amber-50 text-[#003366] hover:text-[#fc4a00] border border-slate-200 hover:border-amber-400 active:scale-95'
                  }`}
                  title={lang === 'hi' ? 'पिछला पृष्ठ' : 'Previous Page'}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'पिछला' : 'Previous'}</span>
                </button>

                {/* Bullets / Page Numbers: 1, 2, 3, 4 ... */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {getPageNumbers().map((pg, idx) => {
                    if (pg === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-bold text-xs select-none">
                          …
                        </span>
                      );
                    }
                    const isActive = currentPage === pg;
                    return (
                      <button
                        key={`page-${pg}`}
                        onClick={() => handlePageChange(pg)}
                        className={`min-w-[34px] sm:min-w-[38px] h-8 sm:h-9 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                          isActive
                            ? 'bg-gradient-to-r from-[#8d0303] to-[#fc4a00] text-white shadow-md shadow-red-950/20 ring-2 ring-amber-300 scale-105'
                            : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-[#003366] border border-slate-200 hover:border-amber-400 active:scale-95'
                        }`}
                        title={lang === 'hi' ? `पृष्ठ ${pg}` : `Page ${pg}`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    currentPage === totalPages
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-white hover:bg-amber-50 text-[#003366] hover:text-[#fc4a00] border border-slate-200 hover:border-amber-400 active:scale-95'
                  }`}
                  title={lang === 'hi' ? 'अगला पृष्ठ' : 'Next Page'}
                >
                  <span>{lang === 'hi' ? 'अगला' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Lightbox Modal with Fullscreen, Zoom Controls & Prev/Next Nav */}
      {activePhoto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
            onClick={() => setActivePhotoIndex(null)}
          >
            <div
              className="bg-slate-950/95 max-w-5xl xl:max-w-6xl w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative flex flex-col max-h-[96vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Image / Video Header */}
              <div
                className="relative flex-1 min-h-[60vh] max-h-[85vh] sm:max-h-[88vh] bg-slate-950 flex items-center justify-center overflow-hidden select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {isVideoUrlOrData(activePhoto) ? (
                  <video
                    key={activePhoto.id}
                    src={activePhoto.videoUrl || activePhoto.image}
                    poster={activePhoto.poster || undefined}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center overflow-hidden cursor-default"
                    onClick={handleImageClick}
                  >
                    <img
                      src={activePhoto.image}
                      alt={activePhoto.title}
                      onError={(e) => {
                        if (activePhoto.fallbackUrl && e.target.src !== activePhoto.fallbackUrl) {
                          e.target.src = activePhoto.fallbackUrl;
                        }
                      }}
                      draggable={false}
                      style={{
                        transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                      }}
                      className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                    />
                  </div>
                )}

                {/* Prev / Next Buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) => (prev - 1 + filteredMemories.length) % filteredMemories.length);
                  }}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-[#fc4a00] transition-colors shadow-lg cursor-pointer"
                  title="Previous (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) => (prev + 1) % filteredMemories.length);
                  }}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-[#fc4a00] transition-colors shadow-lg cursor-pointer"
                  title="Next (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Floating Zoom Controls Bar (Over Image) */}
                {!isVideoUrlOrData(activePhoto) && (
                  <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 sm:gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-950 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={zoomScale <= 1}
                      className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      title="Zoom Out (-) / ज़ूम घटाएं"
                      aria-label="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4 text-white" />
                    </button>

                    <button
                      type="button"
                      onClick={handleZoomReset}
                      className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-bold hover:bg-white/20 active:scale-95 transition-all text-amber-300 cursor-pointer"
                      title="Reset Zoom (100%) / सामान्य आकार"
                    >
                      {Math.round(zoomScale * 100)}%
                    </button>

                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={zoomScale >= 3}
                      className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      title="Zoom In (+) / ज़ूम बढ़ाएं"
                      aria-label="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>

                    {zoomScale > 1 && (
                      <button
                        type="button"
                        onClick={handleZoomReset}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-amber-300 transition-all cursor-pointer border-l border-white/20 pl-1.5 sm:pl-2 ml-0.5"
                        title="Reset Zoom (1x)"
                        aria-label="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Top Right Close & Admin Delete */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
                  {isAdmin && onDeleteMemory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetId = activePhoto.id;
                        setActivePhotoIndex(null);
                        onDeleteMemory(targetId);
                      }}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-rose-600/95 hover:bg-rose-700 text-white text-xs font-extrabold inline-flex items-center gap-1 shadow-lg cursor-pointer"
                      title="Delete from Memories (Admin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActivePhotoIndex(null)}
                    className="p-1.5 sm:p-2 rounded-full bg-slate-950/80 text-white hover:bg-[#fc4a00] transition-colors shadow-lg cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Counter Indicator */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 px-3 py-1 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 shadow-md border border-white/10">
                  <span>
                    {activePhotoIndex + 1} / {filteredMemories.length}
                  </span>
                  {isVideoUrlOrData(activePhoto) && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-black uppercase">
                      🎬 VIDEO
                    </span>
                  )}
                </div>

                {/* Transparent Glassmorphic Caption / Info Overlay at Bottom */}
                {showCaption ? (
                  <div
                    className="absolute bottom-0 inset-x-0 z-20 px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-transparent backdrop-blur-xs text-white flex flex-col gap-1.5 transition-all"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#003366] text-white border border-sky-400/30 shadow-xs">
                          {lang === 'hi' ? activePhoto.categoryHi : activePhoto.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#fc4a00]/20 text-[#fc4a00] border border-[#fc4a00]/40">
                          {activePhoto.year}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {activePhoto.fallbackUrl && (
                          <a
                            href={activePhoto.fallbackUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 border border-white/15 transition-colors"
                          >
                            <span>mcu.ac.in पर मूल छायाचित्र</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#fc4a00]" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowCaption(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Hide Caption"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white font-editorial tracking-wide drop-shadow-sm">
                      {lang === 'hi' ? activePhoto.hindiTitle : activePhoto.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-4xl drop-shadow-xs line-clamp-2 hover:line-clamp-none transition-all">
                      {lang === 'hi' ? activePhoto.descriptionHi : activePhoto.description}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCaption(true)}
                    className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 px-3 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Show Details"
                  >
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    <span>{lang === 'hi' ? activePhoto.hindiTitle || activePhoto.title : activePhoto.title}</span>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
