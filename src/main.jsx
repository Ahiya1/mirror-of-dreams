import React from "react";
import ReactDOM from "react-dom/client";
import MirrorApp from "./components/mirror/MirrorApp";
import "./styles/mirror.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MirrorApp />
  </React.StrictMode>
);
