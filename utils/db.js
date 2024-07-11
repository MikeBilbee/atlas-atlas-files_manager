const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${host}:${port}`, {useNewUrlParser: true, useUnifiedTopology: true });
    this.db = null;
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
    if (!this.isAlive()) return 0;
    return this.db.collection('users').countDocuments();
  }
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = DBClient;