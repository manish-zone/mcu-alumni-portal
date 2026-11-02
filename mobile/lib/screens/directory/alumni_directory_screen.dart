import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/alumni_model.dart';
import '../../providers/alumni_provider.dart';
import '../../providers/language_provider.dart';
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
    final langProvider = context.watch<LanguageProvider>();
    final alumniProvider = context.watch<AlumniProvider>();
    final filteredAlumni = alumniProvider.filteredAlumni;
    final currentDept = alumniProvider.selectedDepartment;
    final isHindi = langProvider.isHindi;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          langProvider.directoryTitle,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w900,
            color: AppColors.royalNavyDark,
            fontFamily: 'serif',
          ),
        ),
      ),
      body: Column(
        children: [
          // Section Subtitle (CMS Text from Website)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppColors.bgPearlLight,
            child: Text(
              langProvider.directorySubtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ),

          // 1. Search Box (Water-Glass Style)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: TextField(
              onChanged: (val) {
                alumniProvider.setSearchQuery(val);
              },
              decoration: InputDecoration(
                hintText: isHindi
                    ? 'नाम, कंपनी, बैच या शहर द्वारा खोजें...'
                    : 'Search alumni by name, newsroom, batch or city...',
                prefixIcon: const Icon(Icons.search, color: AppColors.accentSaffron, size: 20),
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
                  selectedColor: AppColors.royalNavyDark,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontSize: 11.5,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  ),
                  backgroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(
                      color: isSelected ? AppColors.royalNavyDark : AppColors.glassBorder,
                    ),
                  ),
                );
              },
            ),
          ),

          // 3. Search Results Count & Verification Pill
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isHindi
                      ? '${filteredAlumni.length} सत्यापित पूर्व छात्र मिले'
                      : 'Showing ${filteredAlumni.length} verified alumni',
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.royalNavyDark,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.verified, size: 12, color: AppColors.successGreen),
                      SizedBox(width: 4),
                      Text(
                        'Verified MCU Network',
                        style: TextStyle(
                          fontSize: 10,
                          color: Color(0xFF047857),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 4. Alumni List
          Expanded(
            child: filteredAlumni.isEmpty
                ? _buildEmptyState(isHindi)
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: filteredAlumni.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final alum = filteredAlumni[index];
                      return _buildAlumniCard(context, alum, isHindi);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isHindi) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_search_outlined, size: 64, color: AppColors.textMuted.withValues(alpha: 0.5)),
          const SizedBox(height: 12),
          Text(
            isHindi ? 'कोई पूर्व छात्र नहीं मिले' : 'No matching alumni found',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.royalNavyDark),
          ),
          const SizedBox(height: 4),
          Text(
            isHindi ? 'कृपया दूसरा कीवर्ड या विभाग चुनकर देखें।' : 'Try adjusting your search keywords or department filter.',
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildAlumniCard(BuildContext context, AlumniModel alum, bool isHindi) {
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
          border: Border.all(color: AppColors.glassBorder.withValues(alpha: 0.6)),
          boxShadow: [
            BoxShadow(
              color: AppColors.skyAccent.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, 3),
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
                  backgroundColor: AppColors.primaryNavy.withValues(alpha: 0.08),
                  backgroundImage:
                      alum.avatarUrl != null ? NetworkImage(alum.avatarUrl!) : null,
                  child: alum.avatarUrl == null
                      ? Text(
                          alum.name.isNotEmpty ? alum.name[0] : 'A',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.royalNavyDark,
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
                              isHindi && alum.hindiName != null ? alum.hindiName! : alum.name,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: AppColors.royalNavyDark,
                                fontFamily: 'serif',
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.verified, size: 16, color: AppColors.successGreen),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${alum.currentRole} • ${alum.company}',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accentSaffron,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
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
                              fontWeight: FontWeight.w800,
                              color: AppColors.royalNavyDark,
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
                      color: AppColors.bgPearlLight,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: Text(
                      skill,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
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
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.school, size: 13, color: Color(0xFF047857)),
                    const SizedBox(width: 6),
                    Text(
                      isHindi ? 'विद्यार्थी मार्गदर्शन हेतु उपलब्ध' : 'Open to Mentor Students & Juniors',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
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
