import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";

import winston from "winston";

import dotenv from "dotenv";

import { validateEmail } from "../utils/validators/emailValidation";

import validatePassword from "../utils/validators/passwordValidator";
dotenv.config();
const prisma = new PrismaClient();

const logger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	transports: [new winston.transports.File({ filename: "logfile.log" })],
});

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

		const existingUser = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (!validateEmail(email) || !validatePassword(password)) {
			return res
				.status(400)
				.json({ message: "Invalid email or password" });
		}

		if (existingUser) {
			return res.status(400).json({ error: "User already exists" });
		}

		const user = await prisma.user.create({
			data: {
				first_name,
				last_name,
				username,
				email,
				password,
				profile_img: "defaultProfileImg.jpg",
				preferences: {},
			},
		});

		res.status(201).json({
			message: "Registration successful",
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			},
		});
	} catch (error) {
		logger.error(error);
		res.status(500).json({ error: "Server error" });
	}
}
