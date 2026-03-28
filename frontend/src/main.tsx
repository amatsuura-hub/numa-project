import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { useAuthStore } from "./stores/authStore";
import "./index.css";

// Initialize auth state on app startup
useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: "14px" },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
