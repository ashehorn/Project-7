"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_logout_1 = __importDefault(require("../../controllers/auth.logout"));
const router = express_1.default.Router();
router.post("/", auth_logout_1.default);
exports.default = router;
