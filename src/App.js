import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";

function App() {
  return (
    <div className="App">
      <p className="logo-text">BUN</p>
      <Login firstLogin={false} />
    </div>
  );
}

export default App;
