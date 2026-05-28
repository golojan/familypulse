import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const TOPICS = [
  {
    title: "Communication",
    description: "Build stronger connections",
    icon: "MessageCircle",
    subtopics: [
      "Family meetings",
      "Conflict repair",
      "Listening habits",
      "Digital boundaries",
    ],
  },
  {
    title: "Parenting & Discipline",
    description: "Positive guidance that works",
    icon: "ShieldCheck",
    subtopics: [
      "Toddler guidance",
      "Teen independence",
      "Consequences",
      "Co-parenting rules",
    ],
  },
  {
    title: "Marriage & Relationships",
    description: "Stronger together, every day",
    icon: "Heart",
    subtopics: [
      "Date-night rituals",
      "Money conversations",
      "Intimacy",
      "Repair after conflict",
    ],
  },
  {
    title: "Work-Life Balance",
    description: "Thrive at home and work",
    icon: "BriefcaseBusiness",
    subtopics: [
      "Flexible schedules",
      "Burnout recovery",
      "Shared chores",
      "Remote-work routines",
    ],
  },
  {
    title: "Child Development",
    description: "Support your child's growth",
    icon: "Star",
    subtopics: [
      "Early learning",
      "School readiness",
      "Emotional skills",
      "Screen time",
    ],
  },
  {
    title: "Mental Wellness",
    description: "Calm habits for every day",
    icon: "Brain",
    subtopics: [
      "Family stress",
      "Anxiety support",
      "Sleep routines",
      "Caregiver resilience",
    ],
  },
  {
    title: "Family Activities",
    description: "Simple ways to connect",
    icon: "PartyPopper",
    subtopics: [
      "Weekend plans",
      "Low-cost outings",
      "Holiday traditions",
      "At-home play",
    ],
  },
  {
    title: "Faith & Values",
    description: "Shared values at home",
    icon: "Home",
    subtopics: [
      "Family service",
      "Gratitude",
      "Character habits",
      "Interfaith homes",
    ],
  },
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function writerPrompt(parentTitle: string, subtopic?: string) {
  const focus = subtopic ? `${parentTitle}: ${subtopic}` : parentTitle;
  return `Writer column for ${focus}. Prioritize practical examples, family-safe language, and one clear takeaway.`;
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DIRECT_URL or DATABASE_URL must be set for Prisma seeding.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const topic of TOPICS) {
      const slug = slugify(topic.title);
      const parent = await prisma.topic.upsert({
        where: { slug },
        create: {
          title: topic.title,
          slug,
          description: topic.description,
          icon: topic.icon,
          writerPrompt: writerPrompt(topic.title),
        },
        update: {
          title: topic.title,
          description: topic.description,
          icon: topic.icon,
          writerPrompt: writerPrompt(topic.title),
          parentId: null,
        },
      });

      for (const subtopic of topic.subtopics) {
        const subtopicSlug = `${slug}-${slugify(subtopic)}`;
        await prisma.topic.upsert({
          where: { slug: subtopicSlug },
          create: {
            title: subtopic,
            slug: subtopicSlug,
            description: `${subtopic} stories and guides under ${topic.title}.`,
            icon: topic.icon,
            writerPrompt: writerPrompt(topic.title, subtopic),
            parentId: parent.id,
          },
          update: {
            title: subtopic,
            description: `${subtopic} stories and guides under ${topic.title}.`,
            icon: topic.icon,
            writerPrompt: writerPrompt(topic.title, subtopic),
            parentId: parent.id,
          },
        });
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("Seeded topics and subtopics.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
