import { Head, Link } from "@inertiajs/react";
import { GraduationCap, Building2, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";

type SchoolOption = {
  id: number;
  name: string;
  slug: string;
  loginUrl: string;
};

type PageProps = {
  schools: SchoolOption[];
  platformLoginUrl: string;
  centralDomain: string;
};

export default function SchoolPortalPage({ schools, platformLoginUrl, centralDomain }: PageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Head title="Choose Your School" />
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-extrabold">ScholarOS</span>
      </Link>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Choose your school</CardTitle>
          <CardDescription>
            Each school has its own sign-in page at <strong>{`{school}.${centralDomain}`}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {schools.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No active schools yet.
            </p>
          ) : (
            schools.map((school) => (
              <a
                key={school.id}
                href={school.loginUrl}
                className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-semibold">{school.name}</p>
                  <p className="text-xs text-muted-foreground">{school.slug}.{centralDomain}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))
          )}

          <div className="pt-4 border-t text-center text-sm text-muted-foreground space-y-3">
            <p>
              Platform administrator?{" "}
              <Link href={platformLoginUrl} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Platform sign in
              </Link>
            </p>
            <Button variant="secondary" asChild className="cursor-pointer">
              <Link href="/register">Register a new school</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
