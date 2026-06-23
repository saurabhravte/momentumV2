import { FloatingNav } from "@/components/marketing/floating-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-canvas min-h-screen">
      <FloatingNav />
      {/* pad for the floating (fixed) navbar */}
      <div className="pt-24">{children}</div>
    </div>
  );
}
