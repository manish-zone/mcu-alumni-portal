import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/language_provider.dart';
import '../../providers/alumni_provider.dart';
import '../../providers/jobs_provider.dart';
import '../../providers/events_provider.dart';
import '../../widgets/mcu_app_bar.dart';
import '../../widgets/mcu_animated_crest.dart';
import '../../widgets/mcu_live_marquee.dart';
import '../../widgets/stat_counter_card.dart';
import '../directory/alumni_directory_screen.dart';
import '../directory/alumni_detail_screen.dart';
import '../jobs/jobs_screen.dart';
import '../events/events_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    final alumniProvider = context.watch<AlumniProvider>();
    final eventsProvider = context.watch<EventsProvider>();
    final isHindi = langProvider.isHindi;

    return Scaffold(
      appBar: const MCUAppBar(),
      body: RefreshIndicator(
        color: AppColors.accentSaffron,
        backgroundColor: Colors.white,
        onRefresh: () async {
          await alumniProvider.fetchAlumni();
          if (!context.mounted) return;
          await context.read<JobsProvider>().fetchJobs();
          if (!context.mounted) return;
          await context.read<EventsProvider>().fetchEvents();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 1. Dual Marquee Tickers (Notice & Live Network Ticker)
              MCULiveMarquee(
                text: isHindi
                    ? '📢 अभ्युदय 2026: 35वां राष्ट्रीय पूर्व छात्र महाकुंभ पंजीयन प्रारंभ • सभागार, भोपाल'
                    : '📢 Abhyuday 2026: 35th National Alumni Conclave Delegate RSVP Now Open',
                badgeText: isHindi ? 'आधिकारिक सूचना' : 'OFFICIAL NOTICE',
                isNotice: true,
              ),
              MCULiveMarquee(
                text: langProvider.liveTicker,
                badgeText: isHindi ? 'लाइव नेटवर्क' : 'LIVE NETWORK',
                isNotice: false,
              ),

              // 2. Main Executive Pearl-Sky Hero Section
              _buildHeroSection(context, langProvider, isHindi),

              // 3. Four 3D Sculpted Stat Counter Cards
              _buildStatsGrid(langProvider, isHindi),

              // 4. Quick Action Feature Hub
              _buildQuickActionGrid(context, isHindi),

              // 5. Featured Conclave Spotlight Card
              _buildFeaturedConclave(context, eventsProvider, isHindi),

              // 6. Alumni In The Spotlight
              _buildAlumniSpotlight(context, alumniProvider, isHindi),

              // 7. University Emblem & Footer
              _buildUniversityFooter(langProvider, isHindi),

              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection(
    BuildContext context,
    LanguageProvider langProvider,
    bool isHindi,
  ) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: AppColors.pearlBgGradient,
        border: Border(
          bottom: BorderSide(color: AppColors.glassBorder, width: 1),
        ),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background Tech Grid Lines
          Positioned.fill(
            child: Opacity(
              opacity: 0.04,
              child: Image.asset(
                'assets/images/mcu-logo.png',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 26),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // 3D Animated Sacred Orbital MCU Crest
                const MCUAnimatedCrest(size: 104),

                const SizedBox(height: 16),

                // Royal Heritage Seal Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        AppColors.royalNavyDark,
                        AppColors.primaryNavy,
                        AppColors.royalCrimson,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.glassBorder.withValues(alpha: 0.6)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.royalNavyDark.withValues(alpha: 0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars, color: AppColors.goldAccent, size: 14),
                      const SizedBox(width: 6),
                      Text(
                        langProvider.heroBadge,
                        style: const TextStyle(
                          color: AppColors.goldLightBg,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // Main Editorial Headline
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.royalNavyDark,
                      fontFamily: 'serif',
                      height: 1.25,
                      letterSpacing: -0.4,
                    ),
                    children: [
                      TextSpan(text: '${langProvider.heroPrefix} '),
                      TextSpan(
                        text: langProvider.heroHighlight,
                        style: const TextStyle(
                          color: AppColors.accentSaffron,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // University Description
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    langProvider.heroDescription,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textSecondary.withValues(alpha: 0.95),
                      height: 1.45,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),

                const SizedBox(height: 22),

                // 3D Sculpted Action CTAs Hierarchy (Matching Website Mobile Design)
                // 1. Primary Hero Action: Explore Alumni Directory (Full Width, Perfectly Centered)
                Container(
                  width: double.infinity,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF6A00), Color(0xFFFC4A00), Color(0xFFB91C1C)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accentSaffron.withValues(alpha: 0.38),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const Icon(Icons.people_alt_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              isHindi ? 'पूर्व छात्र निर्देशिका देखें' : 'Explore Alumni Directory',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // 2. Dual Secondary Actions: Browse Jobs & Find a Mentor (Side-by-side, Equal Height, Perfectly Centered)
                Row(
                  children: [
                    // Browse Jobs (Water-Glass White Style)
                    Expanded(
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.glassBorder, width: 1.5),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.skyAccent.withValues(alpha: 0.08),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const JobsScreen()),
                              );
                            },
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                const Icon(Icons.work_outline_rounded, size: 16, color: AppColors.royalNavyDark),
                                const SizedBox(width: 6),
                                Text(
                                  isHindi ? 'रोजगार अवसर' : 'Browse Jobs',
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.royalNavyDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Find a Mentor (Royal Crimson Style)
                    Expanded(
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF8D0303), Color(0xFF680A13)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFDE68A).withValues(alpha: 0.35), width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF680A13).withValues(alpha: 0.22),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                              );
                            },
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                const Icon(Icons.explore_rounded, size: 16, color: AppColors.goldAccent),
                                const SizedBox(width: 6),
                                Text(
                                  isHindi ? 'मेंटर खोजें' : 'Find a Mentor',
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(LanguageProvider langProvider, bool isHindi) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 10),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.25,
        children: [
          StatCounterCard(
            value: langProvider.alumniCount,
            label: 'GLOBAL ALUMNI',
            hindiLabel: 'वैश्विक पूर्व छात्र',
            isHindi: isHindi,
            icon: Icons.groups,
            iconColor: AppColors.accentSaffron,
          ),
          StatCounterCard(
            value: '650+',
            label: 'MEDIA PARTNERS',
            hindiLabel: 'मीडिया संस्थान',
            isHindi: isHindi,
            icon: Icons.business,
            iconColor: AppColors.royalCrimson,
          ),
          StatCounterCard(
            value: '34+',
            label: 'GLORIOUS BATCHES',
            hindiLabel: 'गौरवशाली बैच',
            isHindi: isHindi,
            icon: Icons.school,
            iconColor: AppColors.goldDark,
          ),
          StatCounterCard(
            value: '28+',
            label: 'COUNTRIES',
            hindiLabel: 'देशों में सक्रिय',
            isHindi: isHindi,
            icon: Icons.public,
            iconColor: AppColors.primaryNavy,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionGrid(BuildContext context, bool isHindi) {
    final actions = [
      {
        'title': isHindi ? 'निर्देशिका' : 'Directory',
        'sub': isHindi ? 'पूर्व छात्र खोजें' : 'Global Search',
        'icon': Icons.people,
        'color': AppColors.skyAccent,
        'route': 'directory',
      },
      {
        'title': isHindi ? 'रोजगार हब' : 'Jobs Hub',
        'sub': isHindi ? 'रेफरल अवसर' : 'Referral Portal',
        'icon': Icons.work,
        'color': AppColors.accentSaffron,
        'route': 'jobs',
      },
      {
        'title': isHindi ? 'महाकुंभ 2026' : 'Abhyuday 2026',
        'sub': isHindi ? 'राष्ट्रीय सम्मेलन' : 'Conclaves & RSVP',
        'icon': Icons.event,
        'color': AppColors.successGreen,
        'route': 'events',
      },
      {
        'title': isHindi ? 'मार्गदर्शन' : 'Mentorship',
        'sub': isHindi ? '1-on-1 मेंटर' : 'Industry Guides',
        'icon': Icons.school,
        'color': const Color(0xFF8B5CF6),
        'route': 'directory',
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: actions.map((item) {
          final color = item['color'] as Color;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                final route = item['route'] as String;
                if (route == 'directory') {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                  );
                } else if (route == 'jobs') {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const JobsScreen()),
                  );
                } else {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const EventsScreen()),
                  );
                }
              },
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.glassBorder.withValues(alpha: 0.6)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.skyAccent.withValues(alpha: 0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(item['icon'] as IconData, color: color, size: 18),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item['title'] as String,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.royalNavyDark,
                      ),
                    ),
                    Text(
                      item['sub'] as String,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 9,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFeaturedConclave(
    BuildContext context,
    EventsProvider eventsProvider,
    bool isHindi,
  ) {
    if (eventsProvider.events.isEmpty) return const SizedBox.shrink();
    final ev = eventsProvider.events.first;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isHindi ? 'वार्षिक महाकुंभ एवं संगोष्ठी' : 'Featured National Conclave',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: AppColors.royalNavyDark,
                  fontFamily: 'serif',
                ),
              ),
              GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const EventsScreen()),
                  );
                },
                child: Text(
                  isHindi ? 'सभी देखें →' : 'View All →',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.accentSaffron,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.glassBorder),
              boxShadow: [
                BoxShadow(
                  color: AppColors.skyAccent.withValues(alpha: 0.1),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Saffron Accent Bar
                  Container(height: 3, color: AppColors.accentSaffron),

                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                gradient: AppColors.saffronBadgeGradient,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                ev.category.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                            const Spacer(),
                            const Icon(Icons.location_on, size: 14, color: AppColors.crimsonRed),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                ev.venue,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          isHindi && ev.hindiTitle != null ? ev.hindiTitle! : ev.title,
                          style: const TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w900,
                            color: AppColors.royalNavyDark,
                            fontFamily: 'serif',
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          ev.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 13, color: AppColors.primaryNavy),
                                const SizedBox(width: 5),
                                Text(
                                  ev.eventDate,
                                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                            Text(
                              '${ev.rsvpCount} ${isHindi ? 'पंजीकृत' : 'Attending'}',
                              style: const TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.skyAccent,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: AppColors.royalNavyDark,
                                  content: Text(
                                    isHindi
                                        ? 'अभ्युदय 2026 में आपकी सहभागिता की पुष्टि हो गई है!'
                                        : 'RSVP confirmed for Abhyuday 2026!',
                                  ),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accentSaffron,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              isHindi ? 'महाकुंभ हेतु RSVP दर्ज करें' : 'Confirm RSVP Attendance',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlumniSpotlight(
    BuildContext context,
    AlumniProvider alumniProvider,
    bool isHindi,
  ) {
    final list = alumniProvider.allAlumni;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isHindi ? 'प्रमुख पूर्व छात्र' : 'Alumni In The Spotlight',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: AppColors.royalNavyDark,
                  fontFamily: 'serif',
                ),
              ),
              GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                  );
                },
                child: Text(
                  isHindi ? 'निर्देशिका खोलें →' : 'Explore All →',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.accentSaffron,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 175,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: list.length.clamp(0, 6),
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final alum = list[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => AlumniDetailScreen(alumnus: alum)),
                    );
                  },
                  child: Container(
                    width: 144,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.glassBorder.withValues(alpha: 0.6)),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.skyAccent.withValues(alpha: 0.06),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppColors.primaryNavy.withValues(alpha: 0.1),
                          backgroundImage: alum.avatarUrl != null
                              ? NetworkImage(alum.avatarUrl!)
                              : null,
                          child: alum.avatarUrl == null
                              ? Text(
                                  alum.name.isNotEmpty ? alum.name[0] : 'A',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.royalNavyDark,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isHindi && alum.hindiName != null ? alum.hindiName! : alum.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: AppColors.royalNavyDark,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          alum.company,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.accentSaffron,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.royalNavyDark.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Batch of ${alum.batchYear}',
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: AppColors.royalNavyDark,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUniversityFooter(LanguageProvider langProvider, bool isHindi) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppColors.royalNavyDark,
      ),
      child: Column(
        children: [
          Image.asset(
            'assets/images/mcu-logo.png',
            height: 48,
            errorBuilder: (_, __, ___) => const Icon(Icons.school, color: Colors.white, size: 40),
          ),
          const SizedBox(height: 12),
          Text(
            langProvider.universityName,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w900,
              fontFamily: 'serif',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isHindi
                ? 'एशिया का प्रथम राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय • स्थापना 1990'
                : "Asia's First National Journalism & Communication University • Estd. 1990",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.75),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Bishankhedi, Bhopal, Madhya Pradesh 462044',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
