import { MarketingNav } from "@/components/marketing/nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-canvas min-h-screen">
      <MarketingNav />
      {children}
    </div>
  );
}
