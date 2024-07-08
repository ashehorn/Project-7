import express, { NextFunction, Response, Request } from "express";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;
const ERROR_MESSAGES = {
	INVALID_TOKEN: "Invalid token",
	INVALID_TOKEN_PAYLOAD: "Invalid token payload",
	TOKEN_EXPIRED: "Token has expired",
	REFRESH_ERROR: "Error refreshing token",
};

// Middleware to validate the access tokenexport interface AuthenticatedRequest extends Request {
export interface AuthenticatedRequest extends Request {
	user?: { id: number; email: string };
}

export const validateAccessToken = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	const token = req.cookies.accessToken;

	if (!token) {
		console.warn("No token provided");
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const decodedToken = jwt.verify(token, SECRET_KEY!) as JwtPayload & {
			id: number;
			email: string;
		};

		if (!decodedToken || !decodedToken.id) {
			console.warn("Invalid token payload");
			return res.status(401).json({ message: "Unauthorized" });
		}

		req.user = { id: decodedToken.id, email: decodedToken.email };
		next();
	} catch (error) {
		console.warn("Invalid token");
		return res.status(401).json({ message: "Unauthorized" });
	}
};

// Function to refresh the access token
export async function refresh(req: Request, res: Response) {
	const oldToken = req.cookies.accessToken;
	const user = (req as any).user;

	if (!oldToken || !user) {
		console.warn(ERROR_MESSAGES.INVALID_TOKEN);
		return res.status(401).json({ message: ERROR_MESSAGES.INVALID_TOKEN });
	}

	try {
		const decodedToken = jwt.decode(oldToken) as JwtPayload;

		if (!isValidTokenPayload(decodedToken)) {
			console.warn(ERROR_MESSAGES.INVALID_TOKEN_PAYLOAD);
			return res.status(422).send(ERROR_MESSAGES.INVALID_TOKEN_PAYLOAD);
		}

		if (isTokenExpired(decodedToken)) {
			console.warn(ERROR_MESSAGES.TOKEN_EXPIRED);
			return res.status(422).send(ERROR_MESSAGES.TOKEN_EXPIRED);
		}

		await create(res, user);
	} catch (error) {
		console.error("Error refreshing token:", error);
		return res.status(500).send(ERROR_MESSAGES.REFRESH_ERROR);
	}
}

// Function to validate token payload
function isValidTokenPayload(decodedToken: JwtPayload): boolean {
	return (
		decodedToken &&
		typeof decodedToken === "object" &&
		"exp" in decodedToken &&
		typeof decodedToken.exp === "number"
	);
}

// Function to check if the token is expired
function isTokenExpired(decodedToken: JwtPayload): boolean {
	const exp = decodedToken.exp;
	if (typeof exp === "number") {
		return Date.now() > exp * 1000;
	}
	return false;
}

// Function to create a new token
export async function create(res: Response, user: any) {
	const accessToken = jwt.sign(
		{ id: user.id, email: user.email },
		SECRET_KEY as Secret,
		{ expiresIn: "7h" }
	);

	return res.cookie("accessToken", accessToken, {
		httpOnly: true,
		sameSite: "strict",
		secure: true,
	});
}
