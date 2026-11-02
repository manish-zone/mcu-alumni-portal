class UserModel {
  final int id;
  final String email;
  final String name;
  final String? hindiName;
  final String role; // alumni, student, admin
  final String? phone;
  final String? avatarUrl;
  final int? batchYear;
  final String? degree;
  final String? departmentName;
  final String? campusName;
  final String? currentRole;
  final String? company;
  final String? location;
  final String? bio;
  final String? linkedinUrl;
  final bool openToMentor;
  final List<String> skills;
  final bool isVerified;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.hindiName,
    this.role = 'alumni',
    this.phone,
    this.avatarUrl,
    this.batchYear,
    this.degree,
    this.departmentName,
    this.campusName,
    this.currentRole,
    this.company,
    this.location,
    this.bio,
    this.linkedinUrl,
    this.openToMentor = false,
    this.skills = const [],
    this.isVerified = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
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

    return UserModel(
      id: parseInt(json['id'] ?? json['user_id'] ?? 0),
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ??
          json['full_name']?.toString() ??
          '${json['first_name'] ?? ''} ${json['last_name'] ?? ''}'.trim(),
      hindiName: json['hindi_name']?.toString(),
      role: json['role']?.toString() ?? 'alumni',
      phone: json['phone']?.toString(),
      avatarUrl: json['avatar_url']?.toString() ?? json['avatar']?.toString(),
      batchYear: json['batch_year'] != null
          ? parseInt(json['batch_year'])
          : (json['batch'] != null ? parseInt(json['batch']) : null),
      degree: json['degree']?.toString(),
      departmentName: json['department_name']?.toString() ?? json['department']?.toString(),
      campusName: json['campus_name']?.toString() ?? json['campus']?.toString(),
      currentRole: json['current_role']?.toString() ?? json['currentRole']?.toString(),
      company: json['company']?.toString(),
      location: json['location']?.toString(),
      bio: json['bio']?.toString(),
      linkedinUrl: json['linkedin_url']?.toString() ?? json['linkedin']?.toString(),
      openToMentor: json['open_to_mentor'] == true || json['openToMentor'] == true,
      skills: parseSkills(json['skills']),
      isVerified: json['is_verified'] == true || json['verified'] == true || json['verification_status'] == 'verified',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'hindi_name': hindiName,
      'role': role,
      'phone': phone,
      'avatar_url': avatarUrl,
      'batch_year': batchYear,
      'degree': degree,
      'department_name': departmentName,
      'campus_name': campusName,
      'current_role': currentRole,
      'company': company,
      'location': location,
      'bio': bio,
      'linkedin_url': linkedinUrl,
      'open_to_mentor': openToMentor,
      'skills': skills,
      'is_verified': isVerified,
    };
  }

  UserModel copyWith({
    String? name,
    String? currentRole,
    String? company,
    String? location,
    String? bio,
    String? avatarUrl,
    String? linkedinUrl,
    bool? openToMentor,
    List<String>? skills,
  }) {
    return UserModel(
      id: id,
      email: email,
      name: name ?? this.name,
      hindiName: hindiName,
      role: role,
      phone: phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      batchYear: batchYear,
      degree: degree,
      departmentName: departmentName,
      campusName: campusName,
      currentRole: currentRole ?? this.currentRole,
      company: company ?? this.company,
      location: location ?? this.location,
      bio: bio ?? this.bio,
      linkedinUrl: linkedinUrl ?? this.linkedinUrl,
      openToMentor: openToMentor ?? this.openToMentor,
      skills: skills ?? this.skills,
      isVerified: isVerified,
    );
  }
}
