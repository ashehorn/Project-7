import { Response, Request } from "express";

export function logout(req: Request, res: Response) {
	res.clearCookie("accessToken", {
		httpOnly: true,
		sameSite: "strict",
	});
	res.status(200).send({ message: "Signed out successfully" });
}
