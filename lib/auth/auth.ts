import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { headers } from "next/headers";
import { initializeUserBoard } from "../init-user-board";
import { createTeamProject } from "../actions/team-tasks";
import { initializeTeamProject } from "../ini-user-team";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
    database:mongodbAdapter(db,{
        client
    }),
    emailAndPassword:{
        enabled:true,
    },
    session: {
     cookieCache:{
        enabled:true,
        maxAge:60*60
     }
    },
    databaseHooks:{
        user:{
            create:{
                after:async(user)=>{
                    if(user.id){
                        try{
                            await Promise.all([
                            await initializeUserBoard(user.id),
                            await initializeTeamProject("Default Team",user.id)
                        ]);
                        } catch(err){
                            throw err;
                        }
                        
                       
                    }
                }
            }
        }
    }
});

export async function getSession(){
    const session = await auth.api.getSession({
        headers: await headers()
    });
    return session;
}