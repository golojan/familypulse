import {
  BookOpen,
  BriefcaseBusiness,
  Heart,
  MessageCircle,
  ShieldCheck,
  Star,
  Video,
  type LucideIcon,
} from "lucide-react";

export type Article = {
  tag: string;
  title: string;
  image: string;
  meta: string;
  read: string;
};

export type PodcastEpisode = {
  title: string;
  desc: string;
  time: string;
};

export type MediaCard = {
  label: string;
  title: string;
  image: string;
  icon: LucideIcon;
};

export type QuickTopic = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export const articles: Article[] = [
  {
    tag: "Communication",
    title: "Building Stronger Family Communication",
    image:
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
    meta: "May 10, 2024",
    read: "8 min read",
  },
  {
    tag: "Parenting",
    title: "Discipline Without Fear: A Gentle Approach",
    image:
      "https://images.unsplash.com/photo-1597589827317-4c6d6e0a90a8?auto=format&fit=crop&w=900&q=80",
    meta: "May 6, 2024",
    read: "7 min read",
  },
  {
    tag: "Balance",
    title: "Balancing Work and Parenting Effectively",
    image:
      "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=900&q=80",
    meta: "May 2, 2024",
    read: "6 min read",
  },
];

export const podcasts: PodcastEpisode[] = [
  {
    title: "The Power of Family Meetings",
    desc: "Simple conversations that bring your family closer and solve problems together.",
    time: "26:18",
  },
  {
    title: "Raising Emotionally Strong Kids",
    desc: "Practical steps to build confidence, resilience and emotional intelligence.",
    time: "25:36",
  },
  {
    title: "Keeping Romance Alive",
    desc: "Real talk for couples to keep the spark and deepen connection.",
    time: "22:11",
  },
];

export const mediaCards: MediaCard[] = [
  {
    label: "Videos",
    title: "5 Tips for Better Family Conversations",
    image:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=700&q=80",
    icon: Video,
  },
  {
    label: "Educational Reads",
    title: "Helping Kids Manage Big Emotions",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=700&q=80",
    icon: BookOpen,
  },
  {
    label: "Relationship Advice",
    title: "Healthy Marriage Conversations",
    image:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80",
    icon: Heart,
  },
  {
    label: "Parenting & Discipline",
    title: "Positive Discipline That Works",
    image:
      "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=700&q=80",
    icon: ShieldCheck,
  },
  {
    label: "Work-Life Balance",
    title: "Set Boundaries, Protect Your Peace",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=80",
    icon: BriefcaseBusiness,
  },
];

export const quickTopics: QuickTopic[] = [
  { icon: MessageCircle, title: "Communication", desc: "Build stronger connections" },
  { icon: ShieldCheck, title: "Parenting & Discipline", desc: "Positive guidance that works" },
  { icon: Heart, title: "Marriage & Relationships", desc: "Stronger together, every day" },
  { icon: BriefcaseBusiness, title: "Work-Life Balance", desc: "Thrive at home and work" },
  { icon: Star, title: "Child Development", desc: "Support your child's growth" },
];

export const trendingTopics = [
  "Gentle Parenting",
  "Family Communication",
  "Toddler Tantrums",
  "Marriage Tips",
  "Screen Time",
  "Self Care",
  "Morning Routine",
];
