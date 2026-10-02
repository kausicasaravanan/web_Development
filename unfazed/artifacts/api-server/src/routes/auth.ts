import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router, type IRouter, type Response } from "express";
import {
  GetCurrentTherapistResponse,
  LoginTherapistBody,
  LoginTherapistResponse,
  RegisterTherapistBody,
  RegisterTherapistResponse,
} from "@workspace/api-zod";
import { TherapistModel } from "../models/Therapist";
import {
  requireTherapist,
  sessionCookieName,
} from "../middleware/requireTherapist";

const router: IRouter = Router();
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

function slugBase(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");

  return normalized || "therapist";
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugBase(name);
  let candidate = base;
  let suffix = 2;

  while (await TherapistModel.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function therapistPayload(therapist: {
  _id: { toString(): string };
  name: string;
  email: string;
  slug: string;
  bio?: string;
  specializations?: string[];
  languages?: string[];
  services?: Array<{
    _id: { toString(): string };
    title: string;
    description?: string;
    durationMinutes: number;
    feeInr: number;
  }>;
}) {
  return {
    id: therapist._id.toString(),
    name: therapist.name,
    email: therapist.email,
    slug: therapist.slug,
    bio: therapist.bio ?? "",
    specializations: therapist.specializations ?? [],
    languages: therapist.languages ?? [],
    services: (therapist.services ?? []).map((service) => ({
      id: service._id.toString(),
      title: service.title,
      description: service.description ?? "",
      durationMinutes: service.durationMinutes,
      feeInr: service.feeInr,
    })),
  };
}

function setSessionCookie(res: Response, therapistId: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required to create a therapist session.");
  }

  const token = jwt.sign({ sub: therapistId }, secret, { expiresIn: "7d" });
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api",
    maxAge: sessionLifetimeMs,
  });
}

router.post("/auth/register", async (req, res) => {
  const input = RegisterTherapistBody.parse(req.body);
  const email = input.email.trim().toLowerCase();
  const existing = await TherapistModel.exists({ email });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  let therapist;
  try {
    therapist = await TherapistModel.create({
      name: input.name.trim(),
      email,
      passwordHash,
      slug: await uniqueSlug(input.name),
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({ error: "This email address or profile link is already in use." });
      return;
    }
    throw error;
  }
  setSessionCookie(res, therapist._id.toString());
  res.status(201).json(
    RegisterTherapistResponse.parse({ therapist: therapistPayload(therapist) }),
  );
});

router.post("/auth/login", async (req, res) => {
  const input = LoginTherapistBody.parse(req.body);
  const therapist = await TherapistModel.findOne({
    email: input.email.trim().toLowerCase(),
  }).select("+passwordHash");

  if (!therapist || !(await bcrypt.compare(input.password, therapist.passwordHash))) {
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  setSessionCookie(res, therapist._id.toString());
  res.json(LoginTherapistResponse.parse({ therapist: therapistPayload(therapist) }));
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api",
  });
  res.status(204).end();
});

router.get("/auth/me", requireTherapist, async (_req, res) => {
  const therapist = await TherapistModel.findById(res.locals.therapistId);
  if (!therapist) {
    res.status(401).json({ error: "Your account is no longer available." });
    return;
  }

  res.json(
    GetCurrentTherapistResponse.parse(therapistPayload(therapist)),
  );
});

export default router;