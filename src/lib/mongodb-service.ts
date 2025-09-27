import { MongoClient, Db, Collection, ObjectId } from 'mongodb'

// Server-side only check
if (typeof window !== 'undefined') {
  throw new Error('MongoDB service can only be used on the server side')
}

export class MongoDBService {
  private static instance: MongoDBService
  private client: MongoClient
  private db: Db | null = null
  private isConnected: boolean = false

  private constructor() {
    // Automatically determine DATABASE_URL based on environment
    const databaseUrl = this.getDatabaseUrl()
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Configure MongoDB client options for better connection handling
    const clientOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      minPoolSize: 0,
      retryWrites: true,
      retryReads: true,
    }

    this.client = new MongoClient(databaseUrl, clientOptions)
  }

  private getDatabaseUrl(): string {
    // Environment-based database URL selection
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'

    if (isProduction) {
      // In production, prioritize PROD_DATABASE_URL, fallback to DATABASE_URL
      return process.env.PROD_DATABASE_URL ||
             process.env.DATABASE_URL ||
             'mongodb+srv://winniengiew:Orion888%21@prod.zq1ynq1.mongodb.net/testcasewriter?retryWrites=true&w=majority&appName=Prod'
    } else {
      // In development, prioritize DEV_DATABASE_URL, fallback to DATABASE_URL
      return process.env.DEV_DATABASE_URL ||
             process.env.DATABASE_URL ||
             'mongodb+srv://winniengiew:Orion888%21@cluster0.axqvcva.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    }
  }

  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService()
    }
    return MongoDBService.instance
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect()
        this.db = this.client.db('testcasewriter')
        this.isConnected = true
        console.log('MongoDB connected successfully')
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error)
        throw error
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close()
      this.isConnected = false
      this.db = null
      console.log('MongoDB disconnected')
    }
  }

  public getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  public getCollection(name: string): Collection {
    return this.getDatabase().collection(name)
  }

  // Generic CRUD operations
  public async findOne<T>(collectionName: string, filter: any): Promise<T | null> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)
      const result = await collection.findOne(filter)
      return result as T | null
    } catch (error) {
      console.error(`Error finding document in ${collectionName}:`, error)
      throw error
    }
  }

  public async findMany<T>(
    collectionName: string,
    filter: any = {},
    options: any = {}
  ): Promise<T[]> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)
      const cursor = collection.find(filter, options)
      const results = await cursor.toArray()
      return results as T[]
    } catch (error) {
      console.error(`Error finding documents in ${collectionName}:`, error)
      throw error
    }
  }

  public async insertOne<T>(collectionName: string, document: any): Promise<T> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)

      // Add timestamps
      const docWithTimestamps = {
        ...document,
        createdAt: document.createdAt || new Date(),
        updatedAt: document.updatedAt || new Date()
      }

      const result = await collection.insertOne(docWithTimestamps)
      const insertedDoc = {
        ...docWithTimestamps,
        _id: result.insertedId,
        id: result.insertedId.toString()
      }
      return insertedDoc as T
    } catch (error) {
      console.error(`Error inserting document into ${collectionName}:`, error)
      throw error
    }
  }

  public async insertMany<T>(collectionName: string, documents: any[]): Promise<T[]> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)

      // Add timestamps to all documents
      const docsWithTimestamps = documents.map(doc => ({
        ...doc,
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date()
      }))

      const result = await collection.insertMany(docsWithTimestamps)
      const insertedDocs = docsWithTimestamps.map((doc, index) => ({
        ...doc,
        _id: result.insertedIds[index],
        id: result.insertedIds[index].toString()
      }))
      return insertedDocs as T[]
    } catch (error) {
      console.error(`Error inserting documents into ${collectionName}:`, error)
      throw error
    }
  }

  public async updateOne<T>(
    collectionName: string,
    filter: any,
    update: any,
    options: any = {}
  ): Promise<T | null> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)

      // Add updated timestamp
      const updateWithTimestamp = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      }

      const result = await collection.findOneAndUpdate(
        filter,
        updateWithTimestamp,
        { returnDocument: 'after', ...options }
      )
      return result as T | null
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error)
      throw error
    }
  }

  public async updateMany(
    collectionName: string,
    filter: any,
    update: any
  ): Promise<number> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)

      // Add updated timestamp
      const updateWithTimestamp = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      }

      const result = await collection.updateMany(filter, updateWithTimestamp)
      return result.modifiedCount
    } catch (error) {
      console.error(`Error updating documents in ${collectionName}:`, error)
      throw error
    }
  }

  public async deleteOne(collectionName: string, filter: any): Promise<boolean> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)
      const result = await collection.deleteOne(filter)
      return result.deletedCount > 0
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error)
      throw error
    }
  }

  public async deleteMany(collectionName: string, filter: any): Promise<number> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)
      const result = await collection.deleteMany(filter)
      return result.deletedCount
    } catch (error) {
      console.error(`Error deleting documents from ${collectionName}:`, error)
      throw error
    }
  }

  // Utility methods
  public async count(collectionName: string, filter: any = {}): Promise<number> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)
      return await collection.countDocuments(filter)
    } catch (error) {
      console.error(`Error counting documents in ${collectionName}:`, error)
      throw error
    }
  }

  public async aggregate<T>(collectionName: string, pipeline: any[]): Promise<T[]> {
    try {
      await this.connect()
      const collection = this.getCollection(collectionName)
      const cursor = collection.aggregate(pipeline)
      const results = await cursor.toArray()
      return results as T[]
    } catch (error) {
      console.error(`Error running aggregation on ${collectionName}:`, error)
      throw error
    }
  }

  public createObjectId(id?: string): ObjectId {
    return id ? new ObjectId(id) : new ObjectId()
  }

  public isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id)
  }

  // Collection-specific helpers
  public async createIndexes(): Promise<void> {
    try {
      await this.connect()

      // Users collection indexes
      await this.getCollection('users').createIndex({ email: 1 }, { unique: true })
      await this.getCollection('users').createIndex({ username: 1 })
      await this.getCollection('users').createIndex({ id: 1 }, { unique: true })

      // Test cases collection indexes
      await this.getCollection('test_cases').createIndex({ id: 1 }, { unique: true })
      await this.getCollection('test_cases').createIndex({ projectId: 1 })
      await this.getCollection('test_cases').createIndex({ title: 'text', description: 'text' })

      // Test runs collection indexes
      await this.getCollection('test_runs').createIndex({ id: 1 }, { unique: true })
      await this.getCollection('test_runs').createIndex({ projectId: 1 })
      await this.getCollection('test_runs').createIndex({ createdBy: 1 })

      // Teams collection indexes
      await this.getCollection('teams').createIndex({ id: 1 }, { unique: true })
      await this.getCollection('teams').createIndex({ name: 1 })

      // Projects collection indexes
      await this.getCollection('projects').createIndex({ id: 1 }, { unique: true })
      await this.getCollection('projects').createIndex({ ownerId: 1 })
      await this.getCollection('projects').createIndex({ status: 1 })
      await this.getCollection('projects').createIndex({ name: 'text', description: 'text' })

      console.log('MongoDB indexes created successfully')
    } catch (error) {
      console.error('Error creating MongoDB indexes:', error)
      throw error
    }
  }
}

// Export singleton instance
export const mongodb = MongoDBService.getInstance()

// Type definitions for common collections
export interface MongoDocument {
  _id?: ObjectId
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserDocument extends MongoDocument {
  email: string
  name: string
  username: string
  password: string
  role: 'super-admin' | 'admin' | 'lead' | 'qa' | 'user'
  avatar?: string | null
}

export interface TestCaseDocument extends MongoDocument {
  title: string
  description?: string
  steps: Array<{
    id: string
    step: string
    expected: string
  }>
  priority: 'low' | 'medium' | 'high' | 'critical'
  type: string
  tags: string[]
  projectId?: string
  createdBy: string
}

export interface TestRunDocument extends MongoDocument {
  name: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  projectId?: string
  testCases: Array<{
    testCaseId: string
    status: 'pending' | 'passed' | 'failed' | 'skipped'
    assignedTo?: string
    executedAt?: Date
    notes?: string
  }>
  createdBy: string
  assignedTo?: string[]
  dueDate?: Date
}

export interface TeamDocument extends MongoDocument {
  name: string
  description?: string
  members: Array<{
    userId: string
    role: 'member' | 'lead'
    joinedAt: Date
  }>
  projectIds: string[]
  createdBy: string
}

export interface ProjectDocument extends MongoDocument {
  name: string
  description?: string
  status: 'active' | 'archived' | 'draft'
  ownerId: string
  testCaseCount: number
  templateCount: number
  memberCount: number
}