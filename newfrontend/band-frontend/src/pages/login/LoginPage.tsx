import { Link } from "react-router-dom";
import Login from "../../components/login/Login";

export function LoginPage() {
    return (
        <>
            <h1>Login</h1>

            <Login />

            <p>
                Need an account? {" "}
                <Link to="/signup">Sign Up</Link>
            </p>
        </>
    );
}