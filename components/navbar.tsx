"use client"
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar } from "./ui/avatar";
import { AvatarFallback } from "./ui/avatar";
import { useSession } from "@/lib/auth/auth-client";
import SignOutButton from "./sign-out-btn";

export default function Navbar() {
 
    const {data: session} = useSession();
    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="container mx-auto flex h-16 items-center px-4 justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-semi-bold text-primary">
                    <Briefcase />
                    Job Tracker
                </Link>
                <div className="flex items-center gap-4">
                    {session?.user ?
                    <>
                        <Button
                            render={<Link href="/dashboard" />}
                            variant="ghost"
                            className="text-gray-700 hover:text-black cursor-pointer">
                            Dashboard
                        </Button>
                         <Button
                            render={<Link href="/team" />}
                            variant="ghost"
                            className="text-gray-700 hover:text-black cursor-pointer">
                            Team Project
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="ghost">
                                       <Avatar>
                                         <AvatarFallback className="bg-primary text-white font-semibold text-lg">
                                            {session.user.name.charAt(0).toUpperCase()}
                                         </AvatarFallback>
                                        </Avatar> 
                                    </Button>
                                }
                            />

                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="font-normal">
                                        <div>
                                            <p className="text-sm font-bold leading-none text-black">{session.user.name}</p>
                                            <p className="text-xs text-gray-700">{session.user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <SignOutButton/>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                         
                        </DropdownMenu>
                    </>
                    :
                    <>
                        <Button
                            render={<Link href="/sign-in" />}
                            variant="ghost"
                            className="text-gray-700 hover:text-black cursor-pointer">
                            Log In
                        </Button>
                        <Button
                            render={<Link href="/sign-up" />}
                            className="bg-primary hover:bg-primary/90 cursor-pointer">
                            Start for free
                        </Button>
                    </>
                    }
                  
                </div>


            </div>

        </nav>
    )

}
