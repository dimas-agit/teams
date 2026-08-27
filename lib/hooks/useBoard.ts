"use client"

import { useState } from "react";
import { Board, Column, JobApplication } from "../models/models.types";
import { updateJobApplication } from "../actions/job-applications";

function moveJobInColumns(
    columns: Column[],
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number,
) {
    const nextColumns = columns.map((col) => ({
        ...col,
        jobApplications: [...(col.jobApplications || [])]
            .sort((a, b) => a.order - b.order),
    }));

    let jobToMove: JobApplication | null = null;

    for (const col of nextColumns) {
        const jobIndex = col.jobApplications.findIndex(
            (job) => job._id === jobApplicationId,
        );

        if (jobIndex !== -1) {
            const [removedJob] = col.jobApplications.splice(jobIndex, 1);
            jobToMove = removedJob;
        }
    }

    if (!jobToMove) {
        return nextColumns;
    }

    const targetColumn = nextColumns.find((col) => col._id === newColumnId);

    if (!targetColumn) {
        return nextColumns;
    }

    const targetIndex = Math.max(
        0,
        Math.min(newOrder, targetColumn.jobApplications.length),
    );

    targetColumn.jobApplications.splice(targetIndex, 0, {
        ...jobToMove,
        columnId: newColumnId,
    });

    return nextColumns.map((col) => ({
        ...col,
        jobApplications: col.jobApplications.map((job, index) => ({
            ...job,
            order: index,
        })),
    }));
}

export function useBoard(initialBoard?: Board | null){
    const [previousBoard,setPreviousBoard] = useState<Board|null>(initialBoard || null);
    const [columns,setColumns] = useState<Column[]>(initialBoard?.columns|| []);
    const [error,setError] = useState<string| null>(null);

    if (initialBoard && initialBoard !== previousBoard) {
        setPreviousBoard(initialBoard);
        setColumns(initialBoard.columns || []);
    }

    function moveJobOptimistic(jobApplicationId:string,newColumnId:string,newOrder:number){
        setColumns((prev)=>moveJobInColumns(prev, jobApplicationId, newColumnId, newOrder));
    }

    function resetBoard() {
        setColumns(previousBoard?.columns || []);
    }

    async function saveJobMove(jobApplicationId:string,newColumnId:string,newOrder:number){
        try{
            const result = await updateJobApplication(jobApplicationId,{
                columnId: newColumnId,
                order: newOrder
            });
            if(!result.error){
                console.log("data:",result.data);
            
            }
            else{
                setError(result.error);
                resetBoard();
            }
        }catch(err){
            setError("Failed to move job");
            resetBoard();
            console.log("Error",err)
        }
    }
    return {columns,error,moveJobOptimistic,saveJobMove,resetBoard};

}
