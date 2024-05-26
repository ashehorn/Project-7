import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { validateEmail } from "../utils/validators/emailValidation";
import validatePassword from "../utils/validators/passwordValidator";
import hashPassword from "../utils/passwordHash";
import { create } from "../middleware/auth.tokens";

dotenv.config();
const prisma = new PrismaClient();

interface UserInfo {
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	password: string;
}

export async function register(req: Request, res: Response) {
	try {
		const { first_name, last_name, username, email, password } =
			req.body as UserInfo;

		// Log the request body to verify the values
		console.log("Request body:", req.body);

		// Check if email is defined
		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		let existingUserByEmail;
		try {
			existingUserByEmail = await prisma.user.findUnique({
				where: { email },
			});
		} catch (error) {
			console.error("Error finding user by email:", error);
			return res.status(500).json({ error: "Server error" });
		}

		let existingUserByUsername;
		try {
			existingUserByUsername = await prisma.user.findUnique({
				where: { username },
			});
		} catch (error) {
			console.error("Error finding user by username:", error);
			return res.status(500).json({ error: "Server error" });
		}

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

		let passwordHash;
		try {
			passwordHash = await hashPassword(password);
		} catch (error) {
			console.error("Error hashing password:", error);
			return res.status(500).json({ error: "Server error" });
		}

		let user;
		if (typeof passwordHash === "string") {
			try {
				user = await prisma.user.create({
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
			} catch (error) {
				console.error("Error creating user:", error);
				return res.status(500).json({ error: "Server error" });
			}
		} else {
			console.error("Error hashing password:", passwordHash);
			return res.status(500).json({ error: "Server error" });
		}

		res.status(201).json({
			message: "User created successfully",
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			},
			// Do I need to issue access token on registration?
			accessToken: create(res, user),
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Server error" });
	}
}
