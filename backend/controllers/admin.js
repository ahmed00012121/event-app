const Admin = require('../models/admin');
const { generateToken } = require('../utils/auth');
const bcrypt = require('bcryptjs');

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  console.info(`Admin login attempt for: ${email}`);

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("❌ No admin found with that email.");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Use the model's matchPassword method
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      console.info(`Admin login failed for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(admin);
    console.info(`Admin login successful for: ${email}`);

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("💥 Admin login error:", err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { loginAdmin };
