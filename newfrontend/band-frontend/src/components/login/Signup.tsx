import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";


function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const email = (formData.get("emailInput") as string) ?? "";
        const password = (formData.get("passwordInput") as string) ?? "";
        const verifyPassword = (formData.get("verifyPasswordInput") as string) ?? "";

        // check everything
        if (email === "") {
            alert("Email is empty!");
            return;
        }

        if (password === "") {
            alert("Password is empty!");
            return;
        }

        if (verifyPassword === "") {
            alert("Password check is empty!");
            return;
        }

        if (password !== verifyPassword) {
            alert("Passwords do not match!");
            return;
        }

        const result = await signup(email, password, verifyPassword);

        if (result === "serr") {
            alert("There was a server error, please try again.");
            return;
        }

        if (result === "etaken") {
            alert("That email address is already in use, please try another.");
            return;
        }

        if (result === "badreq") {
            alert("Email is invalid or passwords do not match, please try again.");
            return;
        }

        if (result === "uauth") {
            alert("Invalid password, please try again.");
            return;
        }

        //console.log("result: ", result);

        navigate("/home");
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Email: <input name="emailInput" type="email" />
            </label> {" "}
            <label>
                Password: <input name="passwordInput" type="password" />
            </label> {" "}
            <label>
                Confirm Password: <input name="verifyPasswordInput" type="password" />
            </label>

            <button type="submit">Signup</button>
        </form>
    );
}

export default Signup;