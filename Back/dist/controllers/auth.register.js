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
exports.register = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const emailValidation_1 = require("../utils/validators/emailValidation");
const passwordValidator_1 = __importDefault(require("../utils/validators/passwordValidator"));
const passwordHash_1 = __importDefault(require("../utils/passwordHash"));
const auth_tokens_1 = require("../middleware/auth.tokens");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { first_name, last_name, username, email, password } = req.body;
            // Log the request body to verify the values
            console.log("Request body:", req.body);
            // Check if email is defined
            if (!email) {
                return res.status(400).json({ error: "Email is required" });
            }
            let existingUserByEmail;
            try {
                existingUserByEmail = yield prisma.user.findUnique({
                    where: { email },
                });
            }
            catch (error) {
                console.error("Error finding user by email:", error);
                return res.status(500).json({ error: "Server error" });
            }
            let existingUserByUsername;
            try {
                existingUserByUsername = yield prisma.user.findUnique({
                    where: { username },
                });
            }
            catch (error) {
                console.error("Error finding user by username:", error);
                return res.status(500).json({ error: "Server error" });
            }
            if (!(0, emailValidation_1.validateEmail)(email) || !(0, passwordValidator_1.default)(password)) {
                return res
                    .status(400)
                    .json({ message: "Invalid email or password" });
            }
            if (existingUserByEmail) {
                return res
                    .status(400)
                    .json({ error: "User with this email already exists" });
            }
            if (existingUserByUsername) {
                return res
                    .status(400)
                    .json({ error: "User with this username already exists" });
            }
            let passwordHash;
            try {
                passwordHash = yield (0, passwordHash_1.default)(password);
            }
            catch (error) {
                console.error("Error hashing password:", error);
                return res.status(500).json({ error: "Server error" });
            }
            let user;
            if (typeof passwordHash === "string") {
                try {
                    user = yield prisma.user.create({
                        data: {
                            first_name,
                            last_name,
                            username,
                            email,
                            password: passwordHash,
                            profile_img: "defaultProfileImg.jpg",
                            preferences: {},
                        },
                    });
                }
                catch (error) {
                    console.error("Error creating user:", error);
                    return res.status(500).json({ error: "Server error" });
                }
            }
            else {
                console.error("Error hashing password:", passwordHash);
                return res.status(500).json({ error: "Server error" });
            }
            res.status(201).json({
                message: "User created successfully",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
                accessToken: (0, auth_tokens_1.create)(res, user),
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server error" });
        }
    });
}
exports.register = register;
