import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";

export type SettingField = {
  key: string;
  label: string;
  type: string;
  description?: string | null;
  options?: string[] | null;
  value: string | number | boolean | null;
};

type SettingsFieldsProps = {
  fields: SettingField[];
  values: Record<string, string | number | boolean | null>;
  onChange: (key: string, value: string | number | boolean | null) => void;
};

export function SettingsFields({ fields, values, onChange }: SettingsFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.key} className={field.type === "boolean" ? "md:col-span-2" : ""}>
          {field.type === "boolean" ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.description && (
                  <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                )}
              </div>
              <Switch
                id={field.key}
                checked={Boolean(values[field.key])}
                onCheckedChange={(checked) => onChange(field.key, checked)}
              />
            </div>
          ) : field.type === "select" ? (
            <div className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
              <Select
                value={String(values[field.key] ?? "")}
                onValueChange={(v) => onChange(field.key, v)}
              >
                <SelectTrigger id={field.key}>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
              <Input
                id={field.key}
                type={field.type === "number" ? "number" : "text"}
                value={values[field.key] ?? ""}
                onChange={(e) => onChange(
                  field.key,
                  field.type === "number"
                    ? (e.target.value === "" ? null : Number(e.target.value))
                    : e.target.value,
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
