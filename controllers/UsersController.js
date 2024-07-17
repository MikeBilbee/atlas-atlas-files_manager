// User controller

const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    console.log('Request Body:', req.body);

    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const user = await dbClient.getUserByEmail(email);
      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      const newUser = await dbClient.createUser(email, hashedPassword);

      res.status(201).json({ email: newUser.email, id: newUser._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return null;
  }

  static async getMe(req, res) {
    await dbClient.connect();

    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized Token' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized User' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });

      return res.status(200).json({
        id: user._id,
        email: user.email,
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
