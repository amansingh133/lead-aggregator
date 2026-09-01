import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../config/env.js';

export const issueAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

/**
 * Generates a readable temporary password for employees created by an Admin
 * (e.g. "Xk4-Rt92-Qw"). Sent back once in the create-employee response; the
 * employee is expected to change it via forgot-password on first login.
 */
export const generateTempPassword = () => {
  const raw = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}@${Math.floor(10 + Math.random() * 89)}`;
};
