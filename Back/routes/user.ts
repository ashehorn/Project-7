import express from "express";
import { getUser, deleteUser } from "../controllers/profile";
import { logout } from "../controllers/logout";

const router = express.Router();

router.post("/logout", logout);

router.get("/:id", getUser);

router.delete("/:id", deleteUser);

export default router;
