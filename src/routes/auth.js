const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const {
  createUser,
  findUserByUsername,
  findApprovedAdmin,
  createApprovedAdmin,
  deleteApprovedAdmin,
  getAllApprovedAdmins,
} = require('../db/queries');

const router = express.Router();

function createToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be configured');
  }

  const payload = { id: user.id, username: user.username };
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, special_word } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'Username and password are required' });
    }

    const approvedAdmin = await findApprovedAdmin(username);
    if (!approvedAdmin) {
      return res.status(403).json({ message: 'Username is not approved for registration' });
    }

    // If special_word is required (not null), validate it
    if (approvedAdmin.special_word !== null && approvedAdmin.special_word !== special_word) {
      return res.status(403).json({ message: 'Incorrect special word' });
    }

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(username, passwordHash);

    res.status(201).json({ id: user.id, username: user.username });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({ token, expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/approve', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.username !== 'merryface') {
      return res.status(403).json({ message: 'Only merryface can approve new admins' });
    }

    const { username, special_word } = req.body;

    if (!username || !special_word) {
      return res.status(400).json({ message: 'Username and special_word are required' });
    }

    const existing = await findApprovedAdmin(username);
    if (existing) {
      return res.status(409).json({ message: 'Username already approved' });
    }

    const approved = await createApprovedAdmin(username, special_word);
    res.status(201).json({ id: approved.id, username: approved.username });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/approved-users', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.username !== 'merryface') {
      return res.status(403).json({ message: 'Only merryface can view approved admins' });
    }

    const approvedAdmins = await getAllApprovedAdmins();
    res.json(approvedAdmins);
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/approve/:username', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.username !== 'merryface') {
      return res.status(403).json({ message: 'Only merryface can remove approved admins' });
    }

    if (req.params.username === 'merryface') {
      return res.status(400).json({ message: 'Cannot remove merryface from approved list' });
    }

    const deleted = await deleteApprovedAdmin(req.params.username);
    if (!deleted) {
      return res.status(404).json({ message: 'Approved admin not found' });
    }

    res.json({ message: 'Approved admin removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

