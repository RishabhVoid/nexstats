import mongoose from "mongoose";

const schema = new mongoose.Schema({
    _id: { type: String, required: true },
    member_names: { type: [String], required: true },
    college: String,
    room_override: String,
    internet_access: { username: String, password: String },
    updated_at: Date,
}, { collection: "team_event_data" });

export default mongoose.models.TeamEventData || mongoose.model("TeamEventData", schema);
