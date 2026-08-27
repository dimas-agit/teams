"use client"

import { Plus } from "lucide-react";
import { useState } from "react";
import { createTeamProject } from "@/lib/actions/team-tasks";
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

export default function CreateTeamProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = await createTeamProject(name);

    if (!result.error) {
      setName("");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" />
            New Team
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team Task</DialogTitle>
          <DialogDescription>Add a team or project board.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="project-name">Team or Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
