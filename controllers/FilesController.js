// controllers/FilesController.js

const { ObjectId } = require('mongodb');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    await dbClient.connect();

    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized Token' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized UserId' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized User' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: dbClient.getObjectId(parentId), userId: user._id });

      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId ? dbClient.getObjectId(parentId) : 0,
    };

    if (type !== 'folder') {
      const localPath = `${FOLDER_PATH}/${uuidv4()}`;
      const fileData = Buffer.from(data, 'base64');

      try {
        await fs.promises.mkdir(FOLDER_PATH, { recursive: true });
        await fs.promises.writeFile(localPath, fileData);
        newFile.localPath = localPath;
      } catch (err) {
        console.error('Error writing file:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    const result = await dbClient.db.collection('files').insertOne(newFile);
    return res.status(201).json({
      id: result.insertedId,
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    await dbClient.connect();

    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized token' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized UserId' });
      }

      const user = await dbClient.getUserById(ObjectId(userId));
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized User' });
      }

      const file = await dbClient.db.collection('files')
        .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
      if (!file) {
        return res.status(404).json({ error: 'FIle Not found' });
      }
      return res.status(200).json(file);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIndex(req, res) {
    await dbClient.connect();

    const token = req.headers['x-token'];
    const { parentId = 0, page = 0 } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized Token' });
    }
    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized UserId' });
      }

      const user = await dbClient.getUserById(ObjectId(userId));
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized User' });
      }

      const pipeline = [
        { $match: { userId: user._id, parentId: ObjectId(parentId) } },
        { $skip: parseInt(page, 10) * 20 },
        { $limit: 20 },
      ];
      const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();
      return res.status(200).json(files);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = FilesController;
