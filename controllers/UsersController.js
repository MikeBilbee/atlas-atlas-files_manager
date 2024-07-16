// User controller

const crypto = require('crypto');
const dbClient = require('../utils/db');

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
      const user = await dbClient.getUserByEmail({ email });
      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      const newUser = {
        email,
        password: hashedPassword,
      };
      const result = await dbClient.createUser(newUser);

      return res.status(201).json({
        id: result.insertedId,
        email,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
