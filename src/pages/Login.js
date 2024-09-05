const Login = (props) => {
  return (
    <div className="login-container">
      <input
        className="login-container-inner"
        type="password"
        placeholder="password"
      />
      <button className="login-button">
        {props.firstLogin ? "register" : "login"}
      </button>
      <p className="login-text">All data is encrypted and stored locally.</p>
    </div>
  );
};

export default Login;
