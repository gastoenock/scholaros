import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { TeacherDashboard, type TeacherDashboardData } from "../_components/teacher-dashboard.tsx";
import { GraduationCap } from "lucide-react";
import type { School } from "@/lib/types.ts";

type PageProps = {
  school: School | null;
  linked: boolean;
  teacherDashboard: TeacherDashboardData | null;
};

function UnlinkedPrompt() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="max-w-md text-center space-y-4">
        <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Account not linked</h2>
        <p className="text-muted-foreground text-sm">
          Your teacher account is not linked to a staff record yet. Contact your school administrator.
        </p>
      </div>
    </div>
  );
}

function TeacherPageInner({ school, linked, teacherDashboard }: PageProps) {
  const { user } = useCurrentSchool();

  if (!linked || !teacherDashboard || !user) {
    return <UnlinkedPrompt />;
  }

  return <TeacherDashboard user={user} school={school} data={teacherDashboard} />;
}

export default function TeacherDashboardPage(props: PageProps) {
  return (
    <DashboardLayout>
      <TeacherPageInner {...props} />
    </DashboardLayout>
  );
}
