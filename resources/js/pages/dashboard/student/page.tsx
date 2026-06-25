import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { StudentDashboard, type StudentDashboardData } from "../_components/student-dashboard.tsx";
import { GraduationCap } from "lucide-react";
import type { School } from "@/lib/types.ts";

type PageProps = {
  school: School | null;
  linked: boolean;
  studentDashboard: StudentDashboardData | null;
};

function UnlinkedPrompt() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="max-w-md text-center space-y-4">
        <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Account not linked</h2>
        <p className="text-muted-foreground text-sm">
          Your student account is not linked to a student record yet. Contact your school administrator.
        </p>
      </div>
    </div>
  );
}

function StudentPageInner({ school, linked, studentDashboard }: PageProps) {
  const { user } = useCurrentSchool();

  if (!linked || !studentDashboard || !user) {
    return <UnlinkedPrompt />;
  }

  return <StudentDashboard user={user} school={school} data={studentDashboard} />;
}

export default function StudentDashboardPage(props: PageProps) {
  return (
    <DashboardLayout>
      <StudentPageInner {...props} />
    </DashboardLayout>
  );
}
