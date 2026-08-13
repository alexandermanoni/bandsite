import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";


function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const email = (formData.get("emailInput") as string) ?? "";
        const password = (formData.get("passwordInput") as string) ?? "";

        const result = await login(email, password);

        if (result === "badreq") {
            alert("Email is invalid, please try again.");
            return;
        }

        if (result === "serr") {
            alert("There was a server error, please try again.");
            return;
        }

        if (result === "uauth") {
            alert("Incorrect email or password, please try again.");
            return;
        }

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

            <button type="submit">Login</button>
        </form>
    );
}

export default Login;