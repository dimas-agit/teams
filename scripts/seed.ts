import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { Board, Column, JobApplication } from "../lib/models";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const envFile = fs.readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const USER_ID = process.env.SEED_USER_ID || "6a8a967ddf1376c509395e8a";

const columns = [
  { name: "Wishlist", order: 0 },
  { name: "Applied", order: 1 },
  { name: "Interviewing", order: 2 },
  { name: "Offer", order: 3 },
  { name: "Rejected", order: 4 },
];

const jobs = [
  {
    company: "Linear",
    position: "Frontend Engineer",
    location: "Remote",
    salary: "$120k - $155k",
    jobUrl: "https://linear.app/careers",
    tags: ["React", "TypeScript", "Product"],
    description: "Build polished workflow interfaces for product teams.",
    notes: "Strong fit for UI craft and productivity tooling.",
    columnName: "Wishlist",
  },
  {
    company: "Vercel",
    position: "Next.js Developer Advocate",
    location: "Remote",
    salary: "$130k - $170k",
    jobUrl: "https://vercel.com/careers",
    tags: ["Next.js", "Content", "Developer Relations"],
    description: "Create demos, guides, and talks for the Next.js ecosystem.",
    notes: "Prepare portfolio examples before applying.",
    columnName: "Wishlist",
  },
  {
    company: "Stripe",
    position: "Full Stack Engineer",
    location: "Seattle, WA",
    salary: "$150k - $210k",
    jobUrl: "https://stripe.com/jobs",
    tags: ["Node.js", "React", "Payments"],
    description: "Work on merchant-facing payment and dashboard experiences.",
    notes: "Referral requested from alumni network.",
    columnName: "Applied",
  },
  {
    company: "Notion",
    position: "Product Engineer",
    location: "San Francisco, CA",
    salary: "$145k - $195k",
    jobUrl: "https://www.notion.com/careers",
    tags: ["Collaboration", "Editor", "React"],
    description: "Ship features across collaborative workspace surfaces.",
    notes: "Application submitted with custom cover letter.",
    columnName: "Applied",
  },
  {
    company: "Shopify",
    position: "Backend Engineer",
    location: "Remote Canada/US",
    salary: "$125k - $180k",
    jobUrl: "https://www.shopify.com/careers",
    tags: ["API", "Databases", "Commerce"],
    description: "Design services for commerce infrastructure.",
    notes: "Need to review system design notes.",
    columnName: "Applied",
  },
  {
    company: "Atlassian",
    position: "Senior Software Engineer",
    location: "Remote",
    salary: "$140k - $200k",
    jobUrl: "https://www.atlassian.com/company/careers",
    tags: ["SaaS", "Collaboration", "TypeScript"],
    description: "Build collaboration features across cloud products.",
    notes: "Recruiter screen scheduled.",
    columnName: "Interviewing",
  },
  {
    company: "Figma",
    position: "Design Systems Engineer",
    location: "New York, NY",
    salary: "$150k - $205k",
    jobUrl: "https://www.figma.com/careers",
    tags: ["Design Systems", "React", "Accessibility"],
    description: "Develop accessible design system primitives and tooling.",
    notes: "Technical interview next week.",
    columnName: "Interviewing",
  },
  {
    company: "GitHub",
    position: "Platform Engineer",
    location: "Remote",
    salary: "$135k - $190k",
    jobUrl: "https://github.com/about/careers",
    tags: ["Platform", "Cloud", "Developer Tools"],
    description: "Improve infrastructure and developer experience platforms.",
    notes: "Take-home assignment submitted.",
    columnName: "Interviewing",
  },
  {
    company: "Canva",
    position: "Frontend Platform Engineer",
    location: "Austin, TX",
    salary: "$125k - $175k",
    jobUrl: "https://www.canva.com/careers",
    tags: ["Frontend", "Platform", "Performance"],
    description: "Improve shared frontend infrastructure for product teams.",
    notes: "Verbal offer received. Compare benefits package.",
    columnName: "Offer",
  },
  {
    company: "Dropbox",
    position: "Software Engineer",
    location: "Remote",
    salary: "$120k - $165k",
    jobUrl: "https://jobs.dropbox.com",
    tags: ["Storage", "Sync", "React"],
    description: "Build file collaboration and sync experiences.",
    notes: "Rejected after final round. Ask for feedback.",
    columnName: "Rejected",
  },
];

async function seed() {
  loadEnvLocal();

  if (!process.env.MONGODB_URI) {
    throw new Error("Please define MONGODB_URI inside .env.local");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
  });

  const existingBoard = await Board.findOne({
    name: "Job Hunt",
    userId: USER_ID,
  }).select("_id");

  if (existingBoard) {
    await Promise.all([
      JobApplication.deleteMany({ boardId: existingBoard._id }),
      Column.deleteMany({ boardId: existingBoard._id }),
      Board.deleteOne({ _id: existingBoard._id }),
    ]);
  }

  const board = await Board.create({
    name: "Job Hunt",
    userId: USER_ID,
    columns: [],
  });

  const createdColumns = await Column.insertMany(
    columns.map((column) => ({
      ...column,
      boardId: board._id,
      jobApplications: [],
    })),
  );

  const columnByName = new Map(
    createdColumns.map((column) => [column.name, column]),
  );

  const jobDocuments = await JobApplication.insertMany(
    jobs.map((job, index) => {
      const column = columnByName.get(job.columnName);

      if (!column) {
        throw new Error(`Column "${job.columnName}" not found`);
      }

      return {
        company: job.company,
        position: job.position,
        location: job.location,
        salary: job.salary,
        jobUrl: job.jobUrl,
        tags: job.tags,
        description: job.description,
        notes: job.notes,
        status: job.columnName.toLowerCase(),
        columnId: column._id,
        boardId: board._id,
        userId: USER_ID,
        order: jobs
          .slice(0, index)
          .filter((previousJob) => previousJob.columnName === job.columnName)
          .length,
        appliedDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      };
    }),
  );

  await Promise.all(
    createdColumns.map((column) =>
      Column.findByIdAndUpdate(column._id, {
        $set: {
          jobApplications: jobDocuments
            .filter((job) => job.columnId.equals(column._id))
            .map((job) => job._id),
        },
      }),
    ),
  );

  board.columns = createdColumns.map((column) => column._id);
  await board.save();

  console.log(`Seeded board "${board.name}" for user "${USER_ID}".`);
  console.log(`Created ${createdColumns.length} columns.`);
  console.log(`Created ${jobDocuments.length} job applications.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
