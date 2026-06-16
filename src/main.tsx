import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AuthProvider } from "./auth/AuthContext";
import { InAppNotification } from "./features/notifications/InAppNotification";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./styles.css";

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
