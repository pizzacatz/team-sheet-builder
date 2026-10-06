import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

// Entry for /ots: the open team sheet only (page 2), without stats.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App mode="ots" />
  </React.StrictMode>
);
