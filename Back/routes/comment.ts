import express from "express";
import {
	getComments,
	createComment,
	deleteComment,
	getMediaUrl,
} from "../controllers/comments";

const router = express.Router();

router.get("/:postId", getComments);
router.post("/", createComment);
router.delete("/:id", deleteComment);
router.get("/media-url/:key", getMediaUrl);

export default router;
