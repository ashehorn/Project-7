import { Response, Request } from "express";

import { PrismaClient } from "@prisma/client";

import jwt from "jsonwebtoken";

import winston from "winston";

import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const logger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	transports: [new winston.transports.File({ filename: "logfile.log" })],
});

interface logginInfo {
	username: string;
	password: string;
}

export async function login(req: Request, res: Response) {
	const { username, password } = req.body as logginInfo;

	try {
		const user = await prisma.user.findUnique({
			where: { username: username },
		});

		if (user && user.password === password) {
			logger.info("login successful");
			const accessToken = jwt.sign(
				{ userId: user.id, email: user.email },
				process.env.SECRET_KEY!,
				{ expiresIn: "8hr" }
			);
			res.status(200).json({ userId: user.id, accessToken });
		} else {
			logger.warn("Login failed");
			res.status(401).send("Invalid credentials");
		}
	} catch (error) {
		logger.error("Database error", error);
		res.status(500).send("Internal server error");
	}
}
