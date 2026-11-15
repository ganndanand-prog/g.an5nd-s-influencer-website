export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  url: string;
  tags: string[];
  year: string;
  featured?: boolean;
}

export interface SkillCategory {
  title: string;
  description?: string;
  skills: { name: string; level: number; note?: string }[];
}

export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  description: string;
}

export interface InstagramStat {
  label: string;
  value: string;
  change?: string;
  description: string;
  icon: string;
}

export interface InstagramReelWork {
  id: string;
  title: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  hook: string;
  theme: string;
  image: string;
  videoUrl?: string;
  tag: string;
  sortOrder?: number;
}

export interface PricingPackage {
  id: string;
  title: string;
  badge?: string;
  priceAmount?: string;
  priceNote: string;
  deliverables: string[];
  timeline: string;
  idealFor: string;
  popular?: boolean;
  active?: boolean;
  sortOrder?: number;
}

export interface SiteContentData {
  greeting: string;
  heroTitle: string;
  heroSubtitle: string;
  bioPrimary: string;
  bioSecondary: string;
  phone: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  location: string;
  aboutIntro: string;
  aboutQuote: string;
  footerSlogan: string;
  totalViews: string;
  avgViews: string;
  engagementRate: string;
  targetAge: string;
}

export interface PrincipleItem {
  id: string;
  title: string;
  desc: string;
  status: 'allowed' | 'forbidden';
}

export interface PortfolioProfile {
  name: string;
  title: string;
  subtitle: string;
  greeting?: string;
  bio: string[];
  email: string;
  phone: string;
  location: string;
  netlifyBaseUrl: string;
  instagramHandle: string;
  socials: {
    facebook?: string;
    instagram: string;
    telegram?: string;
    github?: string;
  };
}
