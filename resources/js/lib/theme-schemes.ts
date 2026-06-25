export type ColorSchemeId = "default" | "ocean" | "emerald" | "ruby" | "violet" | "amber";

export type ColorScheme = {
  id: ColorSchemeId;
  label: string;
  swatch: string;
};

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: "default", label: "Scholar Navy", swatch: "bg-[#1e3a5f]" },
  { id: "ocean", label: "Ocean Blue", swatch: "bg-[#0ea5e9]" },
  { id: "emerald", label: "Emerald", swatch: "bg-[#10b981]" },
  { id: "ruby", label: "Ruby", swatch: "bg-[#e11d48]" },
  { id: "violet", label: "Violet", swatch: "bg-[#8b5cf6]" },
  { id: "amber", label: "Amber Gold", swatch: "bg-[#f59e0b]" },
];

export const COLOR_SCHEME_STORAGE_KEY = "scholaros-color-scheme";

export function applyColorScheme(scheme: ColorSchemeId): void {
  document.documentElement.setAttribute("data-color-scheme", scheme);
  localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
}

export function initColorScheme(): void {
  const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY) as ColorSchemeId | null;
  const scheme = stored && COLOR_SCHEMES.some((s) => s.id === stored) ? stored : "default";
  document.documentElement.setAttribute("data-color-scheme", scheme);
}
