class AlumniModel {
  final int id;
  final int? userId;
  final String name;
  final String? hindiName;
  final String email;
  final int batchYear;
  final String? degree;
  final String department;
  final String campus;
  final String currentRole;
  final String company;
  final String location;
  final String? bio;
  final String? avatarUrl;
  final String? linkedinUrl;
  final bool openToMentor;
  final List<String> skills;
  final bool isVerified;

  AlumniModel({
    required this.id,
    this.userId,
    required this.name,
    this.hindiName,
    required this.email,
    required this.batchYear,
    this.degree,
    required this.department,
    required this.campus,
    required this.currentRole,
    required this.company,
    required this.location,
    this.bio,
    this.avatarUrl,
    this.linkedinUrl,
    this.openToMentor = false,
    this.skills = const [],
    this.isVerified = true,
  });

  factory AlumniModel.fromJson(Map<String, dynamic> json) {
    List<String> parseSkills(dynamic raw) {
      if (raw is List) {
        return raw.map((e) => e.toString()).toList();
      }
      return [];
    }

    int parseInt(dynamic val) {
      if (val is int) return val;
      if (val is String) return int.tryParse(val) ?? 0;
      return 0;
    }

    return AlumniModel(
      id: parseInt(json['id'] ?? 0),
      userId: json['user_id'] != null ? parseInt(json['user_id']) : null,
      name: json['name']?.toString() ??
          json['full_name']?.toString() ??
          '${json['first_name'] ?? ''} ${json['last_name'] ?? ''}'.trim(),
      hindiName: json['hindi_name']?.toString() ?? json['hindiName']?.toString(),
      email: json['email']?.toString() ?? '',
      batchYear: parseInt(json['batch_year'] ?? json['batch'] ?? 2020),
      degree: json['degree']?.toString() ?? 'Graduation',
      department: json['department_name']?.toString() ??
          json['department']?.toString() ??
          'Journalism & New Media',
      campus: json['campus_name']?.toString() ?? json['campus']?.toString() ?? 'Bhopal Main Campus',
      currentRole: json['current_role']?.toString() ?? json['currentRole']?.toString() ?? 'Media Professional',
      company: json['company']?.toString() ?? 'Independent Media',
      location: json['location']?.toString() ?? 'Bhopal, MP',
      bio: json['bio']?.toString(),
      avatarUrl: json['avatar_url']?.toString() ?? json['avatar']?.toString(),
      linkedinUrl: json['linkedin_url']?.toString() ?? json['linkedin']?.toString(),
      openToMentor: json['open_to_mentor'] == true || json['openToMentor'] == true,
      skills: parseSkills(json['skills']),
      isVerified: json['is_verified'] != false && json['verification_status'] != 'pending',
    );
  }
}

