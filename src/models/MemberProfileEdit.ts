import mongoose from "mongoose";

const schema = new mongoose.Schema({
    _id: { type: String, required: true },
    team_uuid: { type: String, required: true, index: true },
    slot: { type: Number, required: true },
    member_key: { type: String, required: true },
    email: { type: String, default: "" },
    phone_number: { type: String, default: "" },
    college: { type: String, default: "" },
    revision: { type: Number, required: true },
    updated_by: { type: String, required: true },
}, { timestamps: true, collection: "member_profile_overrides" });

export default mongoose.models.MemberProfileEdit || mongoose.model("MemberProfileEdit", schema);
