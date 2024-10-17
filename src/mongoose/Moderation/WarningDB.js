import mongoose from "mongoose";

const warningSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    warnings: [
        {
            moderatorId: { type: String, required: true },
            reason: { type: String, default: "No reason provided" },
            date: { type: Date, default: Date.now }
        }
    ]
});

export const Warning = mongoose.model("Warning", warningSchema);