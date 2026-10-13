// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App";

// The <noscript> block in index.html carries the site description for crawlers that
// do not execute JavaScript. Once React is running that block is dead weight, so drop it.
//
// It must be removed by querying <noscript> directly: when scripting is enabled the HTML
// parser treats the content of <noscript> as raw text, so document.getElementById
// cannot see #seo-fallback from inside it.
for (const el of document.querySelectorAll("noscript")) el.remove();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);