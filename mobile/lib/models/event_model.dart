class EventModel {
  final int id;
  final String title;
  final String? hindiTitle;
  final String category;
  final String eventDate;
  final String? startTime;
  final String venue;
  final String? campusName;
  final String description;
  final String? bannerUrl;
  final int totalSeats;
  final int rsvpCount;
  final String? badgeText;
  final String organizerName;

  EventModel({
    required this.id,
    required this.title,
    this.hindiTitle,
    required this.category,
    required this.eventDate,
    this.startTime,
    required this.venue,
    this.campusName,
    required this.description,
    this.bannerUrl,
    this.totalSeats = 300,
    this.rsvpCount = 0,
    this.badgeText,
    required this.organizerName,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val is int) return val;
      if (val is String) return int.tryParse(val) ?? 0;
      return 0;
    }

    return EventModel(
      id: parseInt(json['id'] ?? 0),
      title: json['title']?.toString() ?? 'MCU Alumni Conclave',
      hindiTitle: json['hindi_title']?.toString(),
      category: json['category']?.toString() ?? 'Conclave',
      eventDate: json['event_date']?.toString() ?? json['date']?.toString() ?? 'Upcoming',
      startTime: json['start_time']?.toString(),
      venue: json['venue']?.toString() ?? json['location']?.toString() ?? 'MCU Bhopal Campus',
      campusName: json['campus_name']?.toString() ?? 'Bhopal Main Campus',
      description: json['description']?.toString() ?? '',
      bannerUrl: json['banner_url']?.toString() ?? json['image']?.toString(),
      totalSeats: parseInt(json['total_seats'] ?? json['seatsTotal'] ?? 300),
      rsvpCount: parseInt(json['rsvp_count'] ?? json['rsvpCount'] ?? 0),
      badgeText: json['badge_text']?.toString() ?? json['badge']?.toString() ?? 'Official MCU Event',
      organizerName: json['organizer_name']?.toString() ?? 'MCU Alumni & Placement Cell',
    );
  }
}

