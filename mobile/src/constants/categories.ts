export const MAIN_CATEGORIES = [
  'Technology & AI',
  'Business & Startups',
  'Finance & Investing',
  'Science & Space',
  'Health & Fitness',
  'Self-Improvement',
  'Education & Learning',
  'Creative & Design',
  'Politics & Society',
  'Entertainment & Media',
  'Lifestyle & Culture',
  'Career & Professional Growth',
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const SUBCATEGORIES: Record<MainCategory, string[]> = {
  'Technology & AI': ['AI & Machine Learning', 'Programming', 'Gadgets & Reviews', 'Cybersecurity', 'Web Development', 'Cloud & DevOps', 'Open Source'],
  'Business & Startups': ['Entrepreneurship', 'Marketing & Growth', 'Leadership', 'SaaS', 'E-commerce', 'Venture Capital', 'Side Hustles'],
  'Finance & Investing': ['Stock Market', 'Crypto & Web3', 'Personal Finance', 'Real Estate', 'FIRE Movement', 'Tax Strategy', 'Budgeting'],
  'Science & Space': ['Physics', 'Biology', 'Space & Astronomy', 'Climate & Environment', 'Chemistry', 'Mathematics', 'Engineering'],
  'Health & Fitness': ['Nutrition', 'Strength Training', 'Mental Health', 'Sleep Science', 'Biohacking', 'Longevity', 'Sports'],
  'Self-Improvement': ['Productivity', 'Habits & Routines', 'Mindset & Motivation', 'Communication Skills', 'Stoicism', 'Journaling', 'Deep Work'],
  'Education & Learning': ['History', 'Philosophy', 'Psychology', 'Languages', 'Study Techniques', 'Critical Thinking', 'Online Courses'],
  'Creative & Design': ['UI/UX Design', 'Graphic Design', 'Photography', 'Video Production', 'Music Production', 'Writing & Copywriting', '3D & Animation'],
  'Politics & Society': ['Geopolitics', 'Economics', 'Social Commentary', 'Law & Policy', 'Media Literacy', 'Ethics', 'Debate'],
  'Entertainment & Media': ['Film & TV Analysis', 'Gaming', 'Pop Culture', 'Book Reviews', 'Anime & Manga', 'Music', 'Comedy'],
  'Lifestyle & Culture': ['Travel', 'Cooking & Food', 'Fashion', 'Home & Interior', 'Relationships', 'Minimalism', 'Parenting'],
  'Career & Professional Growth': ['Job Hunting', 'Remote Work', 'Freelancing', 'Networking', 'Salary Negotiation', 'Career Switching', 'Interview Skills'],
};
