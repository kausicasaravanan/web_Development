import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";

export const sessionCookieName = "unfazed_session";

export const requireTherapist: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[sessionCookieName];
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (typeof decoded.sub !== "string" || decoded.sub.length === 0) {
      res.status(401).json({ error: "Your session is invalid. Please sign in again." });
      return;
    }

    res.locals.therapistId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
};