import validator from "validator";

export function validateEmail(email: string) {
	return validator.isEmail(email);
}
