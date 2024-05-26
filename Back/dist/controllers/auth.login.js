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
exports.login = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        try {
            const user = yield prisma.user.findUnique({
                where: { email: email },
                select: { id: true, email: true, password: true },
            });
            if (user && (yield bcrypt_1.default.compare(password, user.password))) {
                const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.SECRET_KEY, { expiresIn: "8hr" });
                console.info("Login successful");
                res.status(200).json({ userId: user.id, accessToken });
            }
            else {
                console.warn("Login failed");
                res.status(401).send("Invalid credentials");
            }
        }
        catch (error) {
            console.error("Database error", error);
            res.status(500).send("Internal server error");
        }
    });
}
exports.login = login;
