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

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

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
        await fs.promises.mkdir(FOLDER_PATH, { recursive: true }); // Ensure directory exists
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
}

module.exports = FilesController;
