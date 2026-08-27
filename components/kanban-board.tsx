"use client"

import { Board, Column, JobApplication } from "@/lib/models/models.types"
import { Award, Calendar, CheckCircle2, Mic, MoreVertical, Trash2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import CreateJobApplicationDialog from "./create-job-dialog";
import JobApplicationCard from "./job-application-card";
import { useBoard } from "@/lib/hooks/useBoard";
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
}
from "@dnd-kit/core";

import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface KanbanBoardProps{
    board:Board;
    userId:string;
}

interface ColConfig{
    color:string;
    icon:React.ReactNode
}
const COLUMN_CONFIG:Array<{color:string;icon:React.ReactNode}> = [
    {
        
            color:"bg-cyan-500",
            icon:<Calendar className="h-4 w-4"/>,
        
    },
     {
        
            color:"bg-purple-500",
            icon:<CheckCircle2 className="h-4 w-4"/>,
        
    },
     {
        
            color:"bg-green-500",
            icon:<Mic className="h-4 w-4"/>,
        
    },
     {
        
            color:"bg-yellow-500",
            icon:<Award className="h-4 w-4"/>,
        
    },
     {
        
            color:"bg-red-500",
            icon:<XCircle className="h-4 w-4"/>,
        
    },

];

function DroppableColumn({column,config,boardId,sortedColumn}: {column:Column,config:ColConfig,boardId:string,sortedColumn:Column[]}){

    const {setNodeRef, isOver} = useDroppable({
        id:column._id,
        data:{
            type:"column",
            columnId: column._id
        },
    });
    const sortedJobs = [...(column.jobApplications || [])].sort((a,b)=>a.order-b.order);

    return(
    <Card className="min-w-[300] shrink-0 shadow-md p-0">
        <CardHeader className={`${config.color} text-white rounded-t-lg pb-3 pt-3`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {config.icon}
                <CardTitle className="text-white text-base font-semibold">{column.name}</CardTitle>
            </div>

            <DropdownMenu>
                <DropdownMenuGroup>
                    <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20">
                            <MoreVertical className="h-4 w-4"/>
                        </Button>
                    }/>
                    <DropdownMenuContent>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete Column
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenuGroup>
            </DropdownMenu>
        </div>
        </CardHeader>
        <CardContent
        ref={setNodeRef}
        className={`space-y-2 pt-4 bg-gray-50/50 min-h-[400px] rounded-b-lg ${isOver ? "ring-2 ring-blue-500":""}`}>
        <SortableContext
        items={sortedJobs.map((job)=>job._id)}
        strategy={verticalListSortingStrategy}
        >
        {sortedJobs.map((job)=>(
                    <SortableJobCard 
                    key={job._id} 
                    job={{...job,columnId:job.columnId || column._id}}
                    columns={sortedColumn}
                    />
                ))

                }
        </SortableContext>
        
         <CreateJobApplicationDialog columnId={column._id} boardId={boardId}/>
        </CardContent>
    </Card>
);
}

function SortableJobCard({job,columns}:{job:JobApplication,columns:Column[]}){
    const {
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
        setNodeRef
    } = useSortable({
        id: job._id,
        data:{
            type:"job",
            job
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging? 0.5
         : 1
    };


    return(
        <div ref={setNodeRef} style={style}>
            <JobApplicationCard job={job} columns={columns}
            dragHandleProps={{...attributes,...listeners}}
            />

        </div>
    );
}
export default function KanbanBoard({board}:KanbanBoardProps){

    const [activeId,setActiveId] = useState<string|null>(null);
    const [pendingMove, setPendingMove] = useState<{
        jobId: string;
        columnId: string;
        order: number;
    } | null>(null);
    const {columns,moveJobOptimistic,saveJobMove,resetBoard} = useBoard(board)
    

    const sortedColumns = [...columns].sort((a,b)=>a.order-b.order);

    const sensors = useSensors(
        useSensor(PointerSensor,{
        activationConstraint:{
            distance: 8,
        }
        })
    );
    
    async function handleDragStart(event: DragStartEvent){
        setActiveId(event.active.id as string);
    }

    function getMoveTarget(
        activeJobId: string,
        overId: string,
        isAfterOverItem = false,
    ) {
        const targetColumn = sortedColumns.find((col) => col._id === overId);

        if (targetColumn) {
            return {
                columnId: targetColumn._id,
                order: (targetColumn.jobApplications || []).filter(
                    (job) => job._id !== activeJobId,
                ).length,
            };
        }

        for (const column of sortedColumns) {
            const sortedJobs = [...(column.jobApplications || [])].sort(
                (a, b) => a.order - b.order,
            );
            const filteredJobs = sortedJobs.filter(
                (job) => job._id !== activeJobId,
            );
            const overIndex = filteredJobs.findIndex((job) => job._id === overId);

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

        const jobId = active.id as string;
        const activeTop = active.rect.current.translated?.top;
        const overMiddle = over.rect.top + over.rect.height / 2;
        const target = getMoveTarget(
            jobId,
            over.id as string,
            activeTop !== undefined && activeTop > overMiddle,
        );

        if (!target || target.order < 0) {
            return;
        }

        setPendingMove((previousMove) => {
            if (
                previousMove?.jobId === jobId &&
                previousMove.columnId === target.columnId &&
                previousMove.order === target.order
            ) {
                return previousMove;
            }

            moveJobOptimistic(jobId, target.columnId, target.order);

            return {
                jobId,
                columnId: target.columnId,
                order: target.order,
            };
        });
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        setActiveId(null);

        if (!over || !board._id) {
            setPendingMove(null);
            return;
        }

        const jobId = active.id as string;
        const activeTop = active.rect.current.translated?.top;
        const overMiddle = over.rect.top + over.rect.height / 2;
        const target = pendingMove || getMoveTarget(
            jobId,
            over.id as string,
            activeTop !== undefined && activeTop > overMiddle,
        );

        setPendingMove(null);

        if (!target) {
            return;
        }

        await saveJobMove(jobId, target.columnId, target.order);
    }

    function handleDragCancel() {
        setActiveId(null);
        setPendingMove(null);
        resetBoard();
    }
      const activeJob = sortedColumns.flatMap((col)=>col.jobApplications || [])
        .find((job)=>job._id === activeId);
    return ( 
    <DndContext 
    sensors={sensors}
    collisionDetection={closestCorners}
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
    onDragCancel={handleDragCancel}
    >
    <div className="space-y-4">
        <div className="flex gap-4 overflow-x-auto pb-4">
        { sortedColumns.map((col,key)=>{
            const config = COLUMN_CONFIG[key] || {
                color:"bg-gray-500",
                icon:<Calendar className="h-4 w-4"/>,
            };
            return (<
                DroppableColumn
                key={col._id}
                column={col}
                config={config}
                boardId={board._id}
                sortedColumn={sortedColumns}
            />)
        })

        }
        </div>
    </div>
    <DragOverlay>
        {activeJob ?(
            <div className="opacity-50">
                <JobApplicationCard job={activeJob} columns={sortedColumns}/>
            </div>
        ):null}
    </DragOverlay>
    </DndContext>
    );

}
