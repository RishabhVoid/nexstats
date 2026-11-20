import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const TeamMemberSchema = new Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        phone: { type: String, trim: true, maxlength: 30 },
        is_leader: { type: Boolean, default: false }
    },
    { _id: false }
);

const TeamStatusSchema = new Schema(
    {
        state: { type: String, enum: ["active", "eliminated", "disqualified"], default: "active" },
        note: { type: String, trim: true, maxlength: 1000, default: "" }
    },
    { _id: false }
);

const TeamSchema = new Schema(
    {
        emails: {
            type: [String],
            required: true,
            validate: {
                validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0 && new Set(arr.map(e => e.toLowerCase().trim())).size === arr.length
            },
            set: (arr: string[]) => arr.map(e => e.toLowerCase().trim())
        },
        name: { type: String, required: true, trim: true, maxlength: 120, index: true },
        members_count: { type: Number, required: true, min: 1 },
        members_data: {
            type: [TeamMemberSchema],
            required: true,
            validate: {
                validator: (arr: Array<{ email: string }>) => Array.isArray(arr) && arr.length > 0 && new Set(arr.map(m => m.email)).size === arr.length
            }
        },
        assigned_block: { type: String, trim: true, maxlength: 50 },
        assigned_floor: { type: String, min: -10, max: 200 },
        assigned_room_no: { type: String, trim: true, maxlength: 50 },
        assigned_desk: { type: String, trim: true, maxlength: 50, required: false, default: "" },
        college_id: { type: Boolean, required: true },
        aadhar_id: { type: Boolean, required: true },
        kit_distribution: { type: Boolean, required: true },
        emergency_contact: { type: String, required: true },
        archiveSheetPending: { type: Boolean, default: false },
        notes: { type: String, trim: true, maxlength: 1000 },

        status: { type: TeamStatusSchema, default: { state: "active", note: "" } }
    },
    { timestamps: true }
);

TeamSchema.index({ emails: 1 });
TeamSchema.index({ "members_data.email": 1 });

TeamSchema.pre("validate", function (next) {
    const self = this as mongoose.Document & { emails: string[]; members_data: Array<{ email: string; is_leader?: boolean }>; members_count: number };
    self.members_count = Array.isArray(self.members_data) ? self.members_data.length : 0;
    const memberEmails = (self.members_data || []).map(m => m.email);
    const emailsSet = new Set(self.emails);
    const allInTop = memberEmails.every(e => emailsSet.has(e));
    const leaders = (self.members_data || []).filter(m => m.is_leader === true).length;
    if (!allInTop) return next(new Error("All member emails must be present in the top-level emails array"));
    if (leaders > 1) return next(new Error("Only one team member can be marked as leader"));
    if (self.members_count < 1) return next(new Error("Team must have at least one member"));
    next();
});

export type Team = InferSchemaType<typeof TeamSchema>;
export const TeamModel: Model<Team> = mongoose.models.Team || mongoose.model<Team>("Team", TeamSchema);
export const ArchiveTeamModel: Model<Team> = mongoose.models.ArchiveTeam || mongoose.model<Team>("ArchiveTeam", TeamSchema, "teams_nexhack_one");
export function editionTeamModel(req: Request) {
    return new URL(req.url).pathname.startsWith("/api/archive-nexhack-one/") ? ArchiveTeamModel : TeamModel;
}
