import { Router, type IRouter } from "express";
import {
  GetPublicTherapistProfileParams,
  GetPublicTherapistProfileResponse,
  UpdateTherapistProfileBody,
  UpdateTherapistProfileResponse,
} from "@workspace/api-zod";
import { requireTherapist } from "../middleware/requireTherapist";
import { TherapistModel } from "../models/Therapist";

const router: IRouter = Router();

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

router.patch("/therapists/me", requireTherapist, async (req, res) => {
  const input = UpdateTherapistProfileBody.parse(req.body);
  const update = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );

  try {
    const therapist = await TherapistModel.findByIdAndUpdate(
      res.locals.therapistId,
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!therapist) {
      res.status(404).json({ error: "Therapist account not found." });
      return;
    }

    res.json(
      UpdateTherapistProfileResponse.parse(therapistPayload(therapist)),
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({ error: "That public profile link is already in use." });
      return;
    }

    throw error;
  }
});

router.get("/therapists/:slug", async (req, res) => {
  const { slug } = GetPublicTherapistProfileParams.parse(req.params);
  const therapist = await TherapistModel.findOne({ slug }).select(
    "name slug bio specializations languages services",
  );

  if (!therapist) {
    res.status(404).json({ error: "This therapist profile could not be found." });
    return;
  }

  res.json(
    GetPublicTherapistProfileResponse.parse({
      name: therapist.name,
      slug: therapist.slug,
      bio: therapist.bio ?? "",
      specializations: therapist.specializations ?? [],
      languages: therapist.languages ?? [],
      services: (therapist.services ?? []).map((service: {
        _id: { toString(): string };
        title: string;
        description?: string;
        durationMinutes: number;
        feeInr: number;
      }) => ({
        id: service._id.toString(),
        title: service.title,
        description: service.description ?? "",
        durationMinutes: service.durationMinutes,
        feeInr: service.feeInr,
      })),
    }),
  );
});

export default router;