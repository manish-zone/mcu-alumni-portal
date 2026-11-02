class MemoryModel {
  final int id;
  final String title;
  final String? hindiTitle;
  final String category;
  final String academicYear;
  final String imageUrl;
  final String? description;

  MemoryModel({
    required this.id,
    required this.title,
    this.hindiTitle,
    required this.category,
    required this.academicYear,
    required this.imageUrl,
    this.description,
  });

  factory MemoryModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val is int) return val;
      if (val is String) return int.tryParse(val) ?? 0;
      return 0;
    }

    return MemoryModel(
      id: parseInt(json['id'] ?? 0),
      title: json['title']?.toString() ?? 'Campus Memory',
      hindiTitle: json['hindi_title']?.toString(),
      category: json['category']?.toString() ?? 'Campus',
      academicYear: json['academic_year']?.toString() ?? json['year']?.toString() ?? '2024',
      imageUrl: json['image_url']?.toString() ?? json['image']?.toString() ?? '',
      description: json['description']?.toString(),
    );
  }
}
