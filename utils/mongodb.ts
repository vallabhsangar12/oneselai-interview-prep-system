import { MongoClient, type Db } from "mongodb";

// Default to local MongoDB if MONGODB_URI is not set
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/oneself-ai-interview";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  // Extract DB name from URI or default to oneself-ai-interview
  const dbName = new URL(uri).pathname.replace("/", "") || "oneself-ai-interview";
  return connectedClient.db(dbName);
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}
