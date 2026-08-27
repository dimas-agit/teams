"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/auth";
import connectDB from "../db";
import { Board, Column, JobApplication } from "../models";

interface JobApplicationData {
  company: string;
  position: string;
  location?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  columnId: string;
  boardId: string;
  tags?: string[];
  description?: string;
}

export async function createJobApplication(data: JobApplicationData) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  const {
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    tags,
    description
  } = data;

  if (!company) {
    return { error: "Company required fields" };
  }

  if (!position) {
    return { error: "Position required fields" };
  }

  if (!columnId) {
    return { error: "ColumnId required fields" };
  }

  if (!boardId) {
    return { error: "BoardId required fields" };
  }

  // verify board ownership
  const board = await Board.findOne({
    _id: boardId,
    userId: session.user.id
  });

  if (!board) {
    return { error: "Board not found" };
  }

  const column = await Column.findOne({
    _id: columnId,
    boardId: boardId
  });

  if (!column) {
    return { error: "Column not found" };
  }

  const maxOrder = (await JobApplication.findOne({ columnId }).sort({ order: -1 }).select("order").lean()) as { order: number } | null;
  const jobApplication = await JobApplication.create({
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    userId: session.user.id,
    tags: tags || [],
    description,
    status: "applied",
    order: maxOrder ? maxOrder.order + 1 : 0
  });

  await Column.findByIdAndUpdate(columnId, {
    $push: { jobApplications: jobApplication._id },
  });

  revalidatePath("/dashboard");

  return { data: JSON.parse(JSON.stringify(jobApplication)) };

}


export async function updateJobApplication(
  id: string,
  updates: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    columnId?: string;
    order?: number;
    tags?: string[];
    description?: string;
  }
) {
  const session = await getSession();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  const jobApplication = await JobApplication.findById(id);

  if (!jobApplication) {
    return { error: "Job application not found" };
  }
  if (jobApplication.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }
  const { columnId, order, ...otherUpdates } = updates;

  const updatesToApply: Partial<{
    company: string;
    position: string;
    location: string;
    notes: string;
    salary: string;
    jobUrl: string;
    columnId: string;
    order: number;
    tags: string[];
    description: string;
  }> = otherUpdates;

  const currentColumnId = jobApplication.columnId.toString();
  const newColumnId = columnId?.toString();

  if (newColumnId || order !== undefined) {
    const targetColumnId = newColumnId || currentColumnId;
    const columnIdsToNormalize = Array.from(
      new Set([currentColumnId, targetColumnId]),
    );

    const columns = await Column.find({
      _id: { $in: columnIdsToNormalize },
      boardId: jobApplication.boardId,
    }).select("_id");

    if (columns.length !== columnIdsToNormalize.length) {
      return { error: "Column not found" };
    }

    const jobsByColumn = new Map<string, typeof jobApplication[]>();

    for (const columnToNormalize of columnIdsToNormalize) {
      const jobs = await JobApplication.find({
        columnId: columnToNormalize,
        userId: session.user.id,
        _id: { $ne: id },
      }).sort({ order: 1 });

      jobsByColumn.set(columnToNormalize, jobs);
    }

    const targetJobs = jobsByColumn.get(targetColumnId) || [];
    const insertIndex =
      order === undefined
        ? targetJobs.length
        : Math.max(0, Math.min(order, targetJobs.length));

    targetJobs.splice(insertIndex, 0, jobApplication);
    jobsByColumn.set(targetColumnId, targetJobs);

    const bulkUpdates = [];

    for (const columnToNormalize of columnIdsToNormalize) {
      const jobs = jobsByColumn.get(columnToNormalize) || [];

      for (const [index, job] of jobs.entries()) {
        bulkUpdates.push({
          updateOne: {
            filter: { _id: job._id },
            update: {
              $set: {
                columnId: columnToNormalize,
                order: index,
              },
            },
          },
        });
      }

      await Column.findByIdAndUpdate(columnToNormalize, {
        $set: {
          jobApplications: jobs.map((job) => job._id),
        },
      });
    }

    if (bulkUpdates.length > 0) {
      await JobApplication.bulkWrite(bulkUpdates);
    }

    updatesToApply.columnId = targetColumnId;
    updatesToApply.order = insertIndex;
  }

  const updated = await JobApplication.findByIdAndUpdate(id, updatesToApply, {
    new: true
  });

  revalidatePath("/dashboard");
  return { data: JSON.parse(JSON.stringify(updated)) };

}

export async function deleteJobApplication(id: string){
  const session = await getSession();
  if(!session?.user){
    return {error:"Unauthorized"};
  }

  await connectDB();
  
  const jobApplication = await JobApplication.findById(id);

  if(!jobApplication){
    return {error:"Job application not found"};
  }

  if(jobApplication.userId !== session.user.id){
    return {error :"Unauthorized"};
  }

  await Column.findByIdAndUpdate(jobApplication.columnId,{
    $pull: {jobApplications: id}
  });
  await JobApplication.deleteOne({_id:id});
  revalidatePath("/dashboard");

  return {success:true};
}
