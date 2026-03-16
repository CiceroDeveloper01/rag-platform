import type { Metadata } from "next";
import { AppShell } from "@/src/components/layout/app-shell";
import { AuthProvider } from "@/src/lib/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RAG Platform",
    template: "%s | RAG Platform",
  },
  description: "Interface web para ingestao, busca e chat com pipeline RAG.",
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
