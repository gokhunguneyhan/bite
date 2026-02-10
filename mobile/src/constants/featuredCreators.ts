export interface FeaturedCreator {
  name: string;
  channelId: string;
  category: string;
  description: string;
}

export const FEATURED_CREATORS: FeaturedCreator[] = [
  // Technology & AI
  { name: 'Fireship', channelId: 'UCsBjURrPoezykLs9EqgamOA', category: 'Technology & AI', description: 'Fast-paced tech explainers' },
  { name: 'Theo', channelId: 'UCbRP3c757lWg9M-U7TyEkXA', category: 'Technology & AI', description: 'Web dev & startups' },
  { name: 'ThePrimeagen', channelId: 'UCUyeluBRhGPCW4dMRkIl8Cw', category: 'Technology & AI', description: 'Programming & performance' },
  // Business & Startups
  { name: 'My First Million', channelId: 'UCfBNMEaFWGMTiT9aze_GPGA', category: 'Business & Startups', description: 'Business ideas & trends' },
  { name: 'Ali Abdaal', channelId: 'UCoOae5nYA7VqaXzerajD0lg', category: 'Business & Startups', description: 'Productivity & entrepreneurship' },
  // Finance & Investing
  { name: 'The Swedish Investor', channelId: 'UCAeAB8ABXGoGMbXc132TSMQ', category: 'Finance & Investing', description: 'Book summaries on wealth' },
  { name: 'Graham Stephan', channelId: 'UCa-ckhlKL98F8YXKQ-BALiw', category: 'Finance & Investing', description: 'Personal finance & investing' },
  // Science & Space
  { name: 'Veritasium', channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA', category: 'Science & Space', description: 'Science & engineering' },
  { name: 'Kurzgesagt', channelId: 'UCsXVk37bltHxD1rDPwtNM8Q', category: 'Science & Space', description: 'Science animations' },
  // Self-Improvement
  { name: 'Andrew Huberman', channelId: 'UC2D2CMWXMOVWx7giW1n3LIg', category: 'Self-Improvement', description: 'Neuroscience & health' },
  { name: 'Chris Williamson', channelId: 'UCIyRVR8NAmrGJHqjN0MFbeg', category: 'Self-Improvement', description: 'Modern wisdom podcast' },
  // Health & Fitness
  { name: 'Jeff Nippard', channelId: 'UC68TLK0mAEzUyHx5x5k-S1Q', category: 'Health & Fitness', description: 'Science-based fitness' },
  // Education & Learning
  { name: '3Blue1Brown', channelId: 'UCYO_jab_esuFRV4b17AJtAw', category: 'Education & Learning', description: 'Math visualized' },
  { name: 'CrashCourse', channelId: 'UCX6b17PVsYBQ0ip5gyeme-Q', category: 'Education & Learning', description: 'Courses on everything' },
  { name: 'Thomas Frank', channelId: 'UCG-KntY7aVnIGXYEBQvmBAQ', category: 'Education & Learning', description: 'Study & productivity tips' },
];

export const FEATURED_CATEGORIES = [
  ...new Set(FEATURED_CREATORS.map((c) => c.category)),
];
