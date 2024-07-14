// utils/db.js

const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
      })
      .catch((err) => console.error('DB connection err', err));
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    try {
      const db = this.client.db();
      const collection = db.collection('users');
      return await collection.countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
      throw err;
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db();
      const collection = db.collection('files');
      return await collection.countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      throw err;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
