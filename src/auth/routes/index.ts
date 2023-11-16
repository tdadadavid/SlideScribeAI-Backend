import { Router } from "express";
import { authRateLimiter, controlHandler } from "../../core";
import { currentUser, signIn, signOut } from "../auth.module";
import { signInSchema } from "./schema";

export const authRouter = Router();

authRouter
  .use(authRateLimiter)
  .post("/sign-in", controlHandler.handle(signIn.handle, signInSchema))
  .post("/sign-out", currentUser.handle, controlHandler.handle(signOut.handle));