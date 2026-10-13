-- =============================================================================
-- Makhanlal Chaturvedi National University of Journalism and Communication (MCU)
-- Bhopal, Madhya Pradesh, India
-- Seed Data for Alumni Portal Database (mcu_alumni_db)
-- =============================================================================

USE `mcu_alumni_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. UNIVERSITY METADATA
-- -----------------------------------------------------------------------------
INSERT INTO `university_metadata` (`meta_key`, `meta_value`, `description`) VALUES
('university_name', 'Makhanlal Chaturvedi National University of Journalism and Communication', 'Official English name'),
('university_hindi_name', 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय', 'Official Hindi name'),
('short_name', 'MCU Bhopal', 'Popular abbreviation'),
('established_year', '1990', 'Statutory Year of Establishment (MP Act 15 of 1990)'),
('tagline', 'Connecting Voices, Inspiring Generations • पत्रकारिता एवं संचार की गौरवशाली परंपरा', 'Official University Tagline'),
('motto', 'सत्यं वद धर्मं चर', 'University Sanskrit Motto'),
('main_campus', 'Bishankhedi, Bhopal, Madhya Pradesh', 'Central Campus Location'),
('stat_alumni_count', '38,500+', 'Global Alumni Base'),
('stat_media_partners', '650+', 'Media & Corporate Hiring Network'),
('stat_batches', '34+', 'Batches graduated since 1990'),
('stat_countries', '28+', 'Countries with active alumni representation'),
('helpline_phone', '+91 755 2553523', 'University Alumni Cell Helpline'),
('official_website', 'https://www.mcu.ac.in/', 'Official University Web Portal');

-- -----------------------------------------------------------------------------
-- 2. CAMPUSES
-- -----------------------------------------------------------------------------
INSERT INTO `campuses` (`code`, `name`, `hindi_name`, `address`) VALUES
('bhopal', 'Bhopal (Main Campus)', 'भोपाल (मुख्य परिसर)', 'Bishankhedi, Post Kerwa Dam, Bhopal, MP 462044'),
('khandwa', 'Khandwa Campus', 'खंडवा परिसर', 'Karmveer Vidyapeeth, Anand Nagar, Khandwa, MP 450001'),
('rewa', 'Rewa Campus', 'रीवा परिसर', 'Bodhbagh, Rewa, MP 486001'),
('datia', 'Datia Campus', 'दतिया परिसर', 'Jhansi Road, Near Medical College, Datia, MP 475661');

-- -----------------------------------------------------------------------------
-- 3. ACADEMIC DEPARTMENTS
-- -----------------------------------------------------------------------------
INSERT INTO `departments` (`code`, `name`, `hindi_name`, `description`) VALUES
('journalism', 'Journalism & Mass Comm', 'पत्रकारिता एवं जनसंचार', 'Print, Investigative, Digital News & Mass Communication'),
('broadcast', 'Electronic Media & Broadcast', 'इलेक्ट्रॉनिक मीडिया व प्रसारण', 'TV News Production, Anchoring, Radio & Podcasting'),
('pr_adv', 'PR & Advertising', 'जनसंपर्क एवं विज्ञापन', 'Public Relations, Brand Strategy, Corporate Comm & Ad Campaigns'),
('media_mgmt', 'Media Management', 'मीडिया प्रबंधन', 'Media Business, Analytics, Operations & Entertainment Management'),
('computer_app', 'Computer Applications (IT)', 'कंप्यूटर अनुप्रयोग (BCA/MCA)', 'Software Engineering, Web Tech, AI in Media & Multimedia IT'),
('new_media', 'New Media & Digital Content', 'न्यू मीडिया व डिजिटल कंटेंट', 'OTT, Social Media Strategies, Mobile Journalism & Data Graphics');

-- -----------------------------------------------------------------------------
-- 4. MASTER SKILLS
-- -----------------------------------------------------------------------------
INSERT INTO `skills` (`name`) VALUES
('Investigative Reporting'),
('Data Journalism'),
('Editorial Writing'),
('RTI Investigations'),
('Prime Time Anchoring'),
('Live Field Reporting'),
('Broadcast Direction'),
('Video Editing'),
('Corporate PR'),
('Crisis Communication'),
('Media Relations'),
('Brand Storytelling'),
('Digital Marketing'),
('SEO Strategy'),
('OTT Content Creation'),
('Screenwriting'),
('Media Law & Ethics'),
('Full Stack Web Development'),
('Python & Data Analytics'),
('Photojournalism');

-- -----------------------------------------------------------------------------
-- 5. MENTORSHIP TOPICS
-- -----------------------------------------------------------------------------
INSERT INTO `mentorship_topics` (`name`, `hindi_name`) VALUES
('Career Guidance & Newsroom Transition', 'कैरियर मार्गदर्शन व न्यूज़रूम तैयारी'),
('Investigative Reporting & RTI Frameworks', 'खोजी पत्रकारिता व आरटीआई प्रक्रिया'),
('TV Anchoring & Voice Modulation', 'टीवी एंकरिंग व वॉइस मॉड्यूलेशन'),
('Corporate Communications & Brand PR', 'कॉर्पोरेट जनसंपर्क व ब्रांड रणनीति'),
('Screenwriting & OTT Series Development', 'पटकथा लेखन व ओटीटी कंटेंट निर्माण'),
('Civil Services & Media Policy Preparation', 'सिविल सेवा व मीडिया नीति अध्ययन');

-- -----------------------------------------------------------------------------
-- 6. USERS & ALUMNI DIRECTORY PROFILES
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `email`, `password_hash`, `phone`, `role`, `is_verified`, `is_active`) VALUES
(1, 'prashant.s@indianexpress.com', '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr', '+91 9811002233', 'alumni', TRUE, TRUE),
(2, 'meenakshi.j@indiatvnews.com', '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr', '+91 9822003344', 'alumni', TRUE, TRUE),
(3, 'anurag.s@ogilvy.com', '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr', '+91 9833004455', 'alumni', TRUE, TRUE),
(4, 'swati.m@timesinternet.in', '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr', '+91 9844005566', 'alumni', TRUE, TRUE),
(5, 'rohit.v@iimc.gov.in', '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr', '+91 9855006677', 'alumni', TRUE, TRUE),

INSERT INTO `alumni_profiles` (`id`, `user_id`, `enrollment_no`, `first_name`, `last_name`, `hindi_name`, `batch_year`, `degree`, `department_id`, `campus_id`, `current_role`, `company`, `location`, `bio`, `avatar_url`, `linkedin_url`, `open_to_mentor`) VALUES
(1, 1, 'MCU/2011/MJ/042', 'Prashant', 'Shrivastava', 'प्रशांत श्रीवास्तव', 2011, 'MA in Mass Communication', 1, 1, 'Senior Assistant Editor', 'The Indian Express', 'New Delhi, India', 'Specializing in political economy, rural governance, and parliamentary investigations with 14+ years in print journalism.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE),
(2, 2, 'MCU/2014/EM/108', 'Meenakshi', 'Joshi', 'मीनाक्षी जोशी', 2014, 'Master of Electronic Media', 2, 1, 'Prime Time Anchor & Special Producer', 'India TV News', 'Noida, NCR', 'Award-winning prime time news anchor, debate moderator, and yoga exponent with over a decade in television broadcast.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE),
(3, 3, 'MCU/2016/PR/025', 'Anurag', 'Sharma', 'अनुराग शर्मा', 2016, 'MA in Advertising & PR', 3, 1, 'Director - Strategic Communications', 'Ogilvy India', 'Mumbai, India', 'Leading corporate narrative and crisis reputation management for global Fortune 500 brands and top Indian startups.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE),
(4, 4, 'MCU/2018/NM/067', 'Swati', 'Mishra', 'स्वाति मिश्रा', 2018, 'M.Sc. in New Media Technology', 6, 1, 'Lead Audience Strategist & Growth Head', 'Times Internet', 'Bengaluru, India', 'Leveraging algorithm analytics, multi-platform short-form video, and SEO newsroom tools to scale digital news reach.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE),
(5, 5, 'MCU/2006/PHD/012', 'Dr. Rohit', 'Verma', 'डॉ. रोहित वर्मा', 2006, 'Ph.D. in Journalism & Media Studies', 1, 1, 'Professor & Dean of Media Research', 'IIMC New Delhi', 'New Delhi, India', 'Academician and former field reporter researching media ethics, AI in news verification, and community radio impact.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE),
(6, 6, 'MCU/2017/MJ/089', 'Neha', 'Tiwari', 'नेहा तिवारी', 2017, 'MA in Journalism', 1, 3, 'Central India Senior Correspondent', 'BBC News Hindi', 'Bhopal, India', 'Covering environmental conflicts, tribal healthcare rights, and rural community voices across Madhya Pradesh and Chhattisgarh.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE),
(7, 7, 'MCU/2015/EM/034', 'Siddharth', 'Sen', 'सिद्धार्थ सेन', 2015, 'Master of Electronic Media', 2, 1, 'Creative Producer & Showrunner', 'Sony Pictures Television', 'Mumbai, India', 'Showrunner behind acclaimed documentary features, OTT web series narratives, and non-fiction reality broadcasts.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE),
(8, 8, 'MCU/2012/MM/058', 'Vikram', 'Rathore', 'विक्रम राठौर', 2012, 'MBA in Media Management', 4, 2, 'Head of Corporate Affairs & Sustainability', 'Tata Steel', 'Kolkata, India', 'Managing CSR communication, environmental compliance advocacy, and investor media relations across major manufacturing plants.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', 'https://linkedin.com', TRUE);

-- Map Alumni Skills
INSERT INTO `alumni_skills` (`alumni_id`, `skill_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 5), (2, 6), (2, 7),
(3, 9), (3, 10), (3, 11), (3, 12),
(4, 13), (4, 14), (4, 19),
(5, 3), (5, 17),
(6, 1), (6, 6), (6, 20),
(7, 7), (7, 8), (7, 15), (7, 16),
(8, 9), (8, 10), (8, 12);

-- Map Alumni Mentorship Topics
INSERT INTO `alumni_mentorship_topics` (`alumni_id`, `topic_id`) VALUES
(1, 1), (1, 2),
(2, 1), (2, 3),
(3, 1), (3, 4),
(4, 1),
(5, 1), (5, 6),
(6, 1), (6, 2),
(7, 1), (7, 5),
(8, 1), (8, 4);

-- -----------------------------------------------------------------------------
-- 7. HALL OF FAME ("OUR ALUMNI, OUR PRIDE" FROM MCU.AC.IN)
-- -----------------------------------------------------------------------------
INSERT INTO `hall_of_fame`
(`id`, `slug`, `name`, `hindi_name`, `category`, `award_title`, `award_title_en`, `batch_info`, `degree_info`, `current_role`, `current_role_en`, `company_name`, `image_url`, `fallback_image_url`, `is_poster`, `is_banner`, `quote`, `quote_en`, `official_source`, `display_order`)
VALUES
(1, 'dr-brijesh-rajput', 'Dr. Brijesh Rajput', 'डॉ. बृजेश राजपूत', 'rng', 'रामनाथ गोयनका अवॉर्ड - 2017', 'Ramnath Goenka Award 2017', 'MCU Alumnus', 'पत्रकारिता एवं जनसंचार (MCU Bhopal)', 'ग्रुप एडिटर, Vistaar News', 'Group Editor, Vistaar News', 'Vistaar News / Ex-ABP News', '/hall_of_fame/our-alumni-01.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-01.jpeg', TRUE, FALSE, 'माखनलाल पत्रकारिता विश्वविद्यालय ने हमें सत्य के साथ खड़े रहने और निष्पक्ष पत्रकारिता करने का संकल्प दिया।', 'Makhanlal Journalism University instilled in us the unwavering resolve to stand with truth and pursue fearless journalism.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 1),

(2, 'shyamlal-yadav', 'Shyamlal Yadav', 'श्री श्यामलाल यादव', 'rng', '2x रामनाथ गोयनका अवॉर्ड (2008 & 2013)', '2x Ramnath Goenka Award (2008 & 2013)', 'MCU Alumnus', 'मास्टर ऑफ मास कम्युनिकेशन (MCU)', 'सीनियर एसोसिएट एडिटर (खोजी पत्रकार), The Indian Express', 'Senior Associate Editor (Investigative), The Indian Express', 'The Indian Express', '/hall_of_fame/our-alumni-02.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-02.jpeg', TRUE, FALSE, 'आरटीआई और साक्ष्य-आधारित खोजी पत्रकारिता ही लोकतंत्र की सच्ची पहरेदार है।', 'RTI and evidence-backed investigative reporting are the true guardians of democracy.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 2),

(3, 'durgesh-singh', 'Durgesh Singh', 'श्री दुर्गेश सिंह', 'creative', 'प्रसिद्ध स्क्रीनराइटर व लेखक', 'Acclaimed Screenwriter & OTT Creator', 'MCU Alumnus', 'पत्रकारिता एवं जनसंचार (MCU Bhopal)', 'क्रिएटिव राइटर, \'गुल्लक\' (सीजन 2 व 3 - TVF / SonyLIV)', 'Creative Writer, \'GULLAK\' (Seasons 2 & 3 - TVF / SonyLIV)', 'TVF / SonyLIV / OTT', '/hall_of_fame/our-alumni-03.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-03.jpeg', TRUE, FALSE, 'माटी से जुड़ी कहानियों और आम जनजीवन की संवेदनाओं को जब हम कलमबद्ध करते हैं, तो वह सीधे दिल को छू जाती हैं।', 'When we articulate grassroots stories and ordinary human emotions with honesty, they touch millions of hearts.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 3),

(4, 'brajesh-singh', 'Brajesh Singh', 'श्री ब्रजेश सिंह', 'rng', '2x रामनाथ गोयनका अवॉर्ड (2012 & 2014)', '2x Ramnath Goenka Award (2012 & 2014)', 'MCU Alumnus', 'पत्रकारिता एवं जनसंचार (MCU)', 'पूर्व संपादक, तहलका (वरिष्ठ खोजी पत्रकार)', 'Former Editor, Tehelka (Senior Investigative Journalist)', 'Tehelka / National Media', '/hall_of_fame/our-alumni-04.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-04.jpeg', TRUE, FALSE, 'सच्चाई को निर्भीकता और निष्पक्षता से सामने लाना ही एक पत्रकार का सर्वोच्च उत्तरदायित्व है।', 'Bringing truth fearlessly to the forefront is the highest calling and responsibility of a journalist.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 4),

(5, 'sibu-kumar-tripathi', 'Sibu Kumar Tripathi', 'श्री सिबु कुमार त्रिपाठी', 'rng', 'रामनाथ गोयनका अवॉर्ड - 2025', 'Ramnath Goenka Award 2025', 'MCU Alumnus', 'मास्टर ऑफ मास कम्युनिकेशन (MCU)', 'साइंस एडिटर, इंडिया टुडे', 'Science Editor, India Today', 'India Today Group', '/hall_of_fame/our-alumni-05.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-05.jpeg', TRUE, FALSE, 'विज्ञान, अंतरिक्ष और नवाचार की उपलब्धियों को आमजन तक सरल व प्रामाणिक रूप में पहुंचाना ही हमारा ध्येय है।', 'Translating scientific breakthroughs and space exploration for common citizens is our core journalistic mission.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 5),

(6, 'vishnukant-tiwari', 'Vishnukant Tiwari', 'श्री विष्णूकांत तिवारी', 'rng', '2x रामनाथ गोयनका अवॉर्ड (2021 & 2025)', '2x Ramnath Goenka Award (2021 & 2025)', 'MCU Alumnus', 'पत्रकारिता एवं जनसंचार (MCU Bhopal)', 'सेंट्रल इंडिया कॉरेस्पॉन्डेंट, BBC हिन्दी', 'Central India Correspondent, BBC Hindi', 'BBC News Hindi', '/hall_of_fame/our-alumni-06.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-06.jpeg', TRUE, FALSE, 'मध्य भारत के दूरदराज अंचलों और जनजातीय समाज की वास्तविक समस्याओं को वैश्विक मंच पर प्रस्तुत करना।', 'Amplifying the authentic voices of tribal communities and rural hinterlands onto the international stage.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 6),

(7, 'anurag-dwary', 'Anurag Dwary', 'श्री अनुराग द्वारी', 'rng', 'रामनाथ गोयनका अवॉर्ड - 2025', 'Ramnath Goenka Award 2025', 'MCU Alumnus', 'मास्टर ऑफ इलेक्ट्रॉनिक मीडिया (MCU)', 'एग्जीक्यूटिव एडिटर, NDTV (मध्य प्रदेश एवं छत्तीसगढ़)', 'Executive Editor, NDTV (MP & CG)', 'NDTV', '/hall_of_fame/our-alumni-07.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-07.jpeg', TRUE, FALSE, 'तथ्यों की शुद्धता और मानवीय दृष्टिकोण ही पत्रकारिता को जन-सरोकारों का सच्चा संवाहक बनाते हैं।', 'Purity of facts and unwavering human empathy make journalism a true force of democratic accountability.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 7),

(8, 'priyanka-dubey', 'Priyanka Dubey', 'सुश्री प्रियंका दुबे', 'rng', 'रामनाथ गोयनका अवॉर्ड - 2011 & चमेली देवी जैन अवॉर्ड', 'Ramnath Goenka Award 2011 & Chameli Devi Jain Award', 'MCU Alumnus', 'पत्रकारिता एवं जनसंचार (MCU)', 'वरिष्ठ खोजी पत्रकार व अंतरराष्ट्रीय लेखिका', 'Senior Investigative Journalist & Acclaimed Author', 'Independent Journalism / Author', '/hall_of_fame/our-alumni-08.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-08.jpeg', TRUE, FALSE, 'हाशिए पर खड़े लोगों के दर्द को गहराई से समझना और उन्हें न्याय दिलाना ही हमारी लेखनी की सार्थकता है।', 'Deeply understanding marginalized voices and seeking justice for them validates our words.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 8),

(9, 'vijaypal-dudi', 'Vijaypal Dudi', 'श्री विजयपाल डूडी', 'rng', 'रामनाथ गोयनका अवॉर्ड - 2026', 'Ramnath Goenka Award 2026', 'MCU Alumnus', 'पत्रकारिता एवं जनसंचार (MCU Bhopal)', 'वरिष्ठ पत्रकार, दैनिक भास्कर', 'Senior Journalist, Dainik Bhaskar', 'Dainik Bhaskar', '/hall_of_fame/our-alumni-09.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2026/05/our-alumni-09.jpeg', TRUE, FALSE, 'सच्ची रिपोर्टिंग वही है जो व्यवस्था में सुधार और आम नागरिक के जीवन में सकारात्मक परिवर्तन लाए।', 'True journalism is that which sparks systemic reform and positive change in ordinary lives.', 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride', 9),

(10, 'anuj-khare', 'Anuj Khare', 'श्री अनुज खरे', 'leader', 'वरिष्ठ संपादक व मीडिया चिंतक', 'Senior Editor & Media Thinker', 'MCU Senior Alumnus', 'मास्टर ऑफ जर्नलिज्म (MCU)', 'वरिष्ठ संपादक (डिजिटल व प्रिंट मीडिया)', 'Senior Editor (Digital & Print Media)', 'Senior Media Leadership', '/hall_of_fame/AnujKhare_profile.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2025/09/AnujKhare_profile.jpg', FALSE, TRUE, 'मेरी भाषा की पहली प्रयोगशाला मेरा विश्वविद्यालय, माखनलाल पत्रकारिता विश्वविद्यालय से सीखा मन को पढ़ना।', 'My university was the first laboratory of my language; from Makhanlal Journalism University I learned to read the minds of people.', 'MCU Official Archives (mcu.ac.in) • Alumni Cell', 10),

(11, 'sanjeev-sharma', 'Sanjeev Sharma', 'श्री संजीव शर्मा', 'leader', 'वरिष्ठ संचार एवं जनसंपर्क विशेषज्ञ', 'Senior Communications & PR Director', 'MCU Senior Alumnus', 'जनसंपर्क एवं मीडिया प्रबंधन (MCU)', 'वरिष्ठ संचार निदेशक व मीडिया रणनीतिकार', 'Senior Communications Director & Strategist', 'Strategic Communications & Media', '/hall_of_fame/SanjeevSharma_profile.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2025/09/SanjeevSharma_profile.jpg', FALSE, TRUE, 'ये चमक, ये दमक, फूलवन में महक, सब कुछ सरकार तुम्हीं से है, विश्वविद्यालय से ज्यादा गुरुकुल है यह।', 'This brilliance, this fragrance, is all owed to this sacred institution; it is far more than a university, it is a timeless Gurukul.', 'MCU Official Archives (mcu.ac.in) • Alumni Cell', 11),

(12, 'anand-pandey', 'Anand Pandey', 'श्री आनंद पांडे', 'leader', 'संस्थापक व प्रधान संपादक', 'Founder & Editor-in-Chief', 'MCU Alumnus', 'पत्रकारिता एवं जनसंचार (MCU)', 'संस्थापक व प्रधान संपादक, \'द सूत्र\' (The Sootr)', 'Founder & Editor-in-Chief, \'The Sootr\'', 'The Sootr Media', '/hall_of_fame/Anand_Pandey_Profile.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2025/09/Anand_Pandey_Profile.jpg', FALSE, TRUE, 'साहसिक और रोमांचक फैसलों से भरा मेरी पत्रकारिता का सफर, हम सिर्फ भगवान से डरते हैं... \'द सूत्र\' की टैगलाइन तक पहुंचने की रोचक राह।', 'A journey brimming with fearless, adventurous decisions; \'We fear only God\' — the daring philosophy behind The Sootr.', 'MCU Official Archives (mcu.ac.in) • Alumni Cell', 12),

(13, 'shrikant-trivedi', 'Shrikant Trivedi', 'श्री श्रीकांत त्रिवेदी', 'creative', 'क्रिएटिव लीडर, विज्ञापन जगत', 'Creative Leader, Advertising & Brand Strategy', 'MCU Alumnus', 'विज्ञापन एवं जनसंपर्क (MCU)', 'क्रिएटिव डायरेक्टर, ओगिल्वी इंडिया (Ogilvy India)', 'Creative Director, Ogilvy India', 'Ogilvy India', '/hall_of_fame/Shrikant_Triwedi_profile.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2025/09/Shrikant_Triwedi_profile.jpg', FALSE, TRUE, 'हिंदी भाषी होकर ओगिल्वी इंडिया तक आने का सफर सरल नहीं था, शहर बदले, कई ऑफिस बदले, पर मुझे इस विश्वविद्यालय ने बदला।', 'The journey as a Hindi native to reaching Ogilvy India wasn\'t easy; cities and offices changed, but this University truly transformed me.', 'MCU Official Archives (mcu.ac.in) • Alumni Cell', 13),

(14, 'sushil-agrawal', 'Sushil Agrawal', 'श्री सुशील अग्रवाल', 'leader', 'संस्थापक व प्रबंध निदेशक', 'Founder & Managing Director', 'MCU Alumnus', 'मीडिया मैनेजमेंट (MCU Bhopal)', 'संस्थापक एवं निदेशक, मध्या कम्युनिकेशन्स', 'Founder & Director, Madhhya Communication', 'Madhhya Communication', '/hall_of_fame/Susheel_Agrawal_Profile.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2025/09/Susheel_Agrawal_Profile.jpg', FALSE, TRUE, '\'मध्या\' की सफलता का सफर आसान नहीं था पर हिम्मत से कामयाब हुआ।', 'The journey to Madhhya\'s success was never simple, but courage and perseverance turned it into triumph.', 'MCU Official Archives (mcu.ac.in) • Alumni Cell', 14);

-- Hall of Fame Achievements
INSERT INTO `hall_of_fame_achievements` (`hall_of_fame_id`, `achievement_text`, `display_order`) VALUES
(1, 'रामनाथ गोयनका अवॉर्ड - 2017 (Excellence in Journalism)', 1),
(1, 'ग्रुप एडिटर - Vistaar News (पूर्व वरिष्ठ पत्रकार, ABP News)', 2),
(1, 'तीन दशकों का गौरवशाली टीवी एवं प्रिंट पत्रकारिता सफर', 3),

(2, 'दो बार प्रतिष्ठित रामनाथ गोयनका अवॉर्ड विजेता (2008, 2013)', 1),
(2, 'सीनियर एसोसिएट एडिटर - The Indian Express', 2),
(2, 'इंटरनेशनल कंसोर्टियम ऑफ इन्वेस्टिगेटिव जर्नलिस्ट्स (ICIJ) सदस्य व लेखक', 3),

(3, 'सुपरहिट वेब सीरीज \'गुल्लक\' सीजन 2 और 3 के मुख्य लेखक', 1),
(3, 'फिल्मफेयर ओटीटी अवॉर्ड्स नामांकित', 2),
(3, 'भारतीय टीवी व ओटीटी पटकथा लेखन में यथार्थवादी शैली के प्रवर्तक', 3),

(4, 'दो बार रामनाथ गोयनका अवॉर्ड (2012, 2014)', 1),
(4, 'पूर्व संपादक - तहलका', 2),
(4, 'राष्ट्रीय महत्व के खोजी खुलासे और ज़मीनी रिपोर्टिंग', 3),

(5, 'रामनाथ गोयनका अवॉर्ड - 2025', 1),
(5, 'साइंस एडिटर - इंडिया टुडे डिजिटल एवं प्रिंट', 2),
(5, 'इसरो चंद्रयान, आदित्य L1 व गगनयान अभियानों की विशेष कवरेज', 3),

(6, 'दो बार रामनाथ गोयनका अवॉर्ड विजेता (2021, 2025)', 1),
(6, 'सेंट्रल इंडिया कॉरेस्पॉन्डेंट - बीबीसी हिन्दी (BBC Hindi)', 2),
(6, 'पर्यावरण, मानवाधिकार और जनजातीय सरोकारों पर बहुचर्चित रिपोर्टिंग', 3),

(7, 'रामनाथ गोयनका अवॉर्ड - 2025 (Excellence in Journalism)', 1),
(7, 'एग्जीक्यूटिव एडिटर - NDTV', 2),
(7, 'दो दशकों से मध्य भारत की राजनीति व सामाजिक मुद्दों पर विश्वसनीय रिपोर्टिंग', 3),

(8, 'रामनाथ गोयनका अवॉर्ड - 2011', 1),
(8, 'चमेली देवी जैन अवॉर्ड फॉर आउटस्टैंडिंग वीमेन जर्नलिस्ट', 2),
(8, 'चर्चित पुस्तक \'No Nation for Women\' की अंतरराष्ट्रीय लेखिका', 3),

(9, 'रामनाथ गोयनका अवॉर्ड - 2026 (Excellence in Journalism)', 1),
(9, 'वरिष्ठ खोजी पत्रकार - दैनिक भास्कर', 2),
(9, 'प्रशासनिक सुधार और जनहित के मुद्दों पर साहसिक खुलासे', 3),

(10, 'माखनलाल चतुर्वेदी विश्वविद्यालय के प्रतिष्ठित पूर्व छात्र', 1),
(10, 'तीन दशकों से हिंदी पत्रकारिता एवं डिजिटल मीडिया में अग्रणी नेतृत्व', 2),
(10, 'विश्वविद्यालय एलुमनाई सेल के मार्गदर्शक', 3),

(11, 'विश्वविद्यालय पूर्व छात्र प्रकोष्ठ के प्रमुख प्रेरणास्रोत', 1),
(11, 'कॉर्पोरेट संचार एवं जनसंपर्क में 25+ वर्षों का अनुकरणीय योगदान', 2),
(11, 'राष्ट्रीय मीडिया संगठनों के रणनीतिक सलाहकार', 3),

(12, 'संस्थापक व एडिटर-इन-चीफ - \'द सूत्र\' डिजिटल न्यूज़ नेटवर्क', 1),
(12, 'खोजी पत्रकारिता में डिजिटल नवाचार के अग्रदूत', 2),
(12, 'मध्य भारत का सबसे तेज़ी से बढ़ता डिजिटल न्यूज़ प्लेटफॉर्म', 3),

(13, 'क्रिएटिव लीडर - ओगिल्वी इंडिया (Ogilvy India)', 1),
(13, 'भारत के प्रमुख बहुराष्ट्रीय ब्रांड अभियानों के रचनाकार', 2),
(13, 'विज्ञापन जगत में भारतीय भाषा और लोक-संस्कृति को प्रतिष्ठित पहचान दिलाई', 3),

(14, 'संस्थापक एवं प्रबंध निदेशक - मध्या कम्युनिकेशन्स', 1),
(14, 'सफल मीडिया उद्यमी एवं विश्वविद्यालय एलुमनाई संरक्षक', 2),
(14, 'युवा मीडिया छात्रों के मेंटर व रोजगार सृजक', 3);

-- -----------------------------------------------------------------------------
-- 8. EVENTS & FESTIVALS (ABHYUDAY 2026, CONCLAVES, ARCHIVES)
-- -----------------------------------------------------------------------------
INSERT INTO `events`
(`id`, `slug`, `title`, `hindi_title`, `category`, `event_date`, `start_time`, `end_time`, `venue`, `campus_id`, `description`, `hindi_description`, `banner_url`, `fallback_banner_url`, `total_seats`, `rsvp_count`, `organizer_name`, `is_official_mcu`, `badge_text`, `status`)
VALUES
(1, 'abhyuday-2026', 'ABHYUDAY 2026: National Media Summit & Grand Alumni Meet', 'अभ्युदय 2026: राष्ट्रीय मीडिया महाकुंभ एवं पूर्व छात्र समागम', 'festival', '2026-09-18', '09:30 AM', '08:00 PM', 'Ganesh Shankar Vidyarthi Sabhagar, Bishankhedi Campus, Bhopal', 1, 'The premier flagship annual conclave of MCU featuring 2,500+ delegates, editors from top 50 national networks, panel debates, masterclasses, and alumni awards.', 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता विश्वविद्यालय का ऐतिहासिक राष्ट्रीय महाकुंभ जिसमें देश-विदेश के 2,500+ पूर्व छात्र, शीर्ष संपादक व मीडिया विशेषज्ञ सम्मिलित होंगे।', '/abhyuday/abhyuday-banner-01.png', 'https://www.mcu.ac.in/wp-content/uploads/2026/08/abhyuday-2026-banner.png', 3000, 1840, 'MCU Central Alumni Cell & Student Council', TRUE, 'अभ्युदय 2026 • Live Event', 'upcoming'),

(2, 'digital-journalism-conclave', 'AI & Digital Fact-Checking Leadership Forum', 'एआई एवं डिजिटल तथ्य-जांच नेतृत्व संगोष्ठी', 'conclave', '2026-10-12', '10:00 AM', '04:30 PM', 'Nalanda Central Library Hall, Bishankhedi, Bhopal', 1, 'In-depth symposium led by tech journalists and algorithm researchers dissecting deepfakes, AI hallucinations in newsrooms, and verification pipelines.', 'न्यूज़रूम में कृत्रिम बुद्धिमत्ता (AI) के नैतिक उपयोग, डीपफेक पहचान व तथ्य-सत्यापन पर राष्ट्रीय विशेषज्ञों का संवाद सत्र।', '/events/event-conf-01.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2026/03/seminar-banner.jpg', 400, 290, 'Dept of New Media & IT', TRUE, 'National Conclave', 'upcoming'),

(3, 'silver-jubilee-reunion-2001', 'Silver Jubilee Reunion (Batches of 1999 - 2003)', 'रजत जयंती पूर्व छात्र मिलन समारोह (बैच 1999 - 2003)', 'reunion', '2026-11-08', '11:00 AM', '06:00 PM', 'MCU Rewa Campus Auditorium, Rewa, MP', 3, 'A nostalgic homecoming honoring the trailblazers who built regional news networks. Includes campus tour and endowment scholarship announcement.', '25 वर्ष पूर्ण करने वाले पूर्व छात्र-छात्राओं का भावपूर्ण मिलन समारोह, पुरानी यादों का संस्मरण एवं रीवा परिसर में छात्रवृत्ति सम्मान।', '/events/event-reunion-01.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2025/11/reunion-meet.jpg', 500, 385, 'Rewa Alumni Chapter', TRUE, 'Silver Jubilee', 'upcoming');

INSERT INTO `event_tags` (`event_id`, `tag_name`) VALUES
(1, 'Abhyuday2026'), (1, 'MediaConclave'), (1, 'AlumniHomecoming'), (1, 'Bhopal'),
(2, 'AIinMedia'), (2, 'FactChecking'), (2, 'DigitalJournalism'),
(3, 'SilverJubilee'), (3, 'RewaCampus'), (3, 'Reunion');

INSERT INTO `event_rsvps` (`event_id`, `user_id`, `attendee_name`, `attendee_email`, `attendee_phone`, `batch_year`, `campus`, `guest_count`, `ticket_pass_code`, `status`) VALUES
(1, 1, 'Prashant Shrivastava', 'prashant.s@indianexpress.com', '+91 9811002233', 2011, 'Bhopal', 1, 'MCU-ABHYUDAY-104928', 'confirmed'),
(1, 2, 'Meenakshi Joshi', 'meenakshi.j@indiatvnews.com', '+91 9822003344', 2014, 'Bhopal', 1, 'MCU-ABHYUDAY-882194', 'confirmed'),
(2, 4, 'Swati Mishra', 'swati.m@timesinternet.in', '+91 9844005566', 2018, 'Bhopal', 2, 'MCU-AI-394812', 'confirmed');

-- -----------------------------------------------------------------------------
-- 9. JOBS & ALUMNI REFERRALS
-- -----------------------------------------------------------------------------
INSERT INTO `jobs`
(`id`, `posted_by_user_id`, `title`, `company_name`, `location`, `job_type`, `experience_required`, `salary_range`, `deadline_date`, `description`, `referral_alumnus_name`, `referral_role`, `status`)
VALUES
(1, 1, 'Senior Investigative Reporter', 'The Indian Express', 'New Delhi, India', 'Full-time', '4-7 Years', '₹10 - 15 LPA', '2026-10-15', 'Looking for tenacious investigative journalists skilled in analyzing public records, financial disclosures, and data journalism for frontline reporting.', 'Prashant Shrivastava (Batch of 2011)', 'Senior Assistant Editor', 'active'),

(2, 2, 'Broadcast News Producer / Bulletins', 'India TV News', 'Noida, NCR', 'Full-time', '2-5 Years', '₹7 - 11 LPA', '2026-10-20', 'Produce fast-paced prime time bulletins, handle live graphics tickers, PCR coordination, and news rundowns in Hindi.', 'Meenakshi Joshi (Batch of 2014)', 'Prime Time Anchor & Producer', 'active'),

(3, 3, 'Senior PR & Communications Manager', 'Ogilvy India', 'Mumbai / Remote', 'Full-time', '3-6 Years', '₹12 - 18 LPA', '2026-10-30', 'Drive national brand narratives, oversee press releases, manage tech client media briefings, and coordinate crisis responses.', 'Anurag Sharma (Batch of 2016)', 'Director - Communications', 'active'),

(4, 7, 'Creative Scriptwriter (Hindi Drama Series)', 'Sony Pictures Television', 'Mumbai, India', 'Contract', '2-4 Years', '₹8 - 14 LPA', '2026-11-15', 'Write episode treatments, natural character dialogues, and screenplay drafts for upcoming streaming comedy-drama series.', 'Siddharth Sen (Batch of 2015)', 'Creative Producer & Showrunner', 'active');

INSERT INTO `job_tags` (`job_id`, `tag_name`) VALUES
(1, 'Print Journalism'), (1, 'Investigative'), (1, 'RTI'),
(2, 'TV Production'), (2, 'PCR'), (2, 'Hindi Broadcast'),
(3, 'Public Relations'), (3, 'Corporate Comms'), (3, 'Media Strategy'),
(4, 'Screenwriting'), (4, 'OTT Drama'), (4, 'Storytelling');

INSERT INTO `job_applications` (`job_id`, `applicant_user_id`, `applicant_name`, `applicant_email`, `applicant_phone`, `mcu_batch`, `portfolio_url`, `cover_note`, `status`) VALUES
(1, 6, 'Neha Tiwari', 'neha.t@bbc.com', '+91 9866007788', 2017, 'https://portfolio.me/nehatiwari', 'Excited to bring 7 years of on-ground investigative coverage from Central India to the Indian Express newsroom.', 'referred');

-- -----------------------------------------------------------------------------
-- 10. MENTORSHIP REQUESTS
-- -----------------------------------------------------------------------------
INSERT INTO `mentorship_requests` (`mentor_alumni_id`, `mentee_user_id`, `mentee_name`, `mentee_email`, `mentee_phone`, `mentee_status`, `topic`, `preferred_time`, `message`, `status`) VALUES
(1, NULL, 'Aman Verma', 'aman.v@student.mcu.ac.in', '+91 9911223344', 'Student', 'Investigative Reporting & RTI Frameworks', 'Weekend Evening', 'I am in my final year of MA Journalism at Bishankhedi. Seeking guidance on how to submit first RTI filings for public spending stories.', 'accepted'),
(2, NULL, 'Pooja Pandey', 'pooja.p@gmail.com', '+91 9922334455', 'Student', 'TV Anchoring & Voice Modulation', 'Sunday Morning', 'Would love feedback on my PCR broadcast demo reel and tips for live teleprompter reading without stress.', 'pending');

-- -----------------------------------------------------------------------------
-- 11. CAMPUS MEMORIES (AUTHENTIC PHOTO ARCHIVES FROM MCU.AC.IN)
-- -----------------------------------------------------------------------------
INSERT INTO `campus_memories`
(`id`, `slug`, `title`, `hindi_title`, `category`, `academic_year`, `campus_id`, `description`, `hindi_description`, `image_url`, `fallback_image_url`, `credit`, `display_order`)
VALUES
(1, 'nalanda-library-main-hall', 'Nalanda Central Library: Main Reading Hall', 'नालंदा केंद्रीय ग्रंथालय: मुख्य वाचनालय', 'library', '2024-25', 1, 'The vast reading hall of Nalanda Central Library at Bishankhedi campus housing over 50,000 reference volumes.', 'बिसनखेड़ी परिसर स्थित नालंदा केंद्रीय ग्रंथालय का भव्य वाचनालय जहाँ 50,000 से अधिक संदर्भ ग्रंथ उपलब्ध हैं।', '/memories/library-01.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/Nalanda-Central-Library-01.jpeg', 'MCU Archives (mcu.ac.in)', 1),

(2, 'nalanda-reference-periodicals', 'Nalanda Library: Periodicals & Archive Stacks', 'नालंदा ग्रंथालय: पत्रिका एवं संदर्भ संकलन', 'library', '2024-25', 1, 'Extensive media archives holding rare historical editions of Karmaveer, Navbharat, and international journalism journals.', 'दुर्लभ समाचार पत्रों एवं अंतरराष्ट्रीय जर्नल्स का समृद्ध संदर्भ संकलन जहाँ शोधार्थी नियमित अध्ययन करते हैं।', '/memories/library-02.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/Nalanda-Central-Library-05.jpeg', 'MCU Archives (mcu.ac.in)', 2),

(3, 'nalanda-digital-scholar-hall', 'Nalanda Digital E-Library & Research Nodes', 'नालंदा ई-लाइब्रेरी एवं डिजिटल रिसर्च सेल', 'library', '2024-25', 1, 'State-of-the-art digital access terminals connected to national research indices for media PhD scholars.', 'शोधार्थियों के लिए हाई-स्पीड इंटरनेट और डिजिटल डेटाबेस से सुसज्जित कंप्यूटर अध्ययन कक्ष।', '/memories/library-03.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/Nalanda-Central-Library-07.jpeg', 'MCU Archives (mcu.ac.in)', 3),

(4, 'nalanda-rare-books', 'Nalanda Library: Rare Historical Archives', 'नालंदा ग्रंथालय: दुर्लभ ऐतिहासिक दस्तावेज', 'library', '2024-25', 1, 'Preserving heritage journalism documents dating back to India\'s independence movement and Pt. Makhanlal Chaturvedi\'s works.', 'पंडित माखनलाल चतुर्वेदी जी के अमर साहित्य व स्वाधीनता आंदोलन के दुर्लभ प्रलेखों का सुरक्षित भंडार।', '/memories/library-04.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/Nalanda-Central-Library-10.jpeg', 'MCU Archives (mcu.ac.in)', 4),

(5, 'tv-broadcast-studio-01', 'Multi-Camera HD Broadcast Studio Floor', 'अत्याधुनिक मल्टी-कैमरा टीवी प्रसारण स्टूडियो', 'studios', '2024-25', 1, 'Equipped with robotic pan-tilt pedestals, professional teleprompters, and digital Chroma Key backdrops for news simulation.', 'राष्ट्रीय समाचार चैनलों जैसी अत्याधुनिक सुविधाओं से युक्त मल्टी-कैमरा टीवी स्टूडियो जहाँ छात्र लाइव बुलेटिन सीखते हैं।', '/memories/studio-01.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/studio-01.jpg', 'MCU Archives (mcu.ac.in)', 5),

(6, 'tv-anchor-desk-02', 'Professional TV Anchor Floor & Teleprompters', 'एंकर डेस्क व टेलीप्रॉम्प्टर फ्लोर', 'studios', '2024-25', 1, 'Hands-on live bulletin presentation, news debate moderation, and breaking news tracking for broadcast trainees.', 'एंकरिंग और लाइव रिपोर्टिंग की वास्तविक ट्रेनिंग हेतु सुसज्जित आधुनिक न्यूज़ एंकर डेस्क।', '/memories/studio-02.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/studio-02.jpg', 'MCU Archives (mcu.ac.in)', 6),

(7, 'studio-lighting-acoustics-03', 'Studio Lighting Grids & Multi-Track Audio', 'स्टूडियो लाइटिंग एवं मल्टी-ट्रैक साउंड फ्लोर', 'studios', '2024-25', 1, 'Broadcast-grade cool lights, acoustic baffles, and multi-channel audio boards matching national news standards.', 'उच्च गुणवत्ता वाले स्टूडियो लाइट ग्रिड्स और साउंड-प्रूफ एकॉस्टिक फ्लोर जहाँ ऑडियो-विजुअल प्रोग्राम बनते हैं।', '/memories/studio-03.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/studio-03.jpg', 'MCU Archives (mcu.ac.in)', 7),

(8, 'digital-media-lab-newsroom', 'Digital Newsroom & Pagination Production Lab', 'डिजिटल न्यूज़रूम व पेज-मेकिंग लैब', 'labs', '2024-25', 1, 'Mac and high-end PC workstations where journalism students produce campus gazettes and digital news editions.', 'अखबार के ले-आउट डिजाइनिंग एवं डिजिटल संस्करण तैयार करने हेतु समर्पित कंप्यूटर लैब।', '/memories/media-lab-01.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/media-lab-01.jpg', 'MCU Archives (mcu.ac.in)', 8),

(9, 'multimedia-graphics-lab', 'Graphic Design & Broadcast Infographics Suite', 'ग्राफिक्स एवं मल्टीमीडिया डिजाइनिंग लैब', 'labs', '2024-25', 1, 'Training students in 3D news tickers, data visualization charts, animated storytelling, and web graphics.', 'टेलीविजन व डिजिटल मीडिया के लिए इन्फोग्राफिक्स और 3D एनीमेशन सीखने की आधुनिक लैब।', '/memories/media-lab-02.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/media-lab-02.jpg', 'MCU Archives (mcu.ac.in)', 9),

(10, 'video-editing-4k-suite', '4K Non-Linear Video Editing Lab', '4K नॉन-लीनियर वीडियो एडिटिंग सुइट', 'labs', '2024-25', 1, 'Dedicated post-production suites running Premiere Pro, DaVinci Resolve, and Final Cut Pro for documentary and news editing.', 'डॉक्यूमेंट्री फिल्म निर्माण एवं टीवी पैकेज तैयार करने के लिए समर्पित वीडियो एडिटिंग सुइट।', '/memories/video-editing.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/video-editing.jpg', 'MCU Archives (mcu.ac.in)', 10),

(11, 'it-infrastructure-datacenter', 'High-Speed IT Infrastructure & Media Servers', 'हाई-स्पीड आईटी एवं मीडिया सर्वर नेटवर्क', 'labs', '2024-25', 3, 'High-bandwidth campus backbone ensuring uninterrupted broadcasting, e-classrooms, and digital streaming.', 'रीवा व भोपाल परिसरों को जोड़ने वाला उच्च क्षमता का आईटी एवं मीडिया नेटवर्क इंफ्रास्ट्रक्चर।', '/memories/it-infrastructure.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/it-infrastructure.jpg', 'MCU Archives (mcu.ac.in)', 11),

(12, 'auditorium-central-hall', 'Central University Auditorium (Ganesh Shankar Vidyarthi)', 'केंद्रीय विश्वविद्यालय सभागार (गणेश शंकर विद्यार्थी)', 'auditorium', '2024-25', 1, 'Host to national media summits, convocation ceremonies, and distinguished alumni induction lectures.', 'राष्ट्रीय मीडिया सम्मेलनों, दीक्षांत समारोहों और वार्षिक उत्सवों का साक्षी भव्य सभागार।', '/memories/auditorium-01.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/auditorium-01.jpg', 'MCU Archives (mcu.ac.in)', 12),

(13, 'auditorium-conclave-hall-02', 'Academic Conclave & Delegate Seating Floor', 'अकादमिक कॉन्क्लेव एवं प्रतिनिधि दीर्घा', 'auditorium', '2024-25', 3, 'Acoustically treated multi-tier seating accommodating large national gatherings and interactive masterclasses.', 'सैकड़ों प्रतिनिधियों की क्षमता वाला आधुनिक ध्वनिसंवेदी सभागार जहाँ अकादमिक विमर्श आयोजित होते हैं।', '/memories/auditorium-02.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2024/12/auditorium-02.jpg', 'MCU Archives (mcu.ac.in)', 13),

(14, 'spandan-youth-fest-folk-dance', 'Spandan National Youth Fest: Folk Traditions', 'स्पंदन राष्ट्रीय युवा उत्सव: लोक नृत्य प्रस्तुतियां', 'culture', '2023-24', 1, 'Celebrating the vibrant cultural tapestry of Madhya Pradesh and India through classical and folk dance competitions.', 'मध्य प्रदेश की समृद्ध लोक संस्कृति और परंपरागत नृत्यों की मंत्रमुग्ध कर देने वाली प्रस्तुतियां।', '/memories/culture-spandan-01.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2023/12/culture-12.jpg', 'MCU Archives (mcu.ac.in)', 14),

(15, 'spandan-youth-fest-gathering', 'Spandan Youth Fest: Grand Opening & Student Crowds', 'स्पंदन युवा उत्सव: भव्य शुभारंभ व छात्र समागम', 'culture', '2023-24', 1, 'Thousands of media scholars cheering during the annual inter-departmental university cultural extravaganza.', 'विश्वविद्यालय के वार्षिक युवा महोत्सव में उत्साह और ऊर्जा से भरे छात्र-छात्राओं का महासंगम।', '/memories/culture-spandan-02.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2023/12/culture-16.jpg', 'MCU Archives (mcu.ac.in)', 15),

(16, 'spandan-theatre-nukkad-natak', 'Spandan Street Play & Nukkad Natak for Social Change', 'स्पंदन नुक्कड़ नाटक एवं सामाजिक जागरूकता मंचन', 'culture', '2023-24', 1, 'Hard-hitting street plays performed by journalism students on environmental protection, gender equality, and press freedom.', 'सामाजिक सरोकारों, पर्यावरण संरक्षण एवं प्रेस स्वतंत्रता पर छात्रों द्वारा प्रस्तुत सशक्त नुक्कड़ नाटक।', '/memories/culture-spandan-03.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2023/12/culture-08.jpg', 'MCU Archives (mcu.ac.in)', 16),

(17, 'mcu-alumni-cell-foundation', 'Historical Foundation of MCU Alumni Cell', 'एमसीयू पूर्व छात्र प्रकोष्ठ (Alumni Cell) ऐतिहासिक स्थापना', 'heritage', '2021-22', 1, 'Official notification and resolution inaugurating the centralized statutory Alumni Cell under Vice Chancellor Prof. K.G. Suresh.', 'कुलपति प्रो. के.जी. सुरेश द्वारा विश्वविद्यालय के पूर्व छात्र प्रकोष्ठ के गठन की ऐतिहासिक अधिसूचना।', '/memories/alumni-cell-foundation.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2021/01/mcu-alumni-cell-01.jpg', 'MCU Archives (mcu.ac.in)', 17),

(18, 'republic-day-parade-grounds', 'Republic Day Ceremonial Parade at Campus', 'परिसर में गरिमामय गणतंत्र दिवस परेड', 'heritage', '2021-22', 1, 'Annual national flag hoisting, parade by student volunteers, and patriotic vows on the central grounds.', 'विश्वविद्यालय परिसर में तिरंगा फहराने और राष्ट्रभक्ति के संकल्प का भव्य वार्षिक समारोह।', '/memories/republic-day-parade.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2021/01/IMG-26012021-01.jpg', 'MCU Archives (mcu.ac.in)', 18),

(19, 'republic-day-salute-vc', 'National Flag Salutation & Patriotic Invocation', 'राष्ट्रध्वज को नमन एवं राष्ट्रीय संबोधन', 'heritage', '2021-22', 1, 'Commemorating national unity and ethical responsibilities of media stewards before the Tricolour.', 'स्वतंत्र और जिम्मेदार पत्रकारिता के संकल्प के साथ राष्ट्रध्वज को सलामी एवं विचार गोष्ठी।', '/memories/republic-day-salute.jpg', 'https://www.mcu.ac.in/wp-content/uploads/2021/01/IMG-26012021-02.jpg', 'MCU Archives (mcu.ac.in)', 19),

(20, 'alumni-media-conclave-meet', 'Senior Alumni Media Dialogue & Mentorship Session', 'वरिष्ठ पूर्व छात्र संवाद एवं पत्रकारिता कार्यशाला', 'heritage', '2021-22', 1, 'Senior editors and national correspondents visiting campus to interact directly with aspiring mass comm students.', 'वरिष्ठ पत्रकारों एवं पूर्व छात्रों द्वारा नए विद्यार्थियों के साथ प्रत्यक्ष संवाद व मार्गदर्शन सत्र।', '/memories/conclave-discussion.jpeg', 'https://www.mcu.ac.in/wp-content/uploads/2021/12/IMG_28122021_01.jpeg', 'MCU Archives (mcu.ac.in)', 20);

INSERT INTO `memory_tags` (`memory_id`, `tag_name`) VALUES
(1, 'NalandaLibrary'), (1, 'ReadingHall'),
(2, 'Periodicals'), (2, 'Karmaveer'),
(3, 'ELibrary'), (3, 'Research'),
(4, 'PtMakhanlal'), (4, 'RareBooks'),
(5, 'BroadcastStudio'), (5, 'Cameras'),
(6, 'NewsAnchor'), (6, 'Teleprompter'),
(7, 'AudioAcoustics'), (7, 'Lighting'),
(8, 'NewsroomLab'), (8, 'MacLab'),
(9, 'Graphics'), (9, 'Infographics'),
(10, 'VideoEditing'), (10, '4KPostProduction'),
(11, 'ITCenter'), (11, 'Networking'),
(12, 'Auditorium'), (12, 'Convocations'),
(13, 'ConclaveHall'), (13, 'Rewa'),
(14, 'SpandanFest'), (14, 'FolkDance'),
(15, 'CulturalEvening'), (15, 'YouthExtravaganza'),
(16, 'NukkadNatak'), (16, 'StreetPlay'),
(17, 'AlumniCell'), (17, 'Foundation'),
(18, 'RepublicDay'), (18, 'CeremonialParade'),
(19, 'TricolourSalute'), (19, 'Patriotism'),
(20, 'AlumniDialogue'), (20, 'Mentorship');

-- -----------------------------------------------------------------------------
-- 12. GIVING INITIATIVES & DONATIONS
-- -----------------------------------------------------------------------------
INSERT INTO `giving_initiatives`
(`id`, `slug`, `title`, `hindi_title`, `category`, `target_amount`, `raised_amount`, `description`, `hindi_description`, `image_url`, `status`)
VALUES
(1, 'rural-journalism-fellowship', 'Pt. Makhanlal Chaturvedi Rural Journalism Fellowship', 'पंडित माखनलाल चतुर्वेदी ग्रामीण पत्रकारिता छात्रवृत्ति', 'fellowship', 1000000.00, 680000.00, 'Funding grassroots investigative reporting grants for students covering remote tribal belts, farmer distress, and environmental conservation in MP.', 'मध्य प्रदेश के दूरदराज आदिवासी अंचलों, ग्रामीण समस्याओं और पर्यावरण पर शोधपूर्ण रिपोर्टिंग करने वाले मेधावी छात्रों हेतु वार्षिक फेलोशिप निधि।', 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=600&q=80', 'active'),

(2, 'bishankhedi-broadcast-studio-fund', 'Bishankhedi AI & Next-Gen Broadcast Studio Upgrades', 'बिसनखेड़ी नेक्स्ट-जेन एआई एवं पॉडकास्ट स्टूडियो आधुनिकीकरण', 'infrastructure', 2500000.00, 1420000.00, 'Equipping our Bishankhedi production floors with 4K HDR robotic cameras, automated teleprompting, and multi-track podcast recording suites.', 'नए बिसनखेड़ी परिसर में छात्रों के लिए 4K एचडीआर कैमरा सिस्टम, पॉडकास्ट स्टेशन और आधुनिक ऑडियो-विजुअल संपादन उपकरणों का विस्तार।', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80', 'active'),

(3, 'student-medical-emergency-fund', 'Alumni Emergency Medical & Hardship Assistance Fund', 'पूर्व छात्र आपातकालीन छात्र कल्याण एवं चिकित्सा सहायता कोष', 'emergency_fund', 500000.00, 395000.00, 'Providing immediate financial assistance, medical insurance support, and family hardship aid for students during unforeseen emergencies.', 'अध्ययनरत आर्थिक रूप से कमजोर विद्यार्थियों को गंभीर बीमारी, पारिवारिक संकट या अप्रत्याशित आकस्मिक परिस्थितियों में तुरंत आर्थिक संबल प्रदान करने वाली निधि।', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=600&q=80', 'active');

INSERT INTO `donations` (`initiative_id`, `donor_user_id`, `donor_name`, `donor_email`, `pan_number`, `amount`, `payment_reference`, `payment_status`, `is_anonymous`) VALUES
(1, 1, 'Prashant Shrivastava', 'prashant.s@indianexpress.com', 'ABCDE1234F', 25000.00, 'MCU-DON-2026-001', 'completed', FALSE),
(1, 2, 'Meenakshi Joshi', 'meenakshi.j@indiatvnews.com', 'JKLMN5678P', 50000.00, 'MCU-DON-2026-002', 'completed', FALSE),
(2, 3, 'Anurag Sharma', 'anurag.s@ogilvy.com', 'PQRSZ9876K', 25000.00, 'MCU-DON-2026-003', 'completed', FALSE),
(3, 8, 'Vikram Rathore', 'vikram.r@tatasteel.com', 'TUVWX4321M', 15000.00, 'MCU-DON-2026-004', 'completed', FALSE);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- End of Seed Data
-- =============================================================================
