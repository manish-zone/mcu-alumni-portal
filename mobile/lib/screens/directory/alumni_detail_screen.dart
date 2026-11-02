import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../models/alumni_model.dart';

class AlumniDetailScreen extends StatelessWidget {
  final AlumniModel alumnus;

  const AlumniDetailScreen({super.key, required this.alumnus});

  Future<void> _launchLinkedIn(BuildContext context) async {
    final urlStr = alumnus.linkedinUrl;
    if (urlStr != null && urlStr.isNotEmpty) {
      final uri = Uri.tryParse(urlStr);
      if (uri != null && await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    }
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('LinkedIn profile link not available for this alumnus.')),
    );
  }

  void _showMentorshipModal(BuildContext context) {
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
                  const Text(
                    'Request 1-on-1 Mentorship',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryNavy,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Connect with ${alumnus.name} for career guidance and portfolio reviews.',
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Discussion Topic (e.g. Media Production / Tech / Newsroom)',
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Your Message & Background',
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
                        content: Text('Mentorship request sent to ${alumnus.name}!'),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentSaffron,
                  ),
                  child: const Text('Send Mentorship Request'),
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Alumnus Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 46,
                    backgroundColor: AppColors.primaryNavy.withOpacity(0.1),
                    backgroundImage: alumnus.avatarUrl != null
                        ? NetworkImage(alumnus.avatarUrl!)
                        : null,
                    child: alumnus.avatarUrl == null
                        ? Text(
                            alumnus.name.isNotEmpty ? alumnus.name[0] : 'A',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryNavy,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        alumnus.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primaryNavy,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.verified, size: 20, color: AppColors.success),
                    ],
                  ),
                  if (alumnus.hindiName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      alumnus.hindiName!,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary.withOpacity(0.9),
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    alumnus.currentRole,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    alumnus.company,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryLight,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.location_on, size: 14, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        alumnus.location,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _launchLinkedIn(context),
                          icon: const Icon(Icons.link, size: 18),
                          label: const Text('LinkedIn Profile'),
                        ),
                      ),
                      if (alumnus.openToMentor) ...[
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _showMentorshipModal(context),
                            icon: const Icon(Icons.school, size: 18),
                            label: const Text('Get Mentored'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accentSaffron,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Academic Credentials
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'University Academic Credentials',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryNavy,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(Icons.school_outlined, 'Department', alumnus.department),
                  _buildDetailRow(Icons.calendar_today_outlined, 'Alumni Batch', 'Batch of ${alumnus.batchYear}'),
                  _buildDetailRow(Icons.account_balance_outlined, 'Campus', alumnus.campus),
                  if (alumnus.degree != null)
                    _buildDetailRow(Icons.workspace_premium_outlined, 'Degree', alumnus.degree!),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Skills & Specializations
            if (alumnus.skills.isNotEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Skills & Industry Expertise',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryNavy,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: alumnus.skills.map((s) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.primaryNavy.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.primaryNavy.withOpacity(0.12)),
                          ),
                          child: Text(
                            s,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primaryNavy,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String title, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.primaryNavy),
          const SizedBox(width: 10),
          Text(
            '$title: ',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
          ),
          Expanded(
            child: Text(
              val,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}
