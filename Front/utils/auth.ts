import axios from "axios";

export const signOut = async () => {
	try {
		await axios.post(
			"http://localhost:3000/api/signout",
			{},
			{ withCredentials: true }
		);
		window.location.href = "/login";
	} catch (error) {
		console.error("Error signing out:", error);
	}
};
