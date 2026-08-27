import mongoose, { Schema, Document } from "mongoose";

export interface ITeamProject extends Document {
  name: string;
  userId: string;
  columns: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamProjectSchema = new Schema<ITeamProject>(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    columns: [
      {
        type: Schema.Types.ObjectId,
        ref: "TeamTaskColumn",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.TeamProject ||
  mongoose.model<ITeamProject>("TeamProject", TeamProjectSchema);
