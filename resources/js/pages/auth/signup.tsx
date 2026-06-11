import { Head, Link, useForm } from "@inertiajs/react";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

export default function SignupPage() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/signup");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Head title="Create Account" />
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-extrabold">ScholarOS</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Get started with ScholarOS. A school admin can link your account to a school.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block" htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                autoComplete="name"
                autoFocus
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block" htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block" htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block" htmlFor="password_confirmation">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="Repeat your password"
                value={data.password_confirmation}
                onChange={(e) => setData("password_confirmation", e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={processing} className="w-full cursor-pointer">
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
