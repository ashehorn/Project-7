import { Response, Request, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.tokens";

import { PrismaClient } from "@prisma/client";

import multer from "multer";

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
		const posts = await prisma.post.findMany({
			include: {
				media: true,
				likes: true,
				dislikes: true,
				user: true,
			},
			orderBy: [{ created_datetime: "desc" }],
		});

		const updatedPosts = await Promise.all(
			posts.map(async (post) => {
				const mediaUrls = await Promise.all(
					post.media.map(async (media) => {
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
				return {
					...post,
					mediaUrls,
					likesCount: post.likes.length,
					dislikesCount: post.dislikes.length,
					hasLiked: post.likes.some(
						(user) => user.id === req.user?.id
					),
					hasDisliked: post.dislikes.some(
						(user) => user.id === req.user?.id
					),
					created_by: post.created_by,
				};
			})
		);
		res.status(200).json(updatedPosts);
	} catch (error) {
		console.error("Error fetching posts:", error);
		res.status(500).json({ message: "Server error", error: error });
	}
}

export async function getPost(req: Request, res: Response) {
	try {
		const postId = parseInt(req.params.id);
		const post = await prisma.post.findUnique({
			where: { id: postId },
			include: {
				media: true,
			},
		});

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		const mediaUrls = await Promise.all(
			post.media.map(async (media) => {
				const getObjectParams = {
					Bucket: bucketName,
					Key: media.media,
				};
				const url = await getSignedUrl(
					s3Client,
					new GetObjectCommand(getObjectParams),
					{
						expiresIn: 3600,
					}
				);
				return url;
			})
		);

		const updatedPost = { ...post, mediaUrls };

		res.status(200).json(updatedPost);
	} catch (error) {
		console.error("Error fetching post:", error);
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

export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
	const postId = parseInt(req.params.id);
	try {
		const post = await prisma.post.findUnique({
			where: { id: postId },
		});

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		if (post.created_by !== req.user?.id) {
			return res.status(403).json({ message: "Forbidden" });
		}

		const { title, content } = req.body;

		const updatedPost = await prisma.post.update({
			where: { id: postId },
			data: {
				post_data: {
					title,
					content,
				},
			},
		});

		res.status(200).json(updatedPost);
	} catch (error) {
		console.error("Error updating post:", error);
		res.status(500).json({ message: "Server error", error });
	}
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
	const postId = parseInt(req.params.id);
	try {
		const post = await prisma.post.findUnique({
			where: { id: postId },
			include: {
				media: true,
				comments: {
					include: {
						media: true,
					},
				},
			},
		});

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		if (post.created_by !== req.user?.id) {
			return res.status(403).json({ message: "Forbidden" });
		}

		// Delete media files from S3 for post media
		if (post.media.length > 0) {
			const deletePostMediaPromises = post.media.map(async (media) => {
				const params = {
					Bucket: process.env.BUCKET_NAME!,
					Key: media.media,
				};
				await s3Client.send(new DeleteObjectCommand(params));
			});
			await Promise.all(deletePostMediaPromises);
		}

		// Delete related media files from S3 for comment media
		for (const comment of post.comments) {
			if (comment.media.length > 0) {
				const deleteCommentMediaPromises = comment.media.map(
					async (media) => {
						const params = {
							Bucket: process.env.BUCKET_NAME!,
							Key: media.media,
						};
						await s3Client.send(new DeleteObjectCommand(params));
					}
				);
				await Promise.all(deleteCommentMediaPromises);
			}
		}

		// Delete related comment media records
		await prisma.commentMedia.deleteMany({
			where: {
				comment: {
					postId: postId,
				},
			},
		});

		// Delete related comments
		await prisma.postComments.deleteMany({
			where: { postId: postId },
		});

		// Delete related post media records
		await prisma.postMedia.deleteMany({
			where: { postId: postId },
		});

		// Delete the post
		await prisma.post.delete({
			where: { id: postId },
		});

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.error("Error deleting post:", error);
		res.status(500).json({ message: "Server error", error });
	}
};

export const likePost = async (req: AuthenticatedRequest, res: Response) => {
	const { postId } = req.body;
	const userIdInt = req.user?.id;

	if (!userIdInt) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const postIdInt = parseInt(postId, 10);

		const post = await prisma.post.findUnique({
			where: { id: postIdInt },
			include: { likes: true, dislikes: true },
		});

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		const hasLiked = post.likes.some((user) => user.id === userIdInt);
		const hasDisliked = post.dislikes.some((user) => user.id === userIdInt);

		if (hasLiked) {
			// Remove the like if it already exists
			await prisma.post.update({
				where: { id: postIdInt },
				data: {
					likes: {
						disconnect: { id: userIdInt },
					},
				},
			});
		} else {
			// Add the like and remove dislike if it exists
			await prisma.post.update({
				where: { id: postIdInt },
				data: {
					likes: {
						connect: { id: userIdInt },
					},
					dislikes: hasDisliked
						? { disconnect: { id: userIdInt } }
						: undefined,
				},
			});
		}

		res.status(200).json({ message: "Post liked successfully" });
	} catch (error) {
		console.error("Error liking post:", error);
		res.status(500).json({ message: "Server error", error: error });
	}
};

export const dislikePost = async (req: AuthenticatedRequest, res: Response) => {
	const { postId } = req.body;
	const userIdInt = req.user?.id;

	if (!userIdInt) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const postIdInt = parseInt(postId, 10);

		const post = await prisma.post.findUnique({
			where: { id: postIdInt },
			include: { likes: true, dislikes: true },
		});

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		const hasLiked = post.likes.some((user) => user.id === userIdInt);
		const hasDisliked = post.dislikes.some((user) => user.id === userIdInt);

		if (hasDisliked) {
			// Remove the dislike if it already exists
			await prisma.post.update({
				where: { id: postIdInt },
				data: {
					dislikes: {
						disconnect: { id: userIdInt },
					},
				},
			});
		} else {
			// Add the dislike and remove like if it exists
			await prisma.post.update({
				where: { id: postIdInt },
				data: {
					dislikes: {
						connect: { id: userIdInt },
					},
					likes: hasLiked
						? { disconnect: { id: userIdInt } }
						: undefined,
				},
			});
		}

		res.status(200).json({ message: "Post disliked successfully" });
	} catch (error) {
		console.error("Error disliking post:", error);
		res.status(500).json({ message: "Server error", error: error });
	}
};
