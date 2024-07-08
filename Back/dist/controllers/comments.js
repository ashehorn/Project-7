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
exports.getMediaUrl = exports.deleteComment = exports.createComment = exports.getComments = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
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
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage }).array("media", 10); // Allow up to 10 files
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = parseInt(req.params.postId);
        const comments = yield prisma.postComments.findMany({
            where: { postId },
            include: { media: true, author: true },
            orderBy: { created_datetime: "desc" },
        });
        const updatedComments = yield Promise.all(comments.map((comment) => __awaiter(void 0, void 0, void 0, function* () {
            const mediaUrls = yield Promise.all(comment.media.map((media) => __awaiter(void 0, void 0, void 0, function* () {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: media.media,
                };
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand(getObjectParams), { expiresIn: 3600 });
                return url;
            })));
            return Object.assign(Object.assign({}, comment), { mediaUrls, content: comment.comment_body });
        })));
        res.status(200).json(updatedComments);
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Server error", error: error });
    }
});
exports.getComments = getComments;
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.error("Multer error:", err);
            return res.status(500).json({ error: "Error uploading media" });
        }
        try {
            const { postId, content, created_by } = req.body;
            const createdBy = parseInt(created_by);
            const postID = parseInt(postId);
            let mediaUrls = [];
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                const files = req.files;
                const uploadPromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
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
            const comment = yield prisma.postComments.create({
                data: {
                    postId: postID,
                    comment_body: content,
                    user_comment_id: createdBy,
                    created_datetime: new Date(),
                    media: mediaUrls.length > 0
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
            const updatedComment = Object.assign(Object.assign({}, comment), { mediaUrls: yield Promise.all(comment.media.map((media) => __awaiter(void 0, void 0, void 0, function* () {
                    const getObjectParams = {
                        Bucket: bucketName,
                        Key: media.media,
                    };
                    return yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand(getObjectParams), {
                        expiresIn: 3600,
                    });
                }))) });
            res.status(201).json(updatedComment);
        }
        catch (error) {
            console.error("Error creating comment:", error);
            res.status(500).json({ message: "Server error", error: error });
        }
    }));
});
exports.createComment = createComment;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentId = parseInt(req.params.id);
    try {
        const comment = yield prisma.postComments.findUnique({
            where: { id: commentId },
            include: { media: true },
        });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.media.length > 0) {
            const deletePromises = comment.media.map((media) => __awaiter(void 0, void 0, void 0, function* () {
                const params = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: media.media,
                };
                yield s3Client.send(new client_s3_1.DeleteObjectCommand(params));
            }));
            yield Promise.all(deletePromises);
        }
        yield prisma.postComments.delete({
            where: { id: commentId },
        });
        res.status(200).json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Server error", error });
    }
});
exports.deleteComment = deleteComment;
const getMediaUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.params;
        const getObjectParams = {
            Bucket: bucketName,
            Key: key,
        };
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand(getObjectParams), {
            expiresIn: 3600,
        });
        res.status(200).json({ url });
    }
    catch (error) {
        console.error("Error fetching media URL:", error);
        res.status(500).json({ message: "Server error", error: error });
    }
});
exports.getMediaUrl = getMediaUrl;
