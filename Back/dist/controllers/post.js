"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dislikePost = exports.likePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getPosts = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma = new client_1.PrismaClient();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
upload.single("media");
dotenv_1.default.config();
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.BUCKET_ACCESS_KEY;
const secretAccessKey = process.env.BUCKET_SECRET_KEY;
if (!bucketName || !bucketRegion || !accessKey || !secretAccessKey) {
    throw new Error("Missing env vars");
}
const s3Client = new client_s3_1.S3Client({
    region: bucketRegion,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
});
const randomImageName = () => (0, uuid_1.v4)();
function getPosts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const posts = yield prisma.post.findMany({
                include: {
                    media: true,
                    likes: true,
                    dislikes: true,
                    user: true,
                },
                orderBy: [{ created_datetime: "desc" }],
            });
            const updatedPosts = yield Promise.all(posts.map((post) => __awaiter(this, void 0, void 0, function* () {
                const mediaUrls = yield Promise.all(post.media.map((media) => __awaiter(this, void 0, void 0, function* () {
                    const getObjectParams = {
                        Bucket: bucketName,
                        Key: media.media,
                    };
                    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand(getObjectParams), { expiresIn: 3600 });
                    return url;
                })));
                return Object.assign(Object.assign({}, post), { mediaUrls, likesCount: post.likes.length, dislikesCount: post.dislikes.length, hasLiked: post.likes.some((user) => { var _a; return user.id === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id); }), hasDisliked: post.dislikes.some((user) => { var _a; return user.id === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id); }), created_by: post.created_by });
            })));
            res.status(200).json(updatedPosts);
        }
        catch (error) {
            console.error("Error fetching posts:", error);
            res.status(500).json({ message: "Server error", error: error });
        }
    });
}
exports.getPosts = getPosts;
function getPost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const postId = parseInt(req.params.id);
            const post = yield prisma.post.findUnique({
                where: { id: postId },
                include: {
                    media: true,
                },
            });
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            const mediaUrls = yield Promise.all(post.media.map((media) => __awaiter(this, void 0, void 0, function* () {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: media.media,
                };
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand(getObjectParams), {
                    expiresIn: 3600,
                });
                return url;
            })));
            const updatedPost = Object.assign(Object.assign({}, post), { mediaUrls });
            res.status(200).json(updatedPost);
        }
        catch (error) {
            console.error("Error fetching post:", error);
            res.status(500).json({ message: "Server error", error: error });
        }
    });
}
exports.getPost = getPost;
function createPost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { created_by, title, content, likes = [], dislikes = [], comments = [], } = req.body;
            const createdBy = parseInt(created_by);
            if (isNaN(createdBy)) {
                return res
                    .status(400)
                    .json({ error: "Invalid created_by or author ID" });
            }
            let mediaUrls = [];
            if (req.files) {
                const files = req.files;
                const uploadPromises = files.map((file) => __awaiter(this, void 0, void 0, function* () {
                    const imageName = randomImageName();
                    const params = {
                        Bucket: bucketName,
                        Key: imageName,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    };
                    yield s3Client.send(new client_s3_1.PutObjectCommand(params));
                    return imageName;
                }));
                mediaUrls = yield Promise.all(uploadPromises);
            }
            const post = yield prisma.post.create({
                data: {
                    created_by: createdBy,
                    created_datetime: new Date(),
                    post_data: {
                        title,
                        content,
                    },
                    likes: {
                        connect: likes.map((likeId) => ({ id: likeId })),
                    },
                    dislikes: {
                        connect: dislikes.map((dislikeId) => ({
                            id: dislikeId,
                        })),
                    },
                    comments: {
                        create: comments.map((comment) => ({
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
                yield prisma.postMedia.createMany({
                    data: mediaUrls.map((mediaUrl) => ({
                        postId: post.id,
                        media: mediaUrl,
                    })),
                });
            }
            res.status(201).json(post);
        }
        catch (error) {
            console.error("Error creating post:", error);
            res.status(500).json({
                message: "Server error",
                error: error.message,
            });
        }
    });
}
exports.createPost = createPost;
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const postId = parseInt(req.params.id);
    try {
        const post = yield prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.created_by !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { title, content } = req.body;
        const updatedPost = yield prisma.post.update({
            where: { id: postId },
            data: {
                post_data: {
                    title,
                    content,
                },
            },
        });
        res.status(200).json(updatedPost);
    }
    catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: "Server error", error });
    }
});
exports.updatePost = updatePost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const postId = parseInt(req.params.id);
    try {
        const post = yield prisma.post.findUnique({
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
        if (post.created_by !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        // Delete media files from S3 for post media
        if (post.media.length > 0) {
            const deletePostMediaPromises = post.media.map((media) => __awaiter(void 0, void 0, void 0, function* () {
                const params = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: media.media,
                };
                yield s3Client.send(new client_s3_1.DeleteObjectCommand(params));
            }));
            yield Promise.all(deletePostMediaPromises);
        }
        // Delete related media files from S3 for comment media
        for (const comment of post.comments) {
            if (comment.media.length > 0) {
                const deleteCommentMediaPromises = comment.media.map((media) => __awaiter(void 0, void 0, void 0, function* () {
                    const params = {
                        Bucket: process.env.BUCKET_NAME,
                        Key: media.media,
                    };
                    yield s3Client.send(new client_s3_1.DeleteObjectCommand(params));
                }));
                yield Promise.all(deleteCommentMediaPromises);
            }
        }
        // Delete related comment media records
        yield prisma.commentMedia.deleteMany({
            where: {
                comment: {
                    postId: postId,
                },
            },
        });
        // Delete related comments
        yield prisma.postComments.deleteMany({
            where: { postId: postId },
        });
        // Delete related post media records
        yield prisma.postMedia.deleteMany({
            where: { postId: postId },
        });
        // Delete the post
        yield prisma.post.delete({
            where: { id: postId },
        });
        res.status(200).json({ message: "Post deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Server error", error });
    }
});
exports.deletePost = deletePost;
const likePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { postId } = req.body;
    const userIdInt = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
    if (!userIdInt) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const postIdInt = parseInt(postId, 10);
        const post = yield prisma.post.findUnique({
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
            yield prisma.post.update({
                where: { id: postIdInt },
                data: {
                    likes: {
                        disconnect: { id: userIdInt },
                    },
                },
            });
        }
        else {
            // Add the like and remove dislike if it exists
            yield prisma.post.update({
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
    }
    catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ message: "Server error", error: error });
    }
});
exports.likePost = likePost;
const dislikePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const { postId } = req.body;
    const userIdInt = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
    if (!userIdInt) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const postIdInt = parseInt(postId, 10);
        const post = yield prisma.post.findUnique({
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
            yield prisma.post.update({
                where: { id: postIdInt },
                data: {
                    dislikes: {
                        disconnect: { id: userIdInt },
                    },
                },
            });
        }
        else {
            // Add the dislike and remove like if it exists
            yield prisma.post.update({
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
    }
    catch (error) {
        console.error("Error disliking post:", error);
        res.status(500).json({ message: "Server error", error: error });
    }
});
exports.dislikePost = dislikePost;
