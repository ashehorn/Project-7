"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
require('dotenv').config();
// Auth
const login = require('./routes/auth/login');
const register = require('./routes/auth/register');
// post
const post = require('./routes/post');
// user
const user = require('./routes/user');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use("/api/auth/login", login);
app.use("/api/auth/register", register);
app.use("/api/user", user);
app.use("/api/post", post);
app.listen(PORT, () => {
    console.log(`listening on port: ${PORT}`);
});
