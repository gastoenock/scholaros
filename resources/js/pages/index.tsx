import { motion } from "motion/react";
import { Link, router } from "@inertiajs/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useUser } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  GraduationCap,
  Shield,
  Users,
  BarChart3,
  Bus,
  BookOpen,
  Bell,
  CreditCard,
  ChevronRight,
  Building2,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Student Information System",
    description: "Centralized records for students, staff, and parents with digital admissions.",
  },
  {
    icon: Bell,
    title: "Smart Attendance",
    description: "Real-time tracking with instant parent notifications via SMS & email.",
  },
  {
    icon: BookOpen,
    title: "Academics & Exams",
    description: "Digital grading, report cards, timetables, and performance analytics.",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    description: "Online payments, auto-receipts, and real-time financial reporting.",
  },
  {
    icon: Bus,
    title: "Transport & GPS",
    description: "Route management, driver tracking, and real-time vehicle monitoring.",
  },
  {
    icon: Building2,
    title: "Multi-Campus",
    description: "Manage multiple school branches from a single unified dashboard.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure access for Admins, Teachers, Students, and Parents.",
  },
  {
    icon: BarChart3,
    title: "AI Analytics",
    description: "Data-driven insights on performance, attendance trends, and growth.",
  },
];

const stats = [
  { label: "Private Schools", value: "200+" },
  { label: "Students Managed", value: "50K+" },
  { label: "Philadelphia Area", value: "#1" },
  { label: "Uptime", value: "99.9%" },
];

function HeroSection() {
  const user = useUser();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1643059914047-356aa03efd25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.18_0.05_255/0.95)] via-[oklch(0.18_0.05_255/0.80)] to-[oklch(0.18_0.05_255/0.40)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[oklch(0.75_0.15_80/0.5)] bg-[oklch(0.75_0.15_80/0.1)] mb-8"
          >
            <GraduationCap className="h-4 w-4 text-[oklch(0.75_0.15_80)]" />
            <span className="text-sm font-semibold text-[oklch(0.75_0.15_80)] tracking-wide uppercase">
              Philadelphia Private Schools
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold text-white leading-tight text-balance mb-6"
          >
            The Modern School
            <span className="block text-[oklch(0.75_0.15_80)]">OS for Philadelphia</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-xl text-white/75 max-w-xl mb-10 leading-relaxed"
          >
            A comprehensive School Management Platform built for Philadelphia private schools.
            Manage admissions, attendance, academics, finance, transport, and more — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            {!user ? (
              <SignInButton className="h-12 px-8 text-base font-semibold bg-[oklch(0.75_0.15_80)] text-[oklch(0.15_0.02_240)] hover:bg-[oklch(0.70_0.15_80)] border-0 rounded-lg" />
            ) : (
              <Button
                onClick={() => router.visit("/dashboard")}
                className="h-12 px-8 text-base font-semibold bg-[oklch(0.75_0.15_80)] text-[oklch(0.15_0.02_240)] hover:bg-[oklch(0.70_0.15_80)] rounded-lg cursor-pointer"
              >
                Go to Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              className="h-12 px-8 text-base font-semibold text-white border border-white/30 hover:bg-white/10 rounded-lg cursor-pointer"
              onClick={() => router.visit("/register")}
            >
              Register Your School
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-[oklch(0.75_0.15_80)]">{s.value}</div>
              <div className="text-sm text-white/60 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-extrabold mb-4">Everything Your School Needs</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From admissions to graduation — one platform to manage every aspect of your school's operations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              viewport={{ once: true }}
              className="group p-6 rounded-xl border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  const roles = [
    {
      role: "Administrator",
      color: "from-blue-600 to-blue-800",
      items: ["Manage all students & staff", "Multi-campus oversight", "Financial reporting", "System configuration"],
    },
    {
      role: "Teacher",
      color: "from-emerald-600 to-emerald-800",
      items: ["Mark attendance", "Upload assignments", "Grade students", "Timetable access"],
    },
    {
      role: "Student",
      color: "from-purple-600 to-purple-800",
      items: ["View schedule & grades", "Access assignments", "Library catalog", "Fee status"],
    },
    {
      role: "Parent",
      color: "from-amber-600 to-amber-800",
      items: ["Real-time attendance alerts", "Fee payments", "Teacher meetings", "Child's progress"],
    },
  ];

  return (
    <section className="py-24 bg-muted/40">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-extrabold mb-4">Built for Every Role</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Tailored experiences for every member of your school community.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden border shadow-sm"
            >
              <div className={`bg-gradient-to-br ${r.color} p-6 text-white`}>
                <h3 className="text-xl font-bold">{r.role}</h3>
              </div>
              <div className="bg-card p-5 space-y-3">
                {r.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const user = useUser();
  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-extrabold mb-4">Ready to Transform Your School?</h2>
          <p className="text-lg opacity-80 mb-8">
            Join Philadelphia's leading private schools already using ScholarOS to simplify their operations.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => router.visit("/register")}
              className="h-12 px-8 text-base font-semibold bg-[oklch(0.75_0.15_80)] text-[oklch(0.15_0.02_240)] hover:bg-[oklch(0.70_0.15_80)] border-0 cursor-pointer"
            >
              Register Your School
            </Button>
            {!user && (
              <SignInButton className="h-12 px-8 text-base font-semibold bg-transparent border border-white/40 hover:bg-white/10 text-white" />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Navbar() {
  const user = useUser();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[oklch(0.18_0.05_255/0.95)] backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.visit("/")}
        >
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.75_0.15_80)] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-[oklch(0.15_0.02_240)]" />
          </div>
          <span className="text-lg font-extrabold text-white">ScholarOS</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-white/70 hover:text-white transition-colors">Home</Link>
          <Link href="/register" className="text-sm text-white/70 hover:text-white transition-colors">Register</Link>
          {user ? (
            <Button
              onClick={() => router.visit("/dashboard")}
              size="sm"
              className="bg-[oklch(0.75_0.15_80)] text-[oklch(0.15_0.02_240)] hover:bg-[oklch(0.70_0.15_80)] cursor-pointer"
            >
              Dashboard
            </Button>
          ) : (
            <SignInButton className="h-9 px-4 text-sm bg-[oklch(0.75_0.15_80)] text-[oklch(0.15_0.02_240)] hover:bg-[oklch(0.70_0.15_80)] border-0" />
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[oklch(0.12_0.03_255)] text-white/60 py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.75_0.15_80)] flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-[oklch(0.15_0.02_240)]" />
            </div>
            <span className="text-base font-bold text-white">ScholarOS</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} ScholarOS. All rights reserved. Philadelphia, PA.</p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <RolesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
