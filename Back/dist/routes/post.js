"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_tokens_1 = require("../middleware/auth.tokens");
const post_1 = require("../controllers/post");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
const router = express_1.default.Router();
router.get("/", auth_tokens_1.validateAccessToken, post_1.getPosts);
router.get("/:id", auth_tokens_1.validateAccessToken, post_1.getPost);
router.post("/", upload.array("media", 5), post_1.createPost);
router.put("/:id", auth_tokens_1.validateAccessToken, upload.array("media", 5), post_1.updatePost);
router.delete("/:id", auth_tokens_1.validateAccessToken, post_1.deletePost);
exports.default = router;
