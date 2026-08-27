import connectDB from "./db";
import { TeamProject, TeamTaskColumn } from "./models";

const DEFAULT_COLUMNS = [
    { name: "Draft", order: 0 },
    { name: "In Progress", order: 1 },
    { name: "Done/Completed", order: 2 },
];


export async function initializeTeamProject(name: string,userId:string) {
    console.log('jalan')
    try {
        

        if (!name.trim()) {
            return { error: "Team or project name is required" };
        }

        await connectDB();

        const existingProject = await TeamProject.findOne({ name: "Default Team", userId });
        if (existingProject) {
            return existingProject;
        }

        const project = await TeamProject.create({
            name: name.trim(),
            userId,
            columns: [],
        });

        console.log('project initialize', project);

        const columns = await TeamTaskColumn.insertMany(
            DEFAULT_COLUMNS.map((column) => ({
                ...column,
                projectId: project._id,
                tasks: [],
            })),
        );

        project.columns = columns.map((column) => column._id);
        await project.save();

        console.log('project result:', project);
        return project;
    }
    catch (err) {
        throw err;
    }

}
