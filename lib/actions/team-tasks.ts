"use server"

import { revalidatePath } from "next/cache";
import connectDB from "../db";
import { getSession } from "../auth/auth";
import { TeamProject, TeamTask, TeamTaskColumn } from "../models";

const TEAM_TASK_PATH = "/team";
const DEFAULT_COLUMNS = [
  { name: "Draft", order: 0 },
  { name: "In Progress", order: 1 },
  { name: "Done/Completed", order: 2 },
];



interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
}

interface TaskData {
  title: string;
  description?: string;
  progress?: number;
  note?: string;
  columnId: string;
  projectId: string;
  imageUrl: string[];
  checklistItems:ChecklistItem[];
}




export async function createTeamProject(name: string) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (!name.trim()) {
    return { error: "Team or project name is required" };
  }

  await connectDB();

  const project = await TeamProject.create({
    name: name.trim(),
    userId: session.user.id,
    columns: [],
  });

  const columns = await TeamTaskColumn.insertMany(
    DEFAULT_COLUMNS.map((column) => ({
      ...column,
      projectId: project._id,
      tasks: [],
    })),
  );

  project.columns = columns.map((column) => column._id);
  await project.save();

  revalidatePath(TEAM_TASK_PATH);

  return { data: JSON.parse(JSON.stringify(project)) };
}

export async function createTeamTask(data: TaskData) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (!data.title.trim()) {
    return { error: "Title is required" };
  }

  await connectDB();

  const project = await TeamProject.findOne({
    _id: data.projectId,
    userId: session.user.id,
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const column = await TeamTaskColumn.findOne({
    _id: data.columnId,
    projectId: data.projectId,
  });

  if (!column) {
    return { error: "Column not found" };
  }

  const maxOrder = await TeamTask.findOne({ columnId: data.columnId })
    .sort({ order: -1 })
    .select("order")
    .lean<{ order: number }>();

  const task = await TeamTask.create({
    title: data.title.trim(),
    description: data.description,
    progress: Math.max(0, Math.min(data.progress || 0, 100)),
    imageUrl:data.imageUrl,
    checklistItems: data.checklistItems,
    note: data.note,
    columnId: data.columnId,
    projectId: data.projectId,
    userId: session.user.id,
    order: maxOrder ? maxOrder.order + 1 : 0,
  });

  await TeamTaskColumn.findByIdAndUpdate(data.columnId, {
    $push: { tasks: task._id },
  });

  revalidatePath(TEAM_TASK_PATH);

  return { data: JSON.parse(JSON.stringify(task)) };
}

export async function updateTeamTask(
  id: string,
  updates: {
    title?: string;
    description?: string;
    progress?: number;
    imageUrl?:string[];
    checklistItems?: ChecklistItem[];
    note?: string;
    columnId?: string;
    order?: number;
  },
) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  const task = await TeamTask.findById(id);

  if (!task) {
    return { error: "Task not found" };
  }

  if (task.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  const { columnId, order, ...otherUpdates } = updates;
  const updatesToApply: Partial<{
    title: string;
    description: string;
    progress: number;
    imageUrl:string[];
    checklistItems:ChecklistItem[];
    note: string;
    columnId: string;
    order: number;
  }> = {
    ...otherUpdates,
  };

  if (updatesToApply.title !== undefined) {
    updatesToApply.title = updatesToApply.title.trim();
  }

  if (updatesToApply.progress !== undefined) {
    updatesToApply.progress = Math.max(0, Math.min(updatesToApply.progress, 100));
  }

  const currentColumnId = task.columnId.toString();
  const targetColumnId = columnId?.toString() || currentColumnId;

  if (columnId || order !== undefined) {
    const columnIdsToNormalize = Array.from(
      new Set([currentColumnId, targetColumnId]),
    );

    const columns = await TeamTaskColumn.find({
      _id: { $in: columnIdsToNormalize },
      projectId: task.projectId,
    }).select("_id");

    if (columns.length !== columnIdsToNormalize.length) {
      return { error: "Column not found" };
    }

    const tasksByColumn = new Map<string, typeof task[]>();

    for (const columnToNormalize of columnIdsToNormalize) {
      const tasks = await TeamTask.find({
        columnId: columnToNormalize,
        userId: session.user.id,
        _id: { $ne: id },
      }).sort({ order: 1 });

      tasksByColumn.set(columnToNormalize, tasks);
    }

    const targetTasks = tasksByColumn.get(targetColumnId) || [];
    const insertIndex =
      order === undefined
        ? targetTasks.length
        : Math.max(0, Math.min(order, targetTasks.length));

    targetTasks.splice(insertIndex, 0, task);
    tasksByColumn.set(targetColumnId, targetTasks);

    const bulkUpdates = [];

    for (const columnToNormalize of columnIdsToNormalize) {
      const tasks = tasksByColumn.get(columnToNormalize) || [];

      for (const [index, taskToUpdate] of tasks.entries()) {
        bulkUpdates.push({
          updateOne: {
            filter: { _id: taskToUpdate._id },
            update: {
              $set: {
                columnId: columnToNormalize,
                order: index,
              },
            },
          },
        });
      }

      await TeamTaskColumn.findByIdAndUpdate(columnToNormalize, {
        $set: {
          tasks: tasks.map((taskToUpdate) => taskToUpdate._id),
        },
      });
    }

    if (bulkUpdates.length > 0) {
      await TeamTask.bulkWrite(bulkUpdates);
    }

    updatesToApply.columnId = targetColumnId;
    updatesToApply.order = insertIndex;
  }

  const updated = await TeamTask.findByIdAndUpdate(id, updatesToApply, {
    new: true,
  });

  revalidatePath(TEAM_TASK_PATH);

  return { data: JSON.parse(JSON.stringify(updated)) };
}

export async function deleteTeamTask(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  const task = await TeamTask.findById(id);

  if (!task) {
    return { error: "Task not found" };
  }

  if (task.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  await TeamTaskColumn.findByIdAndUpdate(task.columnId, {
    $pull: { tasks: id },
  });
  await TeamTask.deleteOne({ _id: id });

  revalidatePath(TEAM_TASK_PATH);

  return { success: true };
}
