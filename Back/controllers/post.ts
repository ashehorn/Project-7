import { Response, Request, NextFunction } from "express";

import { PrismaClient } from "@prisma/client";

import multer from "multer";

import {
	S3Client,
	PutObjectCommand,
	ObjectCannedACL,
} from "@aws-sdk/client-s3";

import { v4 as uuidv4 } from "uuid";

import dotenv from "dotenv";

const prisma = new PrismaClient();

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

upload.single("media");

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.BUCKET_ACCESS_KEY;
const secretAccessKey = process.env.BUCKET_SECRET_KEY;

if (!bucketName || !bucketRegion || !accessKey || !secretAccessKey) {
	throw new Error("Missing env vars");
}

const s3Client = new S3Client({
	region: bucketRegion,
	credentials: {
		accessKeyId: accessKey,
		secretAccessKey: secretAccessKey,
	},
});

const randomImageName = () => uuidv4();

export async function getPosts(req: Request, res: Response) {
	try {
		const posts = await prisma.post.findMany();
		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error });
	}
}

export async function getPost(req: Request, res: Response) {
	try {
		const postId = parseInt(req.params.id);
		const post = await prisma.post.findUnique({
			where: { id: postId },
		});
		res.status(200).json(post);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error });
	}
}

export async function createPost(req: Request, res: Response) {
	try {
		const {
			created_by,
			title,
			content,
			likes = [],
			dislikes = [],
			comments = [],
		} = req.body;

		const createdBy = parseInt(created_by);

		if (isNaN(createdBy)) {
			return res
				.status(400)
				.json({ error: "Invalid created_by or author ID" });
		}

		let mediaUrls: string[] = [];

		if (req.files) {
			const files = req.files as Express.Multer.File[];
			const uploadPromises = files.map(async (file) => {
				const imageName = randomImageName();
				const params = {
					Bucket: bucketName,
					Key: imageName,
					Body: file.buffer,
					ContentType: file.mimetype,
				};

				await s3Client.send(new PutObjectCommand(params));
				return imageName;
			});

			mediaUrls = await Promise.all(uploadPromises);
		}

		const post = await prisma.post.create({
			data: {
				created_by: createdBy,
				created_datetime: new Date(),
				post_data: {
					title,
					content,
				},
				likes: {
					connect: likes.map((likeId: number) => ({ id: likeId })),
				},
				dislikes: {
					connect: dislikes.map((dislikeId: number) => ({
						id: dislikeId,
					})),
				},
				comments: {
					create: comments.map((comment: any) => ({
						comment_body: comment.content,
						user_comment_id: comment.created_by,
						created_datetime: new Date(),
					})),
				},
				media: {
					create: mediaUrls.map((media) => ({ media })),
				},
			},
		});

		if (mediaUrls.length > 0) {
			await prisma.postMedia.createMany({
				data: mediaUrls.map((mediaUrl) => ({
					postId: post.id,
					media: mediaUrl,
				})),
			});
		}
		res.status(201).json(post);
	} catch (error) {
		console.error("Error creating post:", error);
		res.status(500).json({
			message: "Server error",
			error: (error as Error).message,
		});
	}
}

export async function updatePost(req: Request, res: Response) {
	try {
		const postId = parseInt(req.params.id);
		const post = await prisma.post.update({
			where: { id: postId },
			data: req.body,
		});
		res.status(200).json(post);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error });
	}
}

function authenticateAndAuthorize(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const postId = parseInt(req.params.id);
	const userId = req.user?.id;

	if (!userId) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	prisma.post
		.findUnique({
			where: { id: postId },
			select: { created_by: true },
		})
		.then((post) => {
			if (!post || post.created_by !== userId) {
				return res.status(403).json({ message: "Forbidden" });
			}
			next();
		})
		.catch((error) => {
			res.status(500).json({ message: "Server error", error: error });
		});
}

export async function deletePost(req: Request, res: Response) {
	authenticateAndAuthorize(req, res, async () => {
		try {
			const postId = parseInt(req.params.id);
			const post = await prisma.post.delete({
				where: { id: postId },
			});
			res.status(200).json(post);
		} catch (error) {
			res.status(500).json({ message: "Server error", error: error });
		}
	});
}
