"use client"

import { useState } from "react";
import { TeamProject, TeamTask, TeamTaskColumn } from "../models/models.types";
import { updateTeamTask } from "../actions/team-tasks";

function moveTaskInColumns(
  columns: TeamTaskColumn[],
  taskId: string,
  newColumnId: string,
  newOrder: number,
) {
  const nextColumns = columns.map((column) => ({
    ...column,
    tasks: [...(column.tasks || [])].sort((a, b) => a.order - b.order),
  }));

  let taskToMove: TeamTask | null = null;

  for (const column of nextColumns) {
    const taskIndex = column.tasks.findIndex((task) => task._id === taskId);

    if (taskIndex !== -1) {
      const [removedTask] = column.tasks.splice(taskIndex, 1);
      taskToMove = removedTask;
    }
  }

  if (!taskToMove) {
    return nextColumns;
  }

  const targetColumn = nextColumns.find((column) => column._id === newColumnId);

  if (!targetColumn) {
    return nextColumns;
  }

  const targetIndex = Math.max(0, Math.min(newOrder, targetColumn.tasks.length));

  targetColumn.tasks.splice(targetIndex, 0, {
    ...taskToMove,
    columnId: newColumnId,
  });

  return nextColumns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task, index) => ({
      ...task,
      order: index,
    })),
  }));
}

export function useTeamTaskBoard(initialProject?: TeamProject | null) {
  const [previousProject, setPreviousProject] = useState<TeamProject | null>(
    initialProject || null,
  );
  const [columns, setColumns] = useState<TeamTaskColumn[]>(
    initialProject?.columns || [],
  );
  const [error, setError] = useState<string | null>(null);

  if (initialProject && initialProject !== previousProject) {
    setPreviousProject(initialProject);
    setColumns(initialProject.columns || []);
  }

  function moveTaskOptimistic(taskId: string, newColumnId: string, newOrder: number) {
    setColumns((previousColumns) =>
      moveTaskInColumns(previousColumns, taskId, newColumnId, newOrder),
    );
  }

  function resetBoard() {
    setColumns(previousProject?.columns || []);
  }

  async function saveTaskMove(taskId: string, newColumnId: string, newOrder: number) {
    try {
      const result = await updateTeamTask(taskId, {
        columnId: newColumnId,
        order: newOrder,
        
      });

      if (result.error) {
        setError(result.error);
        resetBoard();
      }
    } catch (err) {
      setError("Failed to move task");
      resetBoard();
      console.log("Error", err);
    }
  }

  return {
    columns,
    error,
    moveTaskOptimistic,
    saveTaskMove,
    resetBoard,
  };
}
