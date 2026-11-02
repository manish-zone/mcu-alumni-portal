import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/events_provider.dart';
import '../../providers/memories_provider.dart';

class EventsScreen extends StatelessWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final eventsProvider = context.watch<EventsProvider>();
    final memoriesProvider = context.watch<MemoriesProvider>();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Conclaves & Campus Memories'),
          bottom: const TabBar(
            labelColor: AppColors.primaryNavy,
            indicatorColor: AppColors.accentSaffron,
            indicatorWeight: 3,
            labelStyle: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            tabs: [
              Tab(text: 'Upcoming Conclaves'),
              Tab(text: 'Campus Memories'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Tab 1: Conclaves & Reunions
            eventsProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: eventsProvider.events.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final ev = eventsProvider.events[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (ev.bannerUrl != null && ev.bannerUrl!.isNotEmpty)
                              CachedNetworkImage(
                                imageUrl: ev.bannerUrl!,
                                height: 160,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => Container(
                                  height: 160,
                                  color: AppColors.primaryNavy.withOpacity(0.08),
                                ),
                                errorWidget: (_, __, ___) => const SizedBox.shrink(),
                              ),
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
                                          color: AppColors.accentSaffron.withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          ev.badgeText ?? 'Official MCU Event',
                                          style: const TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.accentSaffron,
                                          ),
                                        ),
                                      ),
                                      const Spacer(),
                                      Text(
                                        '${ev.rsvpCount} Attending',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.info,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    ev.title,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primaryNavy,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    ev.description,
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      const Icon(Icons.calendar_month, size: 14, color: AppColors.primaryNavy),
                                      const SizedBox(width: 6),
                                      Text(ev.eventDate, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textMuted),
                                      const SizedBox(width: 6),
                                      Text(ev.venue, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: () {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            backgroundColor: AppColors.primaryNavy,
                                            content: Text('RSVP confirmed for ${ev.title}!'),
                                          ),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.accentSaffron,
                                      ),
                                      child: const Text('Confirm RSVP Attendance'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

            // Tab 2: Campus Memories Photo Archive
            memoriesProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: memoriesProvider.memories.length,
                    itemBuilder: (context, index) {
                      final m = memoriesProvider.memories[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: CachedNetworkImage(
                                imageUrl: m.imageUrl,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => Container(color: AppColors.primaryNavy.withOpacity(0.08)),
                                errorWidget: (_, __, ___) => const Center(child: Icon(Icons.image)),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    m.title,
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Year ${m.academicYear} • ${m.category}',
                                    style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }
}
