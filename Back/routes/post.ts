import express from "express";
import multer from "multer";
import { validateAccessToken } from "../middleware/auth.tokens";
import {
	getPosts,
	getPost,
	createPost,
	updatePost,
	deletePost,
	likePost,
	dislikePost,
} from "../controllers/post";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/", validateAccessToken, getPosts);
router.get("/:id", validateAccessToken, getPost);
router.post("/", validateAccessToken, upload.array("media", 5), createPost);
router.put("/:id", validateAccessToken, upload.array("media", 5), updatePost);
router.delete("/:id", validateAccessToken, deletePost);
router.post("/like", validateAccessToken, likePost);
router.post("/dislike", validateAccessToken, dislikePost);

export default router;
