import { getUserActivities } from "./activities.service.js";

export async function listActivitiesController(req, res, next) {
  try {
    const userId = req.user.id;
    const activities = await getUserActivities(userId);
    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    return next(error);
  }
}
