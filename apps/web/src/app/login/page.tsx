"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/src/components/ui/page-header";
import { LoginForm } from "@/src/features/auth/components/login-form";
import { useAuth } from "@/src/lib/auth/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Login"
        title="Acesse a area privada da RAG Platform."
        description="Entre na workspace para usar chat, documentos, dashboard e observabilidade com controle de acesso pronto para evoluir."
      />

      <LoginForm />

    </div>
  );
}
