import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { GENDER_VALUES, ROLE_VALUES, ROLE } from "../../../utils/constants.js";

const otpSchema = new mongoose.Schema(
  {
    code: { type: String, default: null },
    purpose: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Username is auto-populated with the email as per spec, kept as a
    // separate field so the login contract (username + password) is stable
    // even if email-based login rules change later.
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobileNumber: { type: String, required: true, trim: true },
    gender: { type: String, enum: GENDER_VALUES, required: true },
    address: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: false },
    otp: { type: otpSchema, default: () => ({}) },
    fcmTokens: { type: [String], default: [] },

    // ── RBAC ──────────────────────────────────────────────────
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLE.EMPLOYEE,
      required: true,
    },
    // The one "primary" Super Admin - the org owner. Set only by the
    // one-time bootstrap route (see controllers/bootstrap.controller.js);
    // never settable through any authenticated endpoint. The primary can
    // manage other Super Admins and can never be deactivated or deleted.
    isPrimary: { type: Boolean, default: false },
    // Deactivated employees (soft-deleted by an Admin) can no longer log in,
    // but their historical leads/attendance/follow-ups are preserved.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
// Hard database-level guarantee that at most one primary Super Admin exists,
// so a race on the bootstrap route can never create two.
userSchema.index(
  { isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } },
);

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.fcmTokens;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model("User", userSchema);
