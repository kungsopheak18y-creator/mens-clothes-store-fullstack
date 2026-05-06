import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

export const register = async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName, gender, dateOfBirth } = req.body;

    // Check if user exists by email OR phone
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : ''; // 👈 fixed

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        name: fullName,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        role: 'USER',
      },
    });

    const token = generateToken(user.id, user.email, user.role);

    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // 👈 must be true for cross-domain
      sameSite: 'none', // 👈 change from 'strict' to 'none' for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);

    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    res.cookie('token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(0)
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        createdAt: true,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user profile (first name, last name, phone, gender, date of birth)
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, gender, dateOfBirth } = req.body;
    const userId = req.user.id;

    if (phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, NOT: { id: userId } },
      });
      if (existing) return res.status(400).json({ error: 'Phone already in use' });
    }

    const fullName = firstName && lastName ? `${firstName} ${lastName}` : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        name: fullName,
        phone: phone !== undefined ? phone : undefined,
        gender: gender !== undefined ? gender : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        role: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Update failed' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Password change failed' });
  }
};