import { Response, Request, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.tokens";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getUser(req: AuthenticatedRequest, res: Response) {
	try {
		const userId = parseInt(req.params.id);
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});
		return res.status(200).json(user);
	} catch (error) {
		res.status(404).json({ message: "User not found" });
	}
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
	try {
		const userId = parseInt(req.params.id);
		await prisma.user.delete({
			where: { id: userId },
		});
		return res.status(200).json("user deleted successfully");
	} catch (error) {
		res.status(404).json({ message: "User not found" });
	}
}
