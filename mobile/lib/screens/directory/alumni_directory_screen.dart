import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/alumni_model.dart';
import '../../providers/alumni_provider.dart';
import 'alumni_detail_screen.dart';

class AlumniDirectoryScreen extends StatelessWidget {
  const AlumniDirectoryScreen({super.key});

  static const List<String> departments = [
    'All',
    'Journalism & New Media',
    'Computer Applications & Media Tech',
    'Electronic Media & Cinema',
    'Public Relations & Advertising',
  ];

  @override
  Widget build(BuildContext context) {
    final alumniProvider = context.watch<AlumniProvider>();
    final filteredAlumni = alumniProvider.filteredAlumni;
    final currentDept = alumniProvider.selectedDepartment;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Global Alumni Directory'),
      ),
      body: Column(
        children: [
          // 1. Search Box
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              onChanged: (val) {
                alumniProvider.setSearchQuery(val);
              },
              decoration: InputDecoration(
                hintText: 'Search by name, company, batch or city...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    alumniProvider.setSearchQuery('');
                  },
                ),
              ),
            ),
          ),

          // 2. Department Horizontal Filter Chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              scrollDirection: Axis.horizontal,
              itemCount: departments.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final dept = departments[index];
                final isSelected = currentDept == dept;
                return ChoiceChip(
                  label: Text(dept),
                  selected: isSelected,
                  onSelected: (_) {
                    alumniProvider.setDepartment(dept);
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

          // 3. Search Results Count
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Showing ${filteredAlumni.length} verified alumni',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                  ),
                ),
                const Row(
                  children: [
                    Icon(Icons.verified, size: 14, color: AppColors.success),
                    SizedBox(width: 4),
                    Text(
                      'Official MCU Roster',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 4. Alumni List
          Expanded(
            child: filteredAlumni.isEmpty
                ? _buildEmptyState()
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: filteredAlumni.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final alum = filteredAlumni[index];
                      return _buildAlumniCard(context, alum);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_search_outlined, size: 64, color: AppColors.textMuted.withOpacity(0.5)),
          const SizedBox(height: 12),
          const Text(
            'No matching alumni found',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Try adjusting your search keywords or department filter.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildAlumniCard(BuildContext context, AlumniModel alum) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => AlumniDetailScreen(alumnus: alum)),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppColors.primaryNavy.withOpacity(0.1),
                  backgroundImage:
                      alum.avatarUrl != null ? NetworkImage(alum.avatarUrl!) : null,
                  child: alum.avatarUrl == null
                      ? Text(
                          alum.name.isNotEmpty ? alum.name[0] : 'A',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryNavy,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              alum.name,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryNavy,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.verified, size: 16, color: AppColors.success),
                        ],
                      ),
                      if (alum.hindiName != null && alum.hindiName!.isNotEmpty)
                        Text(
                          alum.hindiName!,
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary.withOpacity(0.8)),
                        ),
                      const SizedBox(height: 4),
                      Text(
                        '${alum.currentRole} • ${alum.company}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 13, color: AppColors.textMuted),
                          const SizedBox(width: 2),
                          Text(
                            alum.location,
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '•  Batch of ${alum.batchYear}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primaryNavy,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (alum.skills.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: alum.skills.take(3).map((skill) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Text(
                      skill,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                    ),
                  );
                }).toList(),
              ),
            ],
            if (alum.openToMentor) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.school, size: 13, color: Color(0xFF047857)),
                    SizedBox(width: 6),
                    Text(
                      'Open to Mentor Students & Juniors',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF047857),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
