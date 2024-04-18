import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

require("dotenv").config();

// Auth
const login = require("./routes/auth/login");
const register = require("./routes/auth/register");
// post
const post = require("./routes/post");
// user
const user = require("./routes/user");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api/auth/login", login);
app.use("/api/auth/register", register);
app.use("/api/user", user);
app.use("/api/post", post);

app.listen(PORT, () => {
	console.log(`listening on port: ${PORT}`);
});
