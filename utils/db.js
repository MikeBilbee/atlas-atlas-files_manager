// utils/db.js

const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.url = process.env.MONGODB_URI || 'mongodb+srv://guest:guest@cluster0.wji5iwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = await MongoClient.connect(this.url,
        { useNewUrlParser: true, useUnifiedTopology: true });
      this.db = this.client.db(process.env.DB_DATABASE || 'files_manager');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  async isAlive() {
    await this.connect();
    return !!this.db;
  }

  async nbUsers() {
    if (!this.db) {
      await this.connect();
    }
    try {
      const collection = this.db.collection('users');
      return await collection.countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  async nbFiles() {
    if (!this.db) {
      await this.connect();
    }
    try {
      if (!this.db) throw new Error('Database not initialized');
      const collection = this.db.collection('files');
      return await collection.countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      throw err;
    }
  }

  async getUserByEmail(email) {
    if (!this.db) {
      await this.connect();
    }
    try {
      const collection = this.db.collection('users');
      return await collection.findOne({ email });
    } catch (error) {
      console.error('Error getting email:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    if (!this.db) {
      await this.connect();
    }
    try {
      const collection = this.db.collection('users');
      return await collection.findOne({ _id: userId });
    } catch (error) {
      console.error('Error getting userId:', error);
      throw error;
    }
  }

  async createUser(email, password) {
    if (!this.db) {
      await this.connect();
    }
    try {
      const collection = this.db.collection('users');
      const user = {
        email,
        password,
      };
      const result = await collection.insertOne(user);
      return await result.ops[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
