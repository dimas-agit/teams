import { Spinner } from "./ui/spinner";

export  default function Loading(){
    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center"><Spinner className="h-4 w-4"/></div>
    )
}