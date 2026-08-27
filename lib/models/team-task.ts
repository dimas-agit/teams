import mongoose, { Schema, Document } from "mongoose";

export interface IChecklistItem{
  id: string;
  description: string;
  completed: boolean;
}

export interface ITeamTask extends Document {
  title: string;
  description?: string;
  progress: number;
  note?: string;
  columnId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: string;
  order: number;
  imageUrl:string[];
  checklistItems:IChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamTaskSchema = new Schema<ITeamTask>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    progress: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    note: {
      type: String,
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: "TeamTaskColumn",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "TeamProject",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    imageUrl:[
      {
        type:String

      }
    ],
    checklistItems:{
      type:[
         {
        id:{
          type: String,
          required:true
        },
        description:{
          type : String,
          required: true,
        },
        completed:{
          type: Boolean,
          default:false,
        } 
      }
      ],
      default:[],
    },
    
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.TeamTask ||
  mongoose.model<ITeamTask>("TeamTask", TeamTaskSchema);
