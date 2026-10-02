import mongoose, { type InferSchemaType } from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    durationMinutes: { type: Number, required: true, enum: [30, 45, 60, 90] },
    feeInr: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const therapistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 48,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 3000,
    },
    specializations: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 12,
        message: "A maximum of 12 specializations is allowed.",
      },
    },
    languages: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 12,
        message: "A maximum of 12 languages is allowed.",
      },
    },
    services: {
      type: [serviceSchema],
      default: [],
      validate: {
        validator: (value: unknown[]) => value.length <= 12,
        message: "A maximum of 12 services is allowed.",
      },
    },
  },
  { timestamps: true, versionKey: false },
);

export type TherapistDocument = InferSchemaType<typeof therapistSchema>;

export const TherapistModel =
  mongoose.models.Therapist ??
  mongoose.model("Therapist", therapistSchema);