"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comments_1 = require("../controllers/comments");
const router = express_1.default.Router();
router.get("/:postId", comments_1.getComments);
router.post("/", comments_1.createComment);
router.delete("/:id", comments_1.deleteComment);
router.get("/media-url/:key", comments_1.getMediaUrl);
exports.default = router;
