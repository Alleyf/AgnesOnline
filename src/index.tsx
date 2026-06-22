import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { AppContainer, ErrorRender } from "@lark-apaas/client-toolkit-lite";
import { ThemeProvider } from "@/hooks/useTheme";
import App from "./app";
import "./index.css";

const basename = (() => {
  try {
    if (typeof process !== "undefined" && process.env?.CLIENT_BASE_PATH) {
      return process.env.CLIENT_BASE_PATH;
    }
  } catch {
    // ignore
  }
  return import.meta.env.BASE_URL || "/";
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <AppContainer>
        <ThemeProvider>
          <ErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
              <ErrorRender error={error} resetErrorBoundary={resetErrorBoundary} />
            )}
          >
            <App />
          </ErrorBoundary>
        </ThemeProvider>
      </AppContainer>
    </BrowserRouter>
  </StrictMode>,
);
