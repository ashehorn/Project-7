import { Response, Request } from "express";

import { PrismaClient } from "@prisma/client";

import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";

import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface logginInfo {
	email: string;
	password: string;
}

export async function login(req: Request, res: Response) {
	const { email, password } = req.body as logginInfo;

	try {
		const user = await prisma.user.findUnique({
			where: { email: email },
			select: { id: true, email: true, password: true },
		});

		if (user && (await bcrypt.compare(password, user.password))) {
			const accessToken = jwt.sign(
				{ userId: user.id, email: user.email },
				process.env.SECRET_KEY!,
				{ expiresIn: "8hr" }
			);
			console.info("Login successful");
			res.status(200).json({ userId: user.id, accessToken });
		} else {
			console.warn("Login failed");
			res.status(401).send("Invalid credentials");
		}
	} catch (error) {
		console.error("Database error", error);
		res.status(500).send("Internal server error");
	}
}
