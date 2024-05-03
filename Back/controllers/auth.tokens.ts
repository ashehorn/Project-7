import { Express, Response } from "express";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

const logger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	transports: [new winston.transports.File({ filename: "logfile.log" })],
});

export function refresh(res: Response, oldToken: string) {
	jwt.verify(oldToken, SECRET_KEY as Secret, (error, decodedData) => {
		if (error) {
			logger.error(error);
			return res.status(401).send(error);
		} else {
			const payload = decodedData as JwtPayload;
			if (
				payload &&
				typeof payload !== "string" &&
				"exp" in payload &&
				payload.exp !== undefined
			) {
				const exp = payload.exp;
				if (Date.now() <= exp * 1000) {
					create();
				} else {
					logger.warn("Token has expired");
					return res.status(422).send("Token has expired");
				}
			} else {
				logger.warn("Invalid token data");
				return res.status(422).send("Invalid token data");
			}
		}
	});
}

export function create() {
	// assume authenticated
	// gen access and refresh then return them
}
