import passwordValidator from "password-validator";

const passwordSchema = new passwordValidator();

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

export default function validatePassword(password: string) {
	return passwordSchema.validate(password, { list: true });
}
