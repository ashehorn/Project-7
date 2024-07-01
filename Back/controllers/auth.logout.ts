import express, { Request, Response } from "express";

export default function logout(req: Request, res: Response) {
	res.clearCookie("accessToken", {
		httpOnly: true,
		sameSite: "strict",
		secure: true,
	});
	res.status(200).send({ message: "Signed out successfully" });
}
