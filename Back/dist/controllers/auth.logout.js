"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function logout(req, res) {
    res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
    });
    res.status(200).send({ message: "Signed out successfully" });
}
exports.default = logout;
