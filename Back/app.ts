import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import login from "./routes/auth/login";
import register from "./routes/auth/register";
import post from "./routes/post";
import user from "./routes/user";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
const corsOptions = {
	origin: "http://localhost:5173",
	credentials: true,
	methods: "GET,POST,PUT,DELETE",
	allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api/auth/login", login);
app.use("/api/auth/register", register);
app.use("/api/user", user);
app.use("/api/post", post);

app.listen(PORT, () => {
	console.log(`listening on port: ${PORT}`);
});
