"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = void 0;
function logout(req, res) {
    res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "strict",
    });
    res.status(200).send({ message: "Signed out successfully" });
}
exports.logout = logout;
