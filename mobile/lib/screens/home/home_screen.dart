import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/alumni_provider.dart';
import '../../providers/jobs_provider.dart';
import '../../providers/events_provider.dart';
import '../directory/alumni_directory_screen.dart';
import '../jobs/jobs_screen.dart';
import '../events/events_screen.dart';
import '../auth/login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final alumniProvider = context.watch<AlumniProvider>();
    final eventsProvider = context.watch<EventsProvider>();

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primaryNavy,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  'MCU',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MCU Alumni Portal',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryNavy,
                  ),
                ),
                Text(
                  'माखनलाल चतुर्वेदी विश्वविद्यालय, भोपाल',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (!authProvider.isAuthenticated)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: TextButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                },
                icon: const Icon(Icons.login, size: 16, color: AppColors.accentSaffron),
                label: const Text(
                  'Sign In',
                  style: TextStyle(
                    color: AppColors.accentSaffron,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Hero Section Banner
              _buildHeroBanner(context),

              // 2. Live Broadcast Ticker
              _buildLiveTicker(),

              // 3. Quick Action Grid
              _buildQuickActions(context),

              // 4. University Stats Grid (38,000+ Alumni)
              _buildStatsGrid(),

              // 5. Featured Upcoming Event
              _buildFeaturedEvent(context, eventsProvider),

              // 6. Recent Alumni Spotlight
              _buildAlumniSpotlight(context, alumniProvider),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroBanner(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
      decoration: const BoxDecoration(
        gradient: AppColors.heroGradient,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.stars, color: AppColors.goldAccent, size: 14),
                const SizedBox(width: 6),
                Text(
                  '35 Years of Media Excellence (1990 - 2026)',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.95),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'Where Indian Media Finds Its Voice & Conscience',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Connecting over 38,000+ journalists, broadcasters, editors, and tech pioneers across the globe.',
            style: TextStyle(
              fontSize: 13,
              color: Colors.white.withOpacity(0.85),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                    );
                  },
                  icon: const Icon(Icons.search, size: 18),
                  label: const Text('Find Alumni'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentSaffron,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const JobsScreen()),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white, width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Browse Jobs'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLiveTicker() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: const Color(0xFFFEF3C7),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: AppColors.accentSaffron,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'LIVE: 38,000+ Makhanlal alumni active worldwide across newsrooms & tech',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Colors.amber.shade900,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      {'icon': Icons.people, 'title': 'Directory', 'color': const Color(0xFF0284C7)},
      {'icon': Icons.work, 'title': 'Jobs Hub', 'color': AppColors.accentSaffron},
      {'icon': Icons.calendar_today, 'title': 'Conclaves', 'color': const Color(0xFF10B981)},
      {'icon': Icons.school, 'title': 'Mentorship', 'color': const Color(0xFF8B5CF6)},
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: actions.map((item) {
          final color = item['color'] as Color;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                if (item['title'] == 'Directory' || item['title'] == 'Mentorship') {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                  );
                } else if (item['title'] == 'Jobs Hub') {
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
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(item['icon'] as IconData, color: color, size: 20),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item['title'] as String,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
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

  Widget _buildStatsGrid() {
    final stats = [
      {'val': '38,000+', 'label': 'Global Alumni', 'hindi': 'वैश्विक पूर्व छात्र'},
      {'val': '650+', 'label': 'Media Partners', 'hindi': 'मीडिया संस्थान'},
      {'val': '34+', 'label': 'Glorious Batches', 'hindi': 'गौरवशाली बैच'},
      {'val': '28+', 'label': 'Countries', 'hindi': 'देशों में सक्रिय'},
    ];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'University Impact Metrics',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.primaryNavy,
            ),
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: stats.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.1,
            ),
            itemBuilder: (context, index) {
              final s = stats[index];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      s['val']!,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primaryNavy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      s['label']!,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedEvent(BuildContext context, EventsProvider eventsProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Upcoming Conclave',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryNavy,
                ),
              ),
              GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const EventsScreen()),
                  );
                },
                child: const Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.accentSaffron,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (eventsProvider.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (eventsProvider.events.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.accentSaffron.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          eventsProvider.events.first.category,
                          style: const TextStyle(
                            color: AppColors.accentSaffron,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.location_on, size: 14, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        eventsProvider.events.first.venue,
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    eventsProvider.events.first.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryNavy,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    eventsProvider.events.first.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '📅 ${eventsProvider.events.first.eventDate}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                      Text(
                        '${eventsProvider.events.first.rsvpCount} Attending',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.info,
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

  Widget _buildAlumniSpotlight(BuildContext context, AlumniProvider alumniProvider) {
    final list = alumniProvider.allAlumni;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Alumni In The Spotlight',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryNavy,
                ),
              ),
              GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                  );
                },
                child: const Text(
                  'Explore Directory',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.accentSaffron,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (alumniProvider.isLoading)
            const Center(child: CircularProgressIndicator())
          else
            SizedBox(
              height: 170,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: list.length.clamp(0, 5),
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final alum = list[index];
                  return Container(
                    width: 140,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppColors.primaryNavy.withOpacity(0.1),
                          backgroundImage: alum.avatarUrl != null
                              ? NetworkImage(alum.avatarUrl!)
                              : null,
                          child: alum.avatarUrl == null
                              ? Text(
                                  alum.name.isNotEmpty ? alum.name[0] : 'A',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryNavy,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          alum.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          alum.company,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primaryNavy.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Batch of ${alum.batchYear}',
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primaryNavy,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
