import { Router } from "express";
import { listActivitiesController } from "./activities.controller.js";

const activitiesRouter = Router();
activitiesRouter.get("/", listActivitiesController);

export default activitiesRouter;
