import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { SettingsFields, type SettingField } from "@/components/settings-fields.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import { Save, User, SlidersHorizontal } from "lucide-react";

type Profile = {
  name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  accountType: "platform" | "tenant";
};

type PageProps = {
  profile: Profile;
  preferences: Record<string, string | number | boolean | null>;
  preferenceFields: SettingField[];
};

function ProfileContent({ profile, preferences: initialPreferences, preferenceFields }: PageProps) {
  const [tab, setTab] = useState("account");
  const [accountForm, setAccountForm] = useState({
    name: profile.name,
    phone: profile.phone ?? "",
    password: "",
    passwordConfirmation: "",
  });
  const [preferences, setPreferences] = useState(initialPreferences);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handleSaveAccount = () => {
    if (accountForm.password && accountForm.password !== accountForm.passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingAccount(true);
    router.put("/dashboard/profile", {
      name: accountForm.name,
      phone: accountForm.phone || undefined,
      password: accountForm.password || undefined,
      password_confirmation: accountForm.passwordConfirmation || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Profile updated");
        setAccountForm((prev) => ({ ...prev, password: "", passwordConfirmation: "" }));
      },
      onError: () => toast.error("Failed to update profile"),
      onFinish: () => setSavingAccount(false),
    });
  };

  const handleSavePreferences = () => {
    setSavingPrefs(true);
    router.put("/dashboard/profile/preferences", { preferences }, {
      preserveScroll: true,
      onSuccess: () => toast.success("Preferences saved"),
      onError: () => toast.error("Failed to save preferences"),
      onFinish: () => setSavingPrefs(false),
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account details and personal preferences.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="account" className="cursor-pointer">
            <User className="h-4 w-4 mr-1.5" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="cursor-pointer">
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Account Details
                {profile.role && (
                  <Badge variant="secondary" className="capitalize text-xs">{profile.role}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Input value={profile.accountType === "platform" ? "Platform Admin" : "School User"} disabled />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-medium">Change Password</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={accountForm.password}
                      onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  <div>
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      value={accountForm.passwordConfirmation}
                      onChange={(e) => setAccountForm({ ...accountForm, passwordConfirmation: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveAccount} disabled={savingAccount} className="cursor-pointer">
                <Save className="h-4 w-4 mr-2" />
                {savingAccount ? "Saving..." : "Save Account"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsFields
                fields={preferenceFields}
                values={preferences}
                onChange={(key, value) => setPreferences((prev) => ({ ...prev, [key]: value }))}
              />
              <Button onClick={handleSavePreferences} disabled={savingPrefs} className="cursor-pointer">
                <Save className="h-4 w-4 mr-2" />
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePage(props: PageProps) {
  return (
    <DashboardLayout>
      <ProfileContent {...props} />
    </DashboardLayout>
  );
}
