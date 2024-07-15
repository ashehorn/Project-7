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

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		await prisma.$transaction(async (prisma) => {
			await prisma.commentMedia.deleteMany({
				where: {
					comment: {
						author: {
							id: userId,
						},
					},
				},
			});
			await prisma.postComments.deleteMany({
				where: { user_comment_id: userId },
			});
			await prisma.postMedia.deleteMany({
				where: {
					post: {
						created_by: userId,
					},
				},
			});
			await prisma.post.deleteMany({
				where: { created_by: userId },
			});
			await prisma.userFriend.deleteMany({
				where: { OR: [{ userId: userId }, { friendId: userId }] },
			});

			await prisma.user.delete({
				where: { id: userId },
			});
		});

		return res.status(200).json("User deleted successfully");
	} catch (error) {
		console.error("Error deleting user:", error); // Log the error
		return res.status(500).json({ message: "Internal server error" });
	}
}
