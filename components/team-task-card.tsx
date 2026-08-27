"use client"

import { Check, CheckSquare, Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { TeamTask } from "@/lib/models/models.types";
import { deleteTeamTask, updateTeamTask } from "@/lib/actions/team-tasks";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import ImageDropzone from "./image-drop-zone";
import Checklist from "./checklist";

interface TeamTaskCardProps {
  task: TeamTask;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

export default function TeamTaskCard({ task, dragHandleProps }: TeamTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    progress: Number(task.progress || 0),
    checklistItems: task.checklistItems,
    imageUrl:task.imageUrl || [],
    note: task.note || "",
  });

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();

    const result = await updateTeamTask(task._id, {
      title: formData.title,
      description: formData.description,
      progress: Number(formData.progress),
      imageUrl:formData.imageUrl,
      checklistItems: formData.checklistItems,
      note: formData.note,
    });

    if (!result.error) {
      setIsEditing(false);
    }
  }

  async function handleDelete() {
    await deleteTeamTask(task._id);
  }

  return (
    <>
      <Card
        className="cursor-grab bg-white shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
        {...dragHandleProps}
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-black">{task.title}</h3>
              {task.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground whitespace-pre-line wrap-break-word">
                  {task.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{task.progress || 0}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(0, Math.min(task.progress || 0, 100))}%` }}
              />
            </div>
          </div> */}

          {task.note && (
            <p className="rounded-md bg-cyan-300 p-2 text-xs text-gray-600">{task.note}</p>
          )}

          {task.checklistItems.length>0 && (
            <div className="flex items-center gap-2 mt-2 rounded-md">
               <CheckSquare className="h-4 w-4" size="icon"/>
            {task.checklistItems?.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {task.checklistItems.filter((item) => item.completed).length}/
            {task.checklistItems.length}
          </span>
        )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update this team task.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdate}>
            <div className="space-y-2">
              <Label htmlFor={`title-${task._id}`}>Title *</Label>
              <Input
                id={`title-${task._id}`}
                value={formData.title}
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`description-${task._id}`}>Description</Label>
              <Textarea
                id={`description-${task._id}`}
                rows={3}
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
              />
            </div>
             <ImageDropzone
                          value={formData.imageUrl}
                          onChange={(images)=>
                            setFormData((prev)=>({
                              ...prev,
                              imageUrl:images,
                            }))
                          }/>
            <div className="space-y-2">
              <Label htmlFor={`note-${task._id}`}>Note</Label>
              <Textarea
                id={`note-${task._id}`}
                rows={3}
                value={formData.note}
                onChange={(event) =>
                  setFormData({ ...formData, note: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
                    <Checklist title="Checklist"
                          items={formData.checklistItems}
                          onChange={(items)=>{
                            setFormData((prev)=>({
                              ...prev,
                              checklistItems:items
                            }))
                          }}
                           onProgressChange={(progress) => {
                          setFormData((prev) => ({
                            ...prev,
                            progress,
                          }));
                        }}
                          />
                      </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
