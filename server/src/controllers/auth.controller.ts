import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { authService } from "../services/auth.service.js";
import {
  humanNameSchema,
  passwordSchema,
  usernameSchema,
} from "../utils/validation.js";

const registerSchema = z
  .object({
    email: z.string().trim().email(),
    username: usernameSchema,
    password: passwordSchema,
    name: humanNameSchema.optional(),
    firstName: humanNameSchema.optional(),
    lastName: humanNameSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.name && !value.firstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Name is required",
      });
    }
  })
  .transform((value) => {
    const normalizedName = value.name?.trim();
    const normalizedFirstName = value.firstName?.trim();
    const normalizedLastName = value.lastName?.trim();

    if (normalizedFirstName) {
      return {
        email: value.email,
        username: value.username,
        password: value.password,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      };
    }

    const parts = normalizedName?.split(/\s+/).filter(Boolean) ?? [];
    const [firstName, ...rest] = parts;

    return {
      email: value.email,
      username: value.username,
      password: value.password,
      firstName: firstName ?? "",
      lastName: rest.length ? rest.join(" ") : undefined,
    };
  });

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
  password: z.string().min(10).max(72),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response) {
    const payload = registerSchema.parse(req.body);
    logger.info("auth.register_attempt", {
      email: payload.email,
      username: payload.username,
      hasLastName: Boolean(payload.lastName),
    });
    const result = await authService.register(payload);

    return res.status(StatusCodes.CREATED).json(result);
  },

  async login(req: Request, res: Response) {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);

    return res.status(StatusCodes.OK).json(result);
  },

  async refresh(req: Request, res: Response) {
    const payload = refreshSchema.parse(req.body);
    const result = await authService.refresh(payload.refreshToken);

    return res.status(StatusCodes.OK).json(result);
  },

  async logout(req: Request, res: Response) {
    const payload = refreshSchema.parse(req.body);
    await authService.logout(payload.refreshToken);

    return res.status(StatusCodes.OK).json({ message: "Logged out" });
  },
};
