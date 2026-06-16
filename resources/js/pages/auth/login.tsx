import { Head, Link, useForm } from "@inertiajs/react";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

type PageProps = {
  school: { name: string; slug: string } | null;
  platformLoginUrl: string;
  centralDomain: string;
};

export default function LoginPage({ school, platformLoginUrl, centralDomain }: PageProps) {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Head title={school ? `${school.name} Sign In` : "School Sign In"} />
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-extrabold">ScholarOS</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{school ? school.name : "School sign in"}</CardTitle>
          <CardDescription>
            {school
              ? `Sign in to ${school.slug}.${centralDomain}`
              : "Sign in with your school account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block" htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                autoComplete="email"
                autoFocus
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
                placeholder="••••••••"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={data.remember}
                onCheckedChange={(checked) => setData("remember", checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
            <Button type="submit" disabled={processing} className="w-full cursor-pointer">
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
            <p>
              Platform administrator?{" "}
              <a href={platformLoginUrl} className="text-primary font-medium hover:underline">
                Platform sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
