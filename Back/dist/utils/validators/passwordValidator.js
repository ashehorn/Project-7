"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const password_validator_1 = __importDefault(require("password-validator"));
const passwordSchema = new password_validator_1.default();
passwordSchema
    .is()
    .min(8)
    .is()
    .max(100)
    .has()
    .uppercase()
    .has()
    .lowercase()
    .has()
    .digits(1)
    .is()
    .not()
    .oneOf(["Password", "Password123"]);
function validatePassword(password) {
    return passwordSchema.validate(password, { list: true });
}
exports.default = validatePassword;
