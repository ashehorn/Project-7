"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_login_1 = require("../../controllers/auth.login");
const router = express_1.default.Router();
router.post("/", auth_login_1.login);
exports.default = router;
