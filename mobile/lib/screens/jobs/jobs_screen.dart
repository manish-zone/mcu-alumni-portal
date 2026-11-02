import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/job_model.dart';
import '../../providers/jobs_provider.dart';

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

  static const List<String> filters = ['All', 'Full-time', 'Internship', 'Remote'];

  void _showApplyModal(BuildContext context, JobModel job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Apply for ${job.title}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryNavy,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              Text(
                'at ${job.company} • ${job.location}',
                style: const TextStyle(fontSize: 13, color: AppColors.primaryLight, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Candidate Full Name',
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Portfolio / Resume / LinkedIn Link',
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: 'Why are you a great fit for this referral?',
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: AppColors.primaryNavy,
                        content: Text('Referral application submitted for ${job.title}!'),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentSaffron,
                  ),
                  child: const Text('Submit Application'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final jobsProvider = context.watch<JobsProvider>();
    final jobs = jobsProvider.filteredJobs;
    final currentFilter = jobsProvider.selectedFilter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Career & Referral Hub'),
      ),
      body: Column(
        children: [
          // Filter Chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              scrollDirection: Axis.horizontal,
              itemCount: filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final f = filters[index];
                final isSelected = currentFilter == f;
                return ChoiceChip(
                  label: Text(f),
                  selected: isSelected,
                  onSelected: (_) {
                    jobsProvider.setFilter(f);
                  },
                  selectedColor: AppColors.primaryNavy,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                  backgroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(
                      color: isSelected ? AppColors.primaryNavy : AppColors.cardBorder,
                    ),
                  ),
                );
              },
            ),
          ),

          // Jobs List
          Expanded(
            child: jobs.isEmpty
                ? const Center(child: Text('No job openings match this filter.'))
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: jobs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final job = jobs[index];
                      return Container(
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        job.title,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primaryNavy,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        job.company,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primaryLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryNavy.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    job.jobType,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primaryNavy,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textMuted),
                                const SizedBox(width: 4),
                                Text(job.location, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                const SizedBox(width: 14),
                                const Icon(Icons.payments_outlined, size: 14, color: AppColors.textMuted),
                                const SizedBox(width: 4),
                                Text(job.salary, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              job.description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                            if (job.referralAlumnusName != null) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF7ED),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFFED7AA)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.verified_user, size: 14, color: AppColors.accentSaffron),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        'Referred by: ${job.referralAlumnusName}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFFC2410C),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 14),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () => _showApplyModal(context, job),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryNavy,
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                ),
                                child: const Text('Request Alumnus Referral'),
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
