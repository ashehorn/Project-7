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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getUser = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = parseInt(req.params.id);
            const user = yield prisma.user.findUnique({
                where: { id: userId },
            });
            return res.status(200).json(user);
        }
        catch (error) {
            res.status(404).json({ message: "User not found" });
        }
    });
}
exports.getUser = getUser;
function deleteUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = parseInt(req.params.id);
            const user = yield prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            yield prisma.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.commentMedia.deleteMany({
                    where: {
                        comment: {
                            author: {
                                id: userId,
                            },
                        },
                    },
                });
                yield prisma.postComments.deleteMany({
                    where: { user_comment_id: userId },
                });
                yield prisma.postMedia.deleteMany({
                    where: {
                        post: {
                            created_by: userId,
                        },
                    },
                });
                yield prisma.post.deleteMany({
                    where: { created_by: userId },
                });
                yield prisma.userFriend.deleteMany({
                    where: { OR: [{ userId: userId }, { friendId: userId }] },
                });
                yield prisma.user.delete({
                    where: { id: userId },
                });
            }));
            return res.status(200).json("User deleted successfully");
        }
        catch (error) {
            console.error("Error deleting user:", error); // Log the error
            return res.status(500).json({ message: "Internal server error" });
        }
    });
}
exports.deleteUser = deleteUser;
