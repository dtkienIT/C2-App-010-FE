import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AuthProvider } from "./auth/AuthContext";
import { InAppNotification } from "./features/notifications/InAppNotification";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";

const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const [firstArg = ""] = args;
  const message = typeof firstArg === "string" ? firstArg : "";
  if (message.includes("Clock: This module has been deprecated. Please use THREE.Timer instead.")) {
    return;
  }
  originalConsoleWarn(...args);
};

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <InAppNotification />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>,
);
