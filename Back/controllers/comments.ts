import { Response, Request } from "express";
import { PrismaClient } from "@prisma/client";
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const prisma = new PrismaClient();

const bucketName = process.env.BUCKET_NAME!;
const bucketRegion = process.env.BUCKET_REGION!;
const accessKey = process.env.BUCKET_ACCESS_KEY!;
const secretAccessKey = process.env.BUCKET_SECRET_KEY!;

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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).array("media", 10); // Allow up to 10 files

export const getComments = async (req: Request, res: Response) => {
	try {
		const postId = parseInt(req.params.postId);
		const comments = await prisma.postComments.findMany({
			where: { postId },
			include: { media: true, author: true },
			orderBy: { created_datetime: "desc" },
		});

		const updatedComments = await Promise.all(
			comments.map(async (comment) => {
				const mediaUrls = await Promise.all(
					comment.media.map(async (media) => {
						const getObjectParams = {
							Bucket: bucketName,
							Key: media.media,
						};
						const url = await getSignedUrl(
							s3Client,
							new GetObjectCommand(getObjectParams),
							{ expiresIn: 3600 }
						);
						return url;
					})
				);
				return { ...comment, mediaUrls, content: comment.comment_body };
			})
		);

		res.status(200).json(updatedComments);
	} catch (error) {
		console.error("Error fetching comments:", error);
		res.status(500).json({ message: "Server error", error: error });
	}
};

export const createComment = async (req: Request, res: Response) => {
	upload(req, res, async (err) => {
		if (err) {
			console.error("Multer error:", err);
			return res.status(500).json({ error: "Error uploading media" });
		}

		try {
			const { postId, content, created_by } = req.body;
			const createdBy = parseInt(created_by);
			const postID = parseInt(postId);
			let mediaUrls: string[] = [];

			if (req.files && Array.isArray(req.files) && req.files.length > 0) {
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

			const comment = await prisma.postComments.create({
				data: {
					postId: postID,
					comment_body: content,
					user_comment_id: createdBy,
					created_datetime: new Date(),
					media:
						mediaUrls.length > 0
							? {
									create: mediaUrls.map((media) => ({
										media,
									})),
							  }
							: undefined,
				},
				include: {
					media: true,
				},
			});

			const updatedComment = {
				...comment,
				mediaUrls: await Promise.all(
					comment.media.map(async (media) => {
						const getObjectParams = {
							Bucket: bucketName,
							Key: media.media,
						};
						return await getSignedUrl(
							s3Client,
							new GetObjectCommand(getObjectParams),
							{
								expiresIn: 3600,
							}
						);
					})
				),
			};

			res.status(201).json(updatedComment);
		} catch (error) {
			console.error("Error creating comment:", error);
			res.status(500).json({ message: "Server error", error: error });
		}
	});
};

export const deleteComment = async (req: Request, res: Response) => {
	const commentId = parseInt(req.params.id);
	try {
		const comment = await prisma.postComments.findUnique({
			where: { id: commentId },
			include: { media: true },
		});

		if (!comment) {
			return res.status(404).json({ message: "Comment not found" });
		}

		if (comment.media.length > 0) {
			const deletePromises = comment.media.map(async (media) => {
				const params = {
					Bucket: process.env.BUCKET_NAME!,
					Key: media.media,
				};
				await s3Client.send(new DeleteObjectCommand(params));
			});
			await Promise.all(deletePromises);
		}
		await prisma.postComments.delete({
			where: { id: commentId },
		});

		res.status(200).json({ message: "Comment deleted successfully" });
	} catch (error) {
		console.error("Error deleting comment:", error);
		res.status(500).json({ message: "Server error", error });
	}
};

export const getMediaUrl = async (req: Request, res: Response) => {
	try {
		const { key } = req.params;
		const getObjectParams = {
			Bucket: bucketName,
			Key: key,
		};
		const url = await getSignedUrl(
			s3Client,
			new GetObjectCommand(getObjectParams),
			{
				expiresIn: 3600,
			}
		);
		res.status(200).json({ url });
	} catch (error) {
		console.error("Error fetching media URL:", error);
		res.status(500).json({ message: "Server error", error: error });
	}
};
