import connectDB from "./db";
import {Board,Column} from "./models";

const DEFAULT_COLUMS =[
    {
        name:"Wishlist",
        order:0
    },
    {
        name:"Applied",
        order:1
    },
    {
        name:"Interviewing",
        order:2
    },
    {
        name: "Offer",
        order:3
    },
    {
        name:"Rejected",
        order:4
    }
];

export async function initializeUserBoard(userId:string){
    try{
        await connectDB();

        // check if board already exist
        const existingBoard = await Board.findOne({name:"Job Hunt",userId})
        if(existingBoard){
            return existingBoard;
        }

        // create board 
       const board =  await Board.create({
            name:"Job Hunt",
            userId,
            columns:[]
        });

        const columns =  await Promise.all(
            DEFAULT_COLUMS.map(col=>
            Column.create({
                name:col.name,
                order: col.order,
                boardId: board._id,
                jobApplication:[]
            })

        ));
        
        //update board
        board.columns = columns.map((col)=>col._id);

        await board.save();

        return board;
    }catch(err){
        throw err;
    }
}