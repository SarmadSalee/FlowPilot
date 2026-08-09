import mongoose, { InferSchemaType, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    avatarColor: { type: String, default: 'indigo' },
    avatar: { type: String, default: '' },
    company: { type: String, trim: true, maxlength: 120 },
    googleId: { type: String },
    isVerified: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = mongoose.model('User', userSchema);