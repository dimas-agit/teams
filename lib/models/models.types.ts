export interface JobApplication{
       _id: string;
        company: string;
        position: string;
        location?: string;
        status: string;
        columnId: string;
        boardId: string;
        userId: string;
        order: number;
        notes?: string;
        salary?: string;
        jobUrl?: string;
        appliedDate?: string;
        tags?: string[];
        description?: string;
}

export interface Column{
    _id: string;
    name: string;
    order: number;
    jobApplications: JobApplication[];
}

export interface Board{
     _id: string;
     name: string;
     userId: string;
     columns: Column[];
}


interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
}

export interface TeamTask{
    _id: string;
    title: string;
    description?: string;
    progress: number;
    imageUrl: string[];
    checklistItems:ChecklistItem[];
    note?: string;
    columnId: string;
    projectId: string;
    userId: string;
    order: number;
}

export interface TeamTaskColumn{
    _id: string;
    name: string;
    order: number;
    tasks: TeamTask[];
}

export interface TeamProject{
     _id: string;
     name: string;
     userId: string;
     columns: TeamTaskColumn[];
}
