"use client"

import { signOut } from "@/lib/auth/auth-client";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function SignOutButton(){
    const router = useRouter();

    const handleSignOut= async()=>{
        const result = await signOut();
        if(result.data){
            router.push("/sign-in");
        }else{
            alert("Error signin out");
        }
    }
    return (
        <DropdownMenuItem onClick={handleSignOut}>
            Logout
        </DropdownMenuItem>
    )
}
