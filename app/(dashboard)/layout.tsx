import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30 p-8">{children}</main>
      </div>
    </Providers>
  );
}
