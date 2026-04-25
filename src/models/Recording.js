import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
        },
        topic: String,
        videoUrl: String,
    },
    { timestamps: true }
);

export default mongoose.model("Recording", recordingSchema);