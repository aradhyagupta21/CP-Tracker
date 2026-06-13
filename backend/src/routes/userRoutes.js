import express from 'express';
import crypto from 'crypto';
import { dbHelper } from '../config/dbHelper.js';

const router = express.Router();

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await dbHelper.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await dbHelper.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Signup user
router.post('/signup', async (req, res) => {
  try {
    const { username, password, codeforcesHandle, codechefHandle, leetcodeHandle } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const existing = await dbHelper.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const newUser = await dbHelper.createUser({
      username,
      password: hashPassword(password),
      codeforcesHandle: codeforcesHandle || '',
      codechefHandle: codechefHandle || '',
      leetcodeHandle: leetcodeHandle || '',
      friends: []
    });

    const userResponse = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register user profile from dashboard (without requiring a password)
router.post('/register', async (req, res) => {
  try {
    const { username, codeforcesHandle, codechefHandle, leetcodeHandle } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const existing = await dbHelper.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const newUser = await dbHelper.createUser({
      username,
      password: hashPassword('default_password_123'), // Default placeholder password for secondary profiles
      codeforcesHandle: codeforcesHandle || '',
      codechefHandle: codechefHandle || '',
      leetcodeHandle: leetcodeHandle || '',
      friends: []
    });

    const userResponse = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await dbHelper.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const userResponse = user.toObject ? user.toObject() : { ...user };
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user handles
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codeforcesHandle, codechefHandle, leetcodeHandle } = req.body;
    
    const updated = await dbHelper.updateUser(id, {
      codeforcesHandle: codeforcesHandle !== undefined ? codeforcesHandle : '',
      codechefHandle: codechefHandle !== undefined ? codechefHandle : '',
      leetcodeHandle: leetcodeHandle !== undefined ? leetcodeHandle : ''
    });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add friend
router.post('/:id/friends', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendUsername } = req.body;

    if (!friendUsername) {
      return res.status(400).json({ error: 'Friend username is required' });
    }

    const user = await dbHelper.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const friend = await dbHelper.getUserByUsername(friendUsername);
    if (!friend) {
      return res.status(404).json({ error: 'Friend user not found in tracker. Please register them first!' });
    }

    if (friend.username.toLowerCase() === user.username.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend' });
    }

    const currentFriends = user.friends || [];
    if (currentFriends.includes(friend.username)) {
      return res.status(400).json({ error: 'User is already your friend' });
    }

    const updatedFriends = [...currentFriends, friend.username];
    const updated = await dbHelper.updateUser(id, { friends: updatedFriends });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove friend
router.delete('/:id/friends/:friendUsername', async (req, res) => {
  try {
    const { id, friendUsername } = req.params;

    const user = await dbHelper.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentFriends = user.friends || [];
    const updatedFriends = currentFriends.filter(name => name.toLowerCase() !== friendUsername.toLowerCase());

    const updated = await dbHelper.updateUser(id, { friends: updatedFriends });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link platform via credentials (simulated authentication)
router.post('/:id/credentials', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, handle, password } = req.body;

    if (!platform || !handle || !password) {
      return res.status(400).json({ error: 'Platform, username, and password are required.' });
    }

    const user = await dbHelper.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash/mask the password to show security implementation
    const mockHash = 'enc_' + Buffer.from(`${platform}:${handle}:${password}`).toString('base64').substring(0, 16);

    const handleField = platform === 'Codeforces' ? 'codeforcesHandle' 
                      : platform === 'CodeChef' ? 'codechefHandle' 
                      : 'leetcodeHandle';

    const currentCredentials = user.credentials || [];
    const updatedCredentials = currentCredentials.filter(c => c.platform !== platform);
    
    updatedCredentials.push({
      platform,
      handle,
      token: mockHash,
      linkedAt: new Date()
    });

    const updateData = {
      credentials: updatedCredentials,
      [handleField]: handle
    };

    const updatedUser = await dbHelper.updateUser(id, updateData);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
