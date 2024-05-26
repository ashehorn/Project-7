import express from "express";
import { login } from "../../controllers/auth.login";

const router = express.Router();

router.post("/", login);

export default router;
