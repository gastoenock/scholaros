import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import {
  applyColorScheme,
  COLOR_SCHEMES,
  initColorScheme,
  type ColorSchemeId,
} from "@/lib/theme-schemes.ts";

export function ThemeCustomizer() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [scheme, setScheme] = useState<ColorSchemeId>("default");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    initColorScheme();
    const stored = document.documentElement.getAttribute("data-color-scheme") as ColorSchemeId | null;
    if (stored) setScheme(stored);
  }, []);

  const pickScheme = (id: ColorSchemeId) => {
    setScheme(id);
    applyColorScheme(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 cursor-pointer rounded-lg" title="Theme settings">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <p className="text-sm font-semibold mb-3">Appearance</p>

        <p className="text-xs text-muted-foreground mb-2">Mode</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Palette },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setTheme(mode.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors",
                theme === mode.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/50",
              )}
            >
              <mode.icon className="h-4 w-4" />
              {mode.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-2">Color scheme</p>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_SCHEMES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pickScheme(s.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-lg border p-2 text-[11px] cursor-pointer transition-colors",
                scheme === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <span className={cn("h-6 w-6 rounded-full ring-2 ring-background shadow-sm", s.swatch)} />
              {s.label}
              {scheme === s.id && (
                <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
              )}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3">
          Current: {resolvedTheme === "dark" ? "Dark" : "Light"} · {COLOR_SCHEMES.find((s) => s.id === scheme)?.label}
        </p>
      </PopoverContent>
    </Popover>
  );
}
