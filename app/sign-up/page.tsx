"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { signUp } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

export default function SignUp() {
    
    const[name,setName] = useState("");
    const[email,setEmail] = useState("");
    const[password,setPassword] = useState("");

    const[error,setError] = useState("");
    const[loading,setLoading] = useState(false);

    const router = useRouter();

    async function handleSubmit(e: React.FormEvent){
        e.preventDefault();
        setLoading(true);
        setError("");
        try{
        const result = await signUp.email(
           {
            name,
            email,
            password
           }
        );

        if(result.error){
            setError(result.error.message || "An Error Occured. Please try again later.");
        }
        else{
            router.push("/dashboard");
        }

        }catch(err:any){
            setError("An Error Occured. Please try again later.");
        }finally{
            setLoading(false);
        }
    }

    return (
        <div className="flex  min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-white">
           <Card className="w-full max-w-md border-gray-200 shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-black">
                        Sign Up
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                      Create an account to start tracking your job applications.
                    </CardDescription>
                </CardHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        { error && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-700">Name</Label>
                            <Input id="name" type="text" placeholder="John Doe"
                            value={name}
                            onChange={(e)=>setName(e.target.value)}
                            required 
                             className="border-gray-300 focus:border-primary focus:ring-primary"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email"  className="text-gray-700">Email</Label>
                            <Input id="email" type="email" placeholder="John.Doe@example.com"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                            required 
                             className="border-gray-300 focus:border-primary focus:ring-primary"
                            />
                        </div>
                          <div className="space-y-2">
                            <Label htmlFor="password"  className="text-gray-700">Password</Label>
                            <Input id="password" type="password" placeholder="Enter your password"
                            value={password}
                             onChange={(e)=>setPassword(e.target.value)}
                            required 
                            minLength={8}
                             className="border-gray-300 focus:border-primary focus:ring-primary"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 border-none bg-white">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                           { loading ? 
                           (
                            <>
                            <Spinner className="h-6 w-6 animate-spin"/>
                            Create an account...
                            </>
                           )
                           
                            :"Sign Up"} 
                        </Button>
                        <p className="text-center text-sm text-gray-600">
                            Already have an account? <Link href="/sign-in" className="font-medium text-primary hover:underline">Log In</Link>
                        </p>
                    </CardFooter>
                </form>
           </Card>
        </div>
    )
}