"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profile_1 = require("../controllers/profile");
const logout_1 = require("../controllers/logout");
const router = express_1.default.Router();
router.post("/logout", logout_1.logout);
router.get("/:id", profile_1.getUser);
router.delete("/:id", profile_1.deleteUser);
exports.default = router;
