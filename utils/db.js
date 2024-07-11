const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.MongoClient = null;
    this.isConnected = false;
  }
  async isAlive() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.isConnected;
  }
  async connect() {
    const url = `mongodb://${this.host}:${this.port}`;
    try {
        this.client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
        this.isConnected = true;
    } catch (error) {
        console.error('Error connnecting to MongoDB', error);
        this.isConnected = false;
    }
  }
  async nbUsers () {
    if (!this.isConnected) {
        await this.connect();
    }
    if (!this.client) {
        return 0;
    }
    const collection = this.client.db(this.database).collection('users');
    try {
        const count = await collection.countDocuments;
        return count;
    } catch (error) {
        console.error('Error counting users', error);
        return 0;
    }
  }
  async nbFiles () {
    if (!this.isConnected) {
        await this.connect();
    }
    if (!this.client) {
        return 0;
    }
    const collection = this.client.db(this.database).collection('files');
    try {
        const count = await collection.countDocuments;
        return count;
    } catch (error) {
        console.error('Error counting files', error);
        return 0;
    }
  }
  get isConnected() {
    return this.isConnected;
  }
}

module.exports = DBClient;