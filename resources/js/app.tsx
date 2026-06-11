import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { DefaultProviders } from "./components/providers/default.tsx";

const pages = import.meta.glob("./pages/**/*.tsx");

createInertiaApp({
  title: (title) => (title ? `${title} - ScholarOS` : "ScholarOS"),
  resolve: (name) => {
    const importPage = pages[`./pages/${name}.tsx`];
    if (!importPage) {
      throw new Error(`Page not found: ${name}`);
    }
    return importPage();
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <DefaultProviders>
        <App {...props} />
      </DefaultProviders>,
    );
  },
  progress: {
    color: "oklch(0.55 0.13 252)",
  },
});
