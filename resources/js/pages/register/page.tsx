import { useState } from "react";
import { router } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { GraduationCap, CheckCircle, ArrowLeft, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

const schema = z.object({
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  adminName: z.string().min(2, "Your name must be at least 2 characters"),
  adminEmail: z.string().email("Please enter a valid email"),
  adminPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterSchool() {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { city: "Philadelphia", state: "PA" },
  });

  const onSubmit = (data: FormData) =>
    new Promise<void>((resolve) => {
      router.post("/register", data, {
        preserveScroll: true,
        onSuccess: () => setSubmitted(true),
        onError: (errs) => {
          const message = Object.values(errs)[0];
          toast.error(message ?? "Failed to submit application. Please try again.");
        },
        onFinish: () => resolve(),
      });
    });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold">Application Submitted!</h1>
          <p className="text-muted-foreground text-lg">
            Your school registration application has been submitted. Our team will review it and get back to you within 24–48 hours.
          </p>
          <Button onClick={() => router.visit("/")} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Header */}
      <header className="bg-[oklch(0.18_0.05_255)] border-b border-white/10 px-6 h-16 flex items-center">
        <button onClick={() => router.visit("/")} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.75_0.15_80)] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-[oklch(0.15_0.02_240)]" />
          </div>
          <span className="text-lg font-extrabold text-white">ScholarOS</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold mb-2">Register Your School</h1>
            <p className="text-muted-foreground">
              Join Philadelphia's leading private school management platform. Complete the form below and our team will set up your account.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                School & Administrator Details
              </CardTitle>
              <CardDescription>This information will be used to set up your school account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* School Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">School Information</h3>
                  <div>
                    <Label htmlFor="schoolName" className="flex items-center gap-1.5 mb-1.5">
                      <Building2 className="h-3.5 w-3.5" /> School Name *
                    </Label>
                    <Input id="schoolName" placeholder="e.g. Germantown Academy" {...register("schoolName")} />
                    {errors.schoolName && <p className="text-destructive text-xs mt-1">{errors.schoolName.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address" className="flex items-center gap-1.5 mb-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Street Address
                      </Label>
                      <Input id="address" placeholder="123 School Street" {...register("address")} />
                    </div>
                    <div>
                      <Label htmlFor="city" className="mb-1.5 block">City</Label>
                      <Input id="city" placeholder="Philadelphia" {...register("city")} />
                    </div>
                    <div>
                      <Label htmlFor="state" className="mb-1.5 block">State</Label>
                      <Input id="state" placeholder="PA" {...register("state")} />
                    </div>
                    <div>
                      <Label htmlFor="zip" className="mb-1.5 block">ZIP Code</Label>
                      <Input id="zip" placeholder="19103" {...register("zip")} />
                    </div>
                  </div>
                </div>

                {/* Admin Info */}
                <div className="space-y-4 pt-2 border-t">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Administrator Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminName" className="flex items-center gap-1.5 mb-1.5">
                        <User className="h-3.5 w-3.5" /> Full Name *
                      </Label>
                      <Input id="adminName" placeholder="John Smith" {...register("adminName")} />
                      {errors.adminName && <p className="text-destructive text-xs mt-1">{errors.adminName.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="adminEmail" className="flex items-center gap-1.5 mb-1.5">
                        <Mail className="h-3.5 w-3.5" /> Email Address *
                      </Label>
                      <Input id="adminEmail" type="email" placeholder="admin@school.edu" {...register("adminEmail")} />
                      {errors.adminEmail && <p className="text-destructive text-xs mt-1">{errors.adminEmail.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="adminPhone" className="flex items-center gap-1.5 mb-1.5">
                        <Phone className="h-3.5 w-3.5" /> Phone Number
                      </Label>
                      <Input id="adminPhone" placeholder="(215) 555-0100" {...register("adminPhone")} />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 cursor-pointer" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
