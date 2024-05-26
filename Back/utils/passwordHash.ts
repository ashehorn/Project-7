import bcrypt from "bcrypt";

export default async function hashPassword(
	password: string
): Promise<string | Error> {
	return new Promise((resolve, reject) => {
		bcrypt.hash(password, 10, (err, hash) => {
			if (err) {
				reject(err);
			} else {
				resolve(hash);
			}
		});
	});
}
