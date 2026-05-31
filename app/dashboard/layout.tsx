import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-background font-sans text-fp-ink">
      <DashboardHeader />
      {children}
    </section>
  );
}
