import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import therapistsRouter from "./therapists";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(therapistsRouter);

export default router;
