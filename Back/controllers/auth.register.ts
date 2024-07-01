import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { validateEmail } from "../utils/validators/emailValidation";
import validatePassword from "../utils/validators/passwordValidator";
import { create } from "../middleware/auth.tokens";
import hashPassword from "../utils/passwordHash";
import jwt from "jsonwebtoken";

dotenv.config();
const prisma = new PrismaClient();

interface UserInfo {
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	password: string;
}

async function hash(password: string): Promise<string> {
	try {
		const hashedPassword = await hashPassword(password);
		if (hashedPassword instanceof Error) {
			throw hashedPassword;
		}
		return hashedPassword;
	} catch (error) {
		console.error("Error hashing password:", error);
		throw new Error("Failed to hash password");
	}
}

export async function register(req: Request, res: Response) {
	try {
		const { first_name, last_name, username, email, password } =
			req.body as UserInfo;

		console.log("Request body:", req.body);

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		const existingUserByEmail = await prisma.user.findUnique({
			where: { email },
		});

		const existingUserByUsername = await prisma.user.findUnique({
			where: { username },
		});

		if (!validateEmail(email) || !validatePassword(password)) {
			return res
				.status(400)
				.json({ message: "Invalid email or password" });
		}

		if (existingUserByEmail) {
			return res
				.status(400)
				.json({ error: "User with this email already exists" });
		}

		if (existingUserByUsername) {
			return res
				.status(400)
				.json({ error: "User with this username already exists" });
		}

		const passwordHash = await hash(password);

		const user = await prisma.user.create({
			data: {
				first_name,
				last_name,
				username,
				email,
				password: passwordHash,
				profile_img: "defaultProfileImg.jpg",
				preferences: {},
			},
		});

		create(res, user);

		return res.status(201).json({
			message: "User created successfully",
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Server error" });
	}
}
