import mongoose from 'mongoose';

const punchSchema = new mongoose.Schema(
  {
    time: { type: Date, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, trim: true, default: '' },
    ipAddress: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Stored as 'YYYY-MM-DD' (server local date) so there is exactly one
    // document per user per calendar day, and monthly reports are a cheap
    // prefix/range query instead of a date-math aggregation.
    date: { type: String, required: true },
    checkIn: { type: punchSchema, required: true },
    checkOut: { type: punchSchema, default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
