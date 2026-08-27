"use client"

import { Check, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface CheckListItem{
    id: string;
    description: string;
    completed: boolean;
}
interface ChecklistProps {
  title?: string;
  items: CheckListItem[];
  onChange: (items: CheckListItem[]) => void;
  onProgressChange?: (progress: number) => void;
}

export default function Checklist({
    title="Checklist",
    items,
    onChange,
    onProgressChange
}: ChecklistProps){
    const [isOpen,setIsOpen] = useState(false);
    const [isAdding,setIsAdding] = useState(false);
    const [newItem,setNewItem] = useState("");

    items = items.filter((item)=>item.id!=="");
    const completedCount = items.filter((item)=>item.completed).length;
    
   const progress =
  items.length > 0
    ? Math.round(
        (items.filter((item) => item.completed).length /
          items.length) *
          100
      )
    : 0;


    
    const addItem = ()=>{
        const description = newItem.trim();
        if(!description) return;

      const newChecklistItem: CheckListItem = {
      id: crypto.randomUUID(),
      description,
      completed: false,
    };

        onChange([...items, newChecklistItem]);

        setNewItem("");
        setIsAdding(false);

    }

    // Toggle completed
  const toggleItem = (id: string) => {
    const updatedItems = items.map((item) =>
      item.id === id
        ? {
            ...item,
            completed: !item.completed,
          }
        : item
    );

    onChange(updatedItems);
  };

     const removeItem = (id: string) => {
    const updatedItems = items.filter(
      (item) => item.id !== id
    );

    onChange(updatedItems);
  };

    return (
        <div className="w-full rounded-lg border bg-background">
            <div className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/50"
             onClick={()=>setIsOpen((prev)=>!prev)}
            >
                <div className="flex items-center gap-2">
                    {isOpen?(
                        <ChevronDown className="h-4 w-4"/>
                    ): (
                        <ChevronRight className="h-4 w-4"/>
                    )}

                    <span className="font-medium">
                        {title}
                    </span>

                    {items.length>0 && (
                        <span className="text-xs text-muted-foreground">
                            {completedCount}/{items.length}
                        </span>
                    )}
                </div>

                {items.length>0 &&(
                    <span className="text-xs font-medium">
                        {progress}%
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="border-t px-4 py-3">
                 {items.length>0 && (
                    <div className="mb-4">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                         <div className="h-full rounded-full bg-primary transition-all duration-300"
                         style={{width:`${progress}%`}}
                         />

                        </div>
                        </div>
                 )}

                 {items.length==0 && !isAdding && (
                    <div className="flex flex-col items-center justify-center py-6">
                        <p className="mb-3 text-sm text-muted-foreground">
                            No checklist items
                        </p>
                        <Button type="button" onClick={()=>setIsAdding(true)}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                            >
                                <Plus className="h-4 w-4"/>
                                Add item

                            </Button>
                    </div>
                 )}

                 {items.length>0 && (
                    <div className="space-y-2">
                        {items.map((item)=>(
                            <div key={item.id}
                            className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                             <Button type="button" onClick={()=>toggleItem(item.id)}
                             variant="outline"
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${item.completed? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                                >
                                {item.completed && (
                                    <Check className="h-3 w-3"/>
                                )}
                             </Button>

                             <span className={`flex-1 text-sm wrap-break-word ${item.completed ? "text-muted-foreground line-through":""}`}>
                                {item.description}
                             </span>
                            <Button type="button" variant="outline" onClick={()=>removeItem(item.id)
                                
                            }
                            className="hidden text-muted-foreground hover:text-destructive group-hover:block"
                                
                                >
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                 )}

                 {items.length>0 && !isAdding && (
                    <Button type="button" onClick={()=>setIsAdding(true)} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <Plus className="h-4 w-4"/>
                        Add Item
                    </Button>
                 )}

                 {isAdding && (
                    <div className="mt-3 flex items-center gap-2">
                     <Input
                     autoFocus
                     type="text"
                     value={newItem}
                     onChange={(e)=>setNewItem(e.target.value)}
                     onKeyDown={(e)=>{
                        if(e.key==="Enter"){
                            addItem();
                        }

                        if(e.key === "Escape"){
                            setNewItem("");
                            setIsAdding(false);

                        }
                     }}
                     placeholder="Enter checlist item ...."
                     className="flex-1 rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                     />
                     <Button type="button"
                     onClick={addItem}
                     className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
                        Add
                     </Button>

                     <Button type="button"
                      onClick={()=>{
                        setNewItem("");
                        setIsAdding(false);
                      }}
                      className="rounded-md border px-3 py-2 text-sm"
                     >
                        Cancel
                     </Button>
                    </div>
                 )}
                </div>
            )}
        </div>
    )
}

