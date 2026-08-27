import mongoose, { Schema, Document } from "mongoose";

export interface ITeamTaskColumn extends Document {
  name: string;
  projectId: mongoose.Types.ObjectId;
  order: number;
  tasks: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamTaskColumnSchema = new Schema<ITeamTaskColumn>(
  {
    name: {
      type: String,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "TeamProject",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "TeamTask",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.TeamTaskColumn ||
  mongoose.model<ITeamTaskColumn>("TeamTaskColumn", TeamTaskColumnSchema);
