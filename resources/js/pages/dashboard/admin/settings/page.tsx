import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { DashboardLayout } from "../../_components/layout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { SettingsFields, type SettingField } from "@/components/settings-fields.tsx";
import { toast } from "sonner";
import { ArrowLeft, Save, Shield } from "lucide-react";

type PageProps = {
  groups: string[];
  groupLabels: Record<string, string>;
  fieldsByGroup: Record<string, SettingField[]>;
  values: Record<string, string | number | boolean | null>;
};

function PlatformSettingsContent({ groups, groupLabels, fieldsByGroup, values: initialValues }: PageProps) {
  const [tab, setTab] = useState(groups[0] ?? "general");
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: string | number | boolean | null) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    router.put("/dashboard/admin/settings", { settings: values }, {
      preserveScroll: true,
      onSuccess: () => toast.success("Platform settings saved"),
      onError: () => toast.error("Failed to save settings"),
      onFinish: () => setSaving(false),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Admin Panel
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Global platform configuration managed by platform administrators.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {groups.map((group) => (
            <TabsTrigger key={group} value={group} className="cursor-pointer capitalize">
              {groupLabels[group] ?? group}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group} value={group} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{groupLabels[group] ?? group}</CardTitle>
              </CardHeader>
              <CardContent>
                <SettingsFields
                  fields={fieldsByGroup[group] ?? []}
                  values={values}
                  onChange={handleChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function PlatformSettingsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <PlatformSettingsContent {...props} />
    </DashboardLayout>
  );
}
