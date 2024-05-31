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
exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getPosts = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
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
            const posts = yield prisma.post.findMany();
            res.status(200).json(posts);
        }
        catch (error) {
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
            });
            res.status(200).json(post);
        }
        catch (error) {
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
function updatePost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const postId = parseInt(req.params.id);
            const post = yield prisma.post.update({
                where: { id: postId },
                data: req.body,
            });
            res.status(200).json(post);
        }
        catch (error) {
            res.status(500).json({ message: "Server error", error: error });
        }
    });
}
exports.updatePost = updatePost;
function authenticateAndAuthorize(req, res, next) {
    var _a;
    const postId = parseInt(req.params.id);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
function deletePost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        authenticateAndAuthorize(req, res, () => __awaiter(this, void 0, void 0, function* () {
            try {
                const postId = parseInt(req.params.id);
                const post = yield prisma.post.delete({
                    where: { id: postId },
                });
                res.status(200).json(post);
            }
            catch (error) {
                res.status(500).json({ message: "Server error", error: error });
            }
        }));
    });
}
exports.deletePost = deletePost;
