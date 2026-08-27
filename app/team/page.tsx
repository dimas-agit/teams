import KanbanBoard from "@/components/kanban-board";
import TeamTaskBoard from "@/components/team-task-board";
import { getSession } from "@/lib/auth/auth"
import connectDB from "@/lib/db";
import { Board, TeamProject, TeamTask } from "@/lib/models";
import board from "@/lib/models/board";
import teamProject from "@/lib/models/team-project";
import { Suspense } from "react";


async function getTeamTask(userId: string){
"use cache"
 await connectDB();
    const teamProjectDoc = await TeamProject.findOne({
        name:"Default Team",
        userId: userId
    }).populate({
        path:"columns",
        populate:{
            path:"tasks"
        },
    });
    if(!teamProjectDoc) return null;

    const teamProject = JSON.parse(JSON.stringify(teamProjectDoc));
    return teamProject;
}

async function TeamTaskPage(){
 const session = await getSession();
    const teamTask = await getTeamTask(session?.user.id ?? "")
    return (
        <div className="min-h-screen bg-white">
           <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-black">Team</h1>
                <p className="text-gray-600">Manage your task list</p>
            </div>
            <TeamTaskBoard project={teamTask}/>
           </div>
        </div>
    )
}
export default async function Team() {
  return (
  <Suspense fallback={<p>Loading ...</p>}>
    <TeamTaskPage/>
  </Suspense>);
   
}