import { Response, Request } from "express";
import { PrismaClient } from "@prisma/client";
import { create } from "../middleware/auth.tokens";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface LoginInfo {
	email: string;
	password: string;
}

export async function login(req: Request, res: Response) {
	const { email, password } = req.body as LoginInfo;

	try {
		const user = await prisma.user.findUnique({
			where: { email: email },
			select: { id: true, email: true, password: true },
		});

		if (user && (await bcrypt.compare(password, user.password))) {
			console.info("Login successful");
			await create(res, user);

			res.status(200).json({ userId: user.id });
		} else {
			console.warn("Login failed");
			res.status(401).send("Invalid credentials");
		}
	} catch (error) {
		console.error("Database error", error);
		res.status(500).send("Internal server error");
	}
}
