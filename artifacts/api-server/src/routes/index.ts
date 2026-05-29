import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nutritionRouter from "./nutrition";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/nutrition", nutritionRouter);

export default router;
