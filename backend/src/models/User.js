import mongoose from "mongoose";

const notificationSettingsSchema = new mongoose.Schema(
  {
    friendRequest: { type: Boolean, default: true },
    directMessage: { type: Boolean, default: true },
    groupMessage: { type: Boolean, default: true },
  },
  { _id: false },
);

const privacySettingsSchema = new mongoose.Schema(
  {
    showOnlineStatus: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    avatarId: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
      sparse: true,
    },
    preferences: {
      notifications: {
        type: notificationSettingsSchema,
        default: () => ({}),
      },
      privacy: {
        type: privacySettingsSchema,
        default: () => ({}),
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;