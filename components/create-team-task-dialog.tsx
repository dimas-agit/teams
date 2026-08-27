"use client"

import { Plus } from "lucide-react";
import { useState } from "react";
import { createTeamTask } from "@/lib/actions/team-tasks";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import ImageDropzone from "./image-drop-zone";
import Checklist from "./checklist";
import Loading from "./loading";

interface CreateTeamTaskDialogProps {
  columnId: string;
  projectId: string;
}

const checkList = {
  id:"",
  description:"",
  completed:false
};
const INITIAL_FORM_DATA = {
  title: "",
  description: "",
  progress: 0,
  note: "",
  imageUrl:[""],
  checklistItems:[checkList]
};

export default function CreateTeamTaskDialog({
  columnId,
  projectId,
}: CreateTeamTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    const result = await createTeamTask({
      ...formData,
      progress: Number(formData.progress),
      columnId,
      projectId,
    });

    if (!result.error) {

      setFormData(INITIAL_FORM_DATA);
      setOpen(false);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full justify-start text-muted-foreground">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        }
      />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Create a task for this board.</DialogDescription>
        </DialogHeader>
        {
          loading && (
            <Loading/>
          )
        }
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={formData.title}
              onChange={(event) =>
                setFormData({ ...formData, title: event.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              rows={3}
              value={formData.description}
              onChange={(event) =>
                setFormData({ ...formData, description: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
              <ImageDropzone
              value={formData.imageUrl}
              onChange={(images)=>
                setFormData((prev)=>({
                  ...prev,
                  imageUrl:images,
                }))
              }/>
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="task-progress">Progress</Label>
            <Input
              id="task-progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(event) =>
                setFormData({ ...formData, progress: event.target.value })
              }
            />
          </div> */}
          <div className="space-y-2">
            <Label htmlFor="task-note">Note</Label>
            <Textarea
              id="task-note"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
