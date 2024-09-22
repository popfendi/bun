import { useState, useEffect } from "react";
import { useIndexedDB } from "../context/IndexeDBContext";

const Login = (props) => {
  const [loginError, setLoginError] = useState(false);
  const { register, login, checkIfLoggedIn, isLoggedIn } = useIndexedDB();

  useEffect(() => {
    if (!props.firstLogin) {
      checkIfLoggedIn();
    }
  }, [props.firstLogin, checkIfLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      props.setLoggedIn(true);
    }
  }, [isLoggedIn, props.setLoggedIn]);

  const handleRegister = async () => {
    try {
      await register();
      props.setLoggedIn(true);
    } catch (error) {
      console.error("Registration failed:", error);
      setLoginError(true);
    }
  };

  const handleLogin = async () => {
    try {
      await login();
      props.setLoggedIn(true);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(true);
    }
  };

  return (
    <div className="login-container">
      <button
        onClick={props.firstLogin ? handleRegister : handleLogin}
        className="login-button"
      >
        {props.firstLogin ? "register" : "login"}
      </button>
      <p
        className="login-text"
        style={{
          color: loginError ? "var(--color-red)" : "var(--color-dark-blue)",
        }}
      >
        {loginError
          ? "Login failed"
          : "All data is encrypted and stored locally."}
      </p>
    </div>
  );
};

export default Login;
