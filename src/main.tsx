import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./state/AuthContext";
import { ActiveProjectProvider } from "./state/ActiveProjectContext";
import { queryClient } from "./lib/queryClient";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveProjectProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ActiveProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
