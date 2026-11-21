import mongoose from "mongoose";

// Imported Unstop contacts live in private storage, outside the public Git repository.
const schema = new mongoose.Schema({
    _id: { type: String, required: true },
    teams: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { collection: "participant_imports" });

export default mongoose.models.ParticipantImport || mongoose.model("ParticipantImport", schema);
