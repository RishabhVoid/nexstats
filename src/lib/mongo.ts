import mongoose from "mongoose";

let conn: typeof mongoose | null = null;

export async function connectMongo() {
    if (conn) return conn;
    const uri = process.env.MONGO_DB_URL as string;
    if (!uri) throw new Error("MONGODB_URI is not set");
    conn = await mongoose.connect(uri);
    return conn;
};