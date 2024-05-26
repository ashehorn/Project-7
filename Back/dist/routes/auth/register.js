"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_register_1 = require("../../controllers/auth.register");
const router = express_1.default.Router();
router.post("/", auth_register_1.register);
exports.default = router;
