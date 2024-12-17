import { MongoClient } from 'mongodb'

if (!process.env.DATABASE_URL) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // Development módban újrahasználjuk a kapcsolatot
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(process.env.DATABASE_URL)
    ;(global as any)._mongoClientPromise = client.connect()
  }
  clientPromise = (global as any)._mongoClientPromise
} else {
  // Production módban új kapcsolatot hozunk létre
  client = new MongoClient(process.env.DATABASE_URL)
  clientPromise = client.connect()
}

export default clientPromise