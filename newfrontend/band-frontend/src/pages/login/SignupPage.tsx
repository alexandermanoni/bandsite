import { Link } from "react-router-dom";
import Signup from "../../components/login/Signup";

export function SignUpPage() {
    return (
        <>
            <h1>Sign Up</h1>

            <Signup />

            <p>
                Already have an account? {" "}
                <Link to="/login">Login</Link>
            </p>
        </>
    );
}