import type { Metadata } from "next";
import { AppShell } from "@/src/components/layout/app-shell";
import { AuthProvider } from "@/src/lib/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Intelligent Automation Platform",
    template: "%s | Intelligent Automation Platform",
  },
  description:
    "Portal bancario digital com assistente inteligente, modulos de negocio e monitorias operacionais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">

      <body>

        <AuthProvider>
                    <AppShell>{children}</AppShell>

        </AuthProvider>

      </body>

    </html>
  );
}
