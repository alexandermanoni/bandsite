import { Link } from "react-router-dom";
import Login from "../../components/login/Login";

export function LoginPage() {
    return (
        <>
            <h1>Log in</h1>

            <Login />

            <p className="footer">
                Need an account? {" "}
                <Link to="/signup">Sign Up</Link>
            </p>
        </>
    );
}