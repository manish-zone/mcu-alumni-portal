class JobModel {
  final int id;
  final String title;
  final String company;
  final String? companyLogoUrl;
  final String location;
  final String jobType;
  final String experience;
  final String salary;
  final String? deadline;
  final String description;
  final String? referralAlumnusName;
  final String? referralRole;
  final String status;

  JobModel({
    required this.id,
    required this.title,
    required this.company,
    this.companyLogoUrl,
    required this.location,
    required this.jobType,
    required this.experience,
    required this.salary,
    this.deadline,
    required this.description,
    this.referralAlumnusName,
    this.referralRole,
    this.status = 'approved',
  });

  factory JobModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val is int) return val;
      if (val is String) return int.tryParse(val) ?? 0;
      return 0;
    }

    return JobModel(
      id: parseInt(json['id'] ?? 0),
      title: json['title']?.toString() ?? 'Job Opportunity',
      company: json['company_name']?.toString() ?? json['company']?.toString() ?? 'MCU Alumni Referral',
      companyLogoUrl: json['company_logo_url']?.toString(),
      location: json['location']?.toString() ?? 'Bhopal / Remote',
      jobType: json['job_type']?.toString() ?? json['type']?.toString() ?? 'Full-time',
      experience: json['experience_required']?.toString() ?? json['experience']?.toString() ?? '1-3 Years',
      salary: json['salary_range']?.toString() ?? json['salary']?.toString() ?? 'Competitive',
      deadline: json['deadline_date']?.toString() ?? json['deadline']?.toString(),
      description: json['description']?.toString() ?? '',
      referralAlumnusName: json['referral_alumnus_name']?.toString() ?? json['postedBy']?.toString(),
      referralRole: json['referral_role']?.toString(),
      status: json['status']?.toString() ?? 'approved',
    );
  }
}

