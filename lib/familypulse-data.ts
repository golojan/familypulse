import {
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Heart,
  Home,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Star,
  Video,
  type LucideIcon,
} from "lucide-react";

export type Article = {
  tag: string;
  title: string;
  type?: "ARTICLE" | "VIDEO" | "PODCAST";
  image: string;
  videoUrl?: string | null;
  audioUrl?: string | null;
  meta: string;
  read: string;
  slug?: string;
  href?: string;
  topicTitle?: string;
  topicSlug?: string;
  topicHref?: string;
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
  href?: string;
};

export type QuickTopic = {
  icon: LucideIcon;
  title: string;
  desc: string;
  slug: string;
  href: string;
};

export type PopularPost = {
  title: string;
  image: string;
  meta: string;
  read: string;
  href?: string;
};

export type TopicBlogSection = {
  title: string;
  slug: string;
  href: string;
  posts: Article[];
};

export type Topic = {
  icon: LucideIcon;
  title: string;
  desc: string;
  slug: string;
  href: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTopicHref(titleOrSlug: string) {
  const slug = titleOrSlug.includes("-") ? titleOrSlug : slugify(titleOrSlug);
  return `/topics/${slug}`;
}

export function getArticleHref(article: Pick<Article, "title" | "slug" | "href">) {
  return article.href ?? `/posts/${article.slug ?? slugify(article.title)}`;
}

function withArticleTopic(article: Article, topicTitle: string): Article {
  const topicSlug = slugify(topicTitle);
  const slug = article.slug ?? slugify(article.title);

  return {
    ...article,
    slug,
    href: article.href ?? `/posts/${slug}`,
    topicTitle,
    topicSlug,
    topicHref: getTopicHref(topicSlug),
  };
}

export const topics: Topic[] = [
  { icon: MessageCircle, title: "Communication", desc: "Build stronger connections", slug: "communication", href: "/topics/communication" },
  { icon: ShieldCheck, title: "Parenting & Discipline", desc: "Positive guidance that works", slug: "parenting-discipline", href: "/topics/parenting-discipline" },
  { icon: Heart, title: "Marriage & Relationships", desc: "Stronger together, every day", slug: "marriage-relationships", href: "/topics/marriage-relationships" },
  { icon: BriefcaseBusiness, title: "Work-Life Balance", desc: "Thrive at home and work", slug: "work-life-balance", href: "/topics/work-life-balance" },
  { icon: Star, title: "Child Development", desc: "Support your child's growth", slug: "child-development", href: "/topics/child-development" },
  { icon: Brain, title: "Mental Wellness", desc: "Calm habits for every day", slug: "mental-wellness", href: "/topics/mental-wellness" },
  { icon: PartyPopper, title: "Family Activities", desc: "Simple ways to connect", slug: "family-activities", href: "/topics/family-activities" },
  { icon: Home, title: "Faith & Values", desc: "Shared values at home", slug: "faith-values", href: "/topics/faith-values" },
];

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
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
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
    href: "/topics/communication",
  },
  {
    label: "Educational Reads",
    title: "Helping Kids Manage Big Emotions",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=700&q=80",
    icon: BookOpen,
    href: "/topics/child-development",
  },
  {
    label: "Relationship Advice",
    title: "Healthy Marriage Conversations",
    image:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80",
    icon: Heart,
    href: "/topics/marriage-relationships",
  },
  {
    label: "Parenting & Discipline",
    title: "Positive Discipline That Works",
    image:
      "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=700&q=80",
    icon: ShieldCheck,
    href: "/topics/parenting-discipline",
  },
  {
    label: "Work-Life Balance",
    title: "Set Boundaries, Protect Your Peace",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=80",
    icon: BriefcaseBusiness,
    href: "/topics/work-life-balance",
  },
];

export const quickTopics: QuickTopic[] = topics;

export const trendingTopics = [
  { title: "Gentle Parenting", href: "/topics/parenting-discipline" },
  { title: "Family Communication", href: "/topics/communication" },
  { title: "Toddler Tantrums", href: "/topics/parenting-discipline" },
  { title: "Marriage Tips", href: "/topics/marriage-relationships" },
  { title: "Screen Time", href: "/topics/family-activities" },
  { title: "Self Care", href: "/topics/mental-wellness" },
  { title: "Morning Routine", href: "/topics/work-life-balance" },
];

export const popularPosts: PopularPost[] = [
  {
    title: "Building Stronger Family Communication",
    image:
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=420&q=80",
    meta: "May 10, 2024",
    read: "8 min read",
  },
  {
    title: "Discipline Without Fear: A Gentle Approach",
    image:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=420&q=80",
    meta: "May 6, 2024",
    read: "7 min read",
  },
  {
    title: "Balancing Work and Parenting Effectively",
    image:
      "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=420&q=80",
    meta: "May 2, 2024",
    read: "6 min read",
  },
  {
    title: "Healthy Marriage Conversations",
    image:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=420&q=80",
    meta: "Apr 28, 2024",
    read: "9 min read",
  },
  {
    title: "Raising Confident Children in Today's World",
    image:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=420&q=80",
    meta: "Apr 24, 2024",
    read: "7 min read",
  },
];

const baseTopicBlogSections: Array<Omit<TopicBlogSection, "slug">> = [
  {
    title: "Communication",
    href: "#communication",
    posts: [
      {
        tag: "Communication",
        title: "Building Stronger Family Communication",
        image:
          "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
        meta: "May 10, 2024",
        read: "8 min read",
      },
      {
        tag: "Communication",
        title: "5 Tips for Better Family Conversations",
        image:
          "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80",
        meta: "May 8, 2024",
        read: "6 min read",
      },
      {
        tag: "Communication",
        title: "How to Hold a Weekly Family Meeting",
        image:
          "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80",
        meta: "May 4, 2024",
        read: "7 min read",
      },
    ],
  },
  {
    title: "Parenting & Discipline",
    href: "#parenting-discipline",
    posts: [
      {
        tag: "Parenting",
        title: "Discipline Without Fear: A Gentle Approach",
        image:
          "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
        meta: "May 6, 2024",
        read: "7 min read",
      },
      {
        tag: "Discipline",
        title: "Positive Discipline That Works",
        image:
          "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 26, 2024",
        read: "7 min read",
      },
      {
        tag: "Parenting",
        title: "Calm Responses for Big Kid Emotions",
        image:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 22, 2024",
        read: "6 min read",
      },
    ],
  },
  {
    title: "Marriage & Relationships",
    href: "#marriage-relationships",
    posts: [
      {
        tag: "Marriage",
        title: "Healthy Marriage Conversations",
        image:
          "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 28, 2024",
        read: "9 min read",
      },
      {
        tag: "Couples",
        title: "Keeping Romance Alive",
        image:
          "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 20, 2024",
        read: "8 min read",
      },
      {
        tag: "Relationships",
        title: "Repairing Conflict After a Hard Conversation",
        image:
          "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 16, 2024",
        read: "7 min read",
      },
    ],
  },
  {
    title: "Work-Life Balance",
    href: "#work-life-balance",
    posts: [
      {
        tag: "Balance",
        title: "Balancing Work and Parenting Effectively",
        image:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=900&q=80",
        meta: "May 2, 2024",
        read: "6 min read",
      },
      {
        tag: "Work-Life",
        title: "Set Boundaries, Protect Your Peace",
        image:
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 24, 2024",
        read: "9 min read",
      },
      {
        tag: "Routines",
        title: "Morning Routines That Lower Family Stress",
        image:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 18, 2024",
        read: "5 min read",
      },
    ],
  },
  {
    title: "Child Development",
    href: "#child-development",
    posts: [
      {
        tag: "Development",
        title: "Helping Kids Manage Big Emotions",
        image:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 30, 2024",
        read: "6 min read",
      },
      {
        tag: "Confidence",
        title: "Raising Confident Children in Today's World",
        image:
          "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 24, 2024",
        read: "7 min read",
      },
      {
        tag: "Growth",
        title: "Simple Habits That Support Your Child's Growth",
        image:
          "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 17, 2024",
        read: "6 min read",
      },
    ],
  },
  {
    title: "Mental Wellness",
    href: "#mental-wellness",
    posts: [
      {
        tag: "Wellness",
        title: "Small Reset Rituals for Busy Parents",
        image:
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 29, 2024",
        read: "5 min read",
      },
      {
        tag: "Self Care",
        title: "How Parents Can Recharge Without Guilt",
        image:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 21, 2024",
        read: "7 min read",
      },
      {
        tag: "Calm",
        title: "Creating a Calmer Home After School",
        image:
          "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 15, 2024",
        read: "6 min read",
      },
    ],
  },
  {
    title: "Family Activities",
    href: "#family-activities",
    posts: [
      {
        tag: "Activities",
        title: "Weekend Activities That Build Connection",
        image:
          "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 27, 2024",
        read: "5 min read",
      },
      {
        tag: "Play",
        title: "Screen-Free Ideas for After Dinner",
        image:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 19, 2024",
        read: "6 min read",
      },
      {
        tag: "Family Time",
        title: "Simple Traditions Kids Remember",
        image:
          "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 12, 2024",
        read: "5 min read",
      },
    ],
  },
  {
    title: "Faith & Values",
    href: "#faith-values",
    posts: [
      {
        tag: "Values",
        title: "Teaching Values Through Everyday Choices",
        image:
          "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 23, 2024",
        read: "6 min read",
      },
      {
        tag: "Faith",
        title: "Family Reflection Questions for the Week",
        image:
          "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 14, 2024",
        read: "5 min read",
      },
      {
        tag: "Character",
        title: "Modeling Kindness When Home Feels Busy",
        image:
          "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
        meta: "Apr 8, 2024",
        read: "6 min read",
      },
    ],
  },
];

const topicBlogExtras: Record<string, Article[]> = {
  Communication: [
    {
      tag: "Listening",
      title: "Listening Habits That Help Kids Open Up",
      image:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 28, 2024",
      read: "6 min read",
    },
    {
      tag: "Conflict",
      title: "What to Say When Family Talks Get Heated",
      image:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 21, 2024",
      read: "7 min read",
    },
    {
      tag: "Connection",
      title: "Dinner Table Questions That Spark Better Talks",
      image:
        "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 13, 2024",
      read: "5 min read",
    },
  ],
  "Parenting & Discipline": [
    {
      tag: "Boundaries",
      title: "Setting Limits Without Constant Power Struggles",
      image:
        "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 18, 2024",
      read: "8 min read",
    },
    {
      tag: "Toddlers",
      title: "Handling Toddler Tantrums With More Calm",
      image:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 11, 2024",
      read: "6 min read",
    },
    {
      tag: "Repair",
      title: "How to Reconnect After You Lose Your Cool",
      image:
        "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 6, 2024",
      read: "5 min read",
    },
  ],
  "Marriage & Relationships": [
    {
      tag: "Couples",
      title: "Weekly Check-Ins That Keep Couples Aligned",
      image:
        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 10, 2024",
      read: "6 min read",
    },
    {
      tag: "Trust",
      title: "Small Daily Actions That Rebuild Trust",
      image:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 4, 2024",
      read: "7 min read",
    },
    {
      tag: "Teamwork",
      title: "Dividing Home Responsibilities Without Resentment",
      image:
        "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 28, 2024",
      read: "8 min read",
    },
  ],
  "Work-Life Balance": [
    {
      tag: "Planning",
      title: "A Sunday Planning Rhythm for Busy Families",
      image:
        "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 12, 2024",
      read: "6 min read",
    },
    {
      tag: "Remote Work",
      title: "Working From Home Without Losing Family Focus",
      image:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 5, 2024",
      read: "7 min read",
    },
    {
      tag: "Energy",
      title: "Protecting Your Energy During Busy Seasons",
      image:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 29, 2024",
      read: "5 min read",
    },
  ],
  "Child Development": [
    {
      tag: "Learning",
      title: "Play-Based Learning Ideas for Everyday Moments",
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 10, 2024",
      read: "6 min read",
    },
    {
      tag: "Independence",
      title: "Age-Appropriate Chores That Build Confidence",
      image:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 3, 2024",
      read: "5 min read",
    },
    {
      tag: "Emotions",
      title: "Helping Children Name What They Feel",
      image:
        "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 27, 2024",
      read: "7 min read",
    },
  ],
  "Mental Wellness": [
    {
      tag: "Stress",
      title: "Recognizing Parent Burnout Before It Spikes",
      image:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 8, 2024",
      read: "6 min read",
    },
    {
      tag: "Mindfulness",
      title: "Two-Minute Calm Practices for the Whole Family",
      image:
        "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 1, 2024",
      read: "5 min read",
    },
    {
      tag: "Rest",
      title: "Building Better Sleep Cues at Home",
      image:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 25, 2024",
      read: "6 min read",
    },
  ],
  "Family Activities": [
    {
      tag: "Outdoor",
      title: "Low-Prep Outdoor Games for Mixed Ages",
      image:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 6, 2024",
      read: "5 min read",
    },
    {
      tag: "Creative",
      title: "Simple Art Projects That Invite Conversation",
      image:
        "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 30, 2024",
      read: "6 min read",
    },
    {
      tag: "Connection",
      title: "Family Challenges That Build Teamwork",
      image:
        "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 23, 2024",
      read: "5 min read",
    },
  ],
  "Faith & Values": [
    {
      tag: "Gratitude",
      title: "Practicing Gratitude Without Making It Forced",
      image:
        "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80",
      meta: "Apr 2, 2024",
      read: "5 min read",
    },
    {
      tag: "Service",
      title: "Small Service Projects Families Can Do Together",
      image:
        "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 26, 2024",
      read: "6 min read",
    },
    {
      tag: "Purpose",
      title: "Talking About Purpose With Younger Kids",
      image:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
      meta: "Mar 20, 2024",
      read: "6 min read",
    },
  ],
};

export const topicBlogSections: TopicBlogSection[] = baseTopicBlogSections.map((section) => ({
  title: section.title,
  slug: slugify(section.title),
  href: getTopicHref(section.title),
  posts: [...section.posts, ...(topicBlogExtras[section.title] ?? [])]
    .slice(0, 6)
    .map((post) => withArticleTopic(post, section.title)),
}));

export const allPosts: Article[] = Array.from(
  new Map(
    topicBlogSections
      .flatMap((section) => section.posts)
      .map((post) => [post.slug ?? slugify(post.title), post])
  ).values()
);

export function getTopicBySlug(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export function getPostsByTopicSlug(slug: string) {
  return allPosts.filter((post) => post.topicSlug === slug);
}

export function getPostBySlug(slug: string) {
  return allPosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(post: Article, limit = 3) {
  return allPosts
    .filter((item) => item.topicSlug === post.topicSlug && item.slug !== post.slug)
    .slice(0, limit);
}
