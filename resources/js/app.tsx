import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { DefaultProviders } from "./components/providers/default.tsx";

const pages = import.meta.glob(
  ["./pages/**/*.tsx", "!./pages/**/_components/**"],
  { eager: true },
);

createInertiaApp({
  title: (title) => (title ? `${title} - ScholarOS` : "ScholarOS"),
  resolve: (name) =>
    resolvePageComponent(
      `./pages/${name}.tsx`,
      pages as Record<string, () => Promise<unknown>>,
    ),
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
