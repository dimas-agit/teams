"use client"

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, ClipboardList, MoreVertical, Timer, Trash2 } from "lucide-react";
import { useState } from "react";
import { TeamProject, TeamTask, TeamTaskColumn } from "@/lib/models/models.types";
import { useTeamTaskBoard } from "@/lib/hooks/useTeamTaskBoard";
import CreateTeamTaskDialog from "./create-team-task-dialog";
import TeamTaskCard from "./team-task-card";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TeamTaskBoardProps {
  project: TeamProject;
}

const COLUMN_CONFIG = [
  {
    color: "bg-sky-600",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    color: "bg-amber-500",
    icon: <Timer className="h-4 w-4" />,
  },
  {
    color: "bg-emerald-600",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

function DroppableColumn({
  column,
  config,
  projectId,
}: {
  column: TeamTaskColumn;
  config: { color: string; icon: React.ReactNode };
  projectId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column._id,
    data: {
      type: "column",
      columnId: column._id,
    },
  });
  const sortedTasks = [...(column.tasks || [])].sort((a, b) => a.order - b.order);

  return (
    <Card className="min-w-[450px] shrink-0 p-0 shadow-md">
      <CardHeader className={`${config.color} rounded-t-lg pb-3 pt-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {config.icon}
            <CardTitle className="truncate text-base font-semibold text-white">
              {column.name}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuGroup>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-white/20"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuGroup>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className={`min-h-[440px] space-y-2 rounded-b-lg bg-gray-50/70 pt-4 ${
          isOver ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <SortableContext
          items={sortedTasks.map((task) => task._id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedTasks.map((task) => (
            <SortableTaskCard key={task._id} task={{ ...task, columnId: column._id }} />
          ))}
        </SortableContext>
        <CreateTeamTaskDialog columnId={column._id} projectId={projectId} />
      </CardContent>
    </Card>
  );
}

function SortableTaskCard({ task }: { task: TeamTask }) {
  const { attributes, listeners, transform, transition, isDragging, setNodeRef } =
    useSortable({
      id: task._id,
      data: {
        type: "task",
        task,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TeamTaskCard task={task} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

export default function TeamTaskBoard({ project }: TeamTaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    taskId: string;
    columnId: string;
    order: number;
  } | null>(null);
  const { columns, moveTaskOptimistic, saveTaskMove, resetBoard } =
    useTeamTaskBoard(project);
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function getMoveTarget(taskId: string, overId: string, isAfterOverItem = false) {
    const targetColumn = sortedColumns.find((column) => column._id === overId);

    if (targetColumn) {
      return {
        columnId: targetColumn._id,
        order: (targetColumn.tasks || []).filter((task) => task._id !== taskId).length,
      };
    }

    for (const column of sortedColumns) {
      const sortedTasks = [...(column.tasks || [])].sort((a, b) => a.order - b.order);
      const filteredTasks = sortedTasks.filter((task) => task._id !== taskId);
      const overIndex = filteredTasks.findIndex((task) => task._id === overId);

      if (overIndex !== -1) {
        return {
          columnId: column._id,
          order: overIndex + (isAfterOverItem ? 1 : 0),
        };
      }
    }

    return null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const taskId = active.id as string;
    const activeTop = active.rect.current.translated?.top;
    const overMiddle = over.rect.top + over.rect.height / 2;
    const target = getMoveTarget(
      taskId,
      over.id as string,
      activeTop !== undefined && activeTop > overMiddle,
    );

    if (!target || target.order < 0) {
      return;
    }

    setPendingMove((previousMove) => {
      if (
        previousMove?.taskId === taskId &&
        previousMove.columnId === target.columnId &&
        previousMove.order === target.order
      ) {
        return previousMove;
      }

      moveTaskOptimistic(taskId, target.columnId, target.order);

      return {
        taskId,
        columnId: target.columnId,
        order: target.order,
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);

    if (!over) {
      setPendingMove(null);
      return;
    }

    const taskId = active.id as string;
    const activeTop = active.rect.current.translated?.top;
    const overMiddle = over.rect.top + over.rect.height / 2;
    const target =
      pendingMove ||
      getMoveTarget(
        taskId,
        over.id as string,
        activeTop !== undefined && activeTop > overMiddle,
      );

    setPendingMove(null);

    if (!target) {
      return;
    }

    await saveTaskMove(taskId, target.columnId, target.order);
  }

  function handleDragCancel() {
    setActiveId(null);
    setPendingMove(null);
    resetBoard();
  }

  const activeTask = sortedColumns
    .flatMap((column) => column.tasks || [])
    .find((task) => task._id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedColumns.map((column, index) => {
          const config = COLUMN_CONFIG[index] || COLUMN_CONFIG[0];

          return (
            <DroppableColumn
              key={column._id}
              column={column}
              config={config}
              projectId={project._id}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-70">
            <TeamTaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
