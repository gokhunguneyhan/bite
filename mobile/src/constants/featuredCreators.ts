import type { Category } from '@/src/types/summary';

export interface FeaturedCreator {
  name: string;
  channelId: string;
  category: Category;
  description: string;
}

export const FEATURED_CREATORS: FeaturedCreator[] = [
  // Tech
  { name: 'Fireship', channelId: 'UCsBjURrPoezykLs9EqgamOA', category: 'Tech', description: 'Fast-paced tech explainers' },
  { name: 'Theo', channelId: 'UCbRP3c757lWg9M-U7TyEkXA', category: 'Tech', description: 'Web dev & startups' },
  { name: 'ThePrimeagen', channelId: 'UCUyeluBRhGPCW4dMRkIl8Cw', category: 'Tech', description: 'Programming & performance' },
  // Business
  { name: 'My First Million', channelId: 'UCfBNMEaFWGMTiT9aze_GPGA', category: 'Business', description: 'Business ideas & trends' },
  { name: 'Ali Abdaal', channelId: 'UCoOae5nYA7VqaXzerajD0lg', category: 'Business', description: 'Productivity & entrepreneurship' },
  // Finance
  { name: 'The Swedish Investor', channelId: 'UCAeAB8ABXGoGMbXc132TSMQ', category: 'Finance', description: 'Book summaries on wealth' },
  { name: 'Graham Stephan', channelId: 'UCa-ckhlKL98F8YXKQ-BALiw', category: 'Finance', description: 'Personal finance & investing' },
  // Science
  { name: 'Veritasium', channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA', category: 'Science', description: 'Science & engineering' },
  { name: 'Kurzgesagt', channelId: 'UCsXVk37bltHxD1rDPwtNM8Q', category: 'Science', description: 'Science animations' },
  // Self-improvement
  { name: 'Andrew Huberman', channelId: 'UC2D2CMWXMOVWx7giW1n3LIg', category: 'Self-improvement', description: 'Neuroscience & health' },
  { name: 'Chris Williamson', channelId: 'UCIyRVR8NAmrGJHqjN0MFbeg', category: 'Self-improvement', description: 'Modern wisdom podcast' },
  // Health
  { name: 'Jeff Nippard', channelId: 'UC68TLK0mAEzUyHx5x5k-S1Q', category: 'Health', description: 'Science-based fitness' },
  // Education
  { name: '3Blue1Brown', channelId: 'UCYO_jab_esuFRV4b17AJtAw', category: 'Education', description: 'Math visualized' },
  { name: 'CrashCourse', channelId: 'UCX6b17PVsYBQ0ip5gyeme-Q', category: 'Education', description: 'Courses on everything' },
  // Productivity
  { name: 'Thomas Frank', channelId: 'UCG-KntY7aVnIGXYEBQvmBAQ', category: 'Productivity', description: 'Study & productivity tips' },
];

export const FEATURED_CATEGORIES = [
  ...new Set(FEATURED_CREATORS.map((c) => c.category)),
] as Category[];
