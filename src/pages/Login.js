import { useState, useEffect } from "react";
import { useIndexedDB } from "../context/IndexeDBContext";

const Login = (props) => {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const { register, login, checkIfLoggedIn, isLoggedIn } = useIndexedDB();

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (props.firstLogin) {
        register();
      } else {
        login();
      }
    }
  };

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
      await register(password);
      props.setLoggedIn(true);
    } catch (error) {
      console.error("Registration failed:", error);
      setLoginError(true);
    }
  };

  const handleLogin = async () => {
    try {
      console.log(password);
      await login(password);
      props.setLoggedIn(true);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(true);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [password]);

  return (
    <div className="login-container">
      <input
        className="login-container-inner"
        type="password"
        placeholder="password"
        onChange={handlePasswordChange}
      />
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
          ? "Invalid password"
          : "All data is encrypted and stored locally."}
      </p>
    </div>
  );
};

export default Login;
