import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="pb-20 md:pb-0">
        <Header />
        <main className="max-w-md mx-auto min-h-[calc(100vh-140px)] md:max-w-full">
            {children}
        </main>
        <Navbar />
      </div>
  );
}
