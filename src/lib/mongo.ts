import mongoose from "mongoose";

let conn: typeof mongoose | null = null;

export async function connectMongo() {
    if (conn) return conn;
    const managed = process.env.MONGODB_URI;
    const uri = managed || process.env.MONGO_DB_URL;
    if (!uri) throw new Error("MONGO_DB_URL is not set");
    conn = await mongoose.connect(uri, managed ? { dbName: "nexstats_2" } : {});
    return conn;
};