"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuth(); // Auth durumunu takip et
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Yükleniyor...</h2>
          <p className="text-gray-500">
            Lütfen bekleyin, kimlik doğrulaması yapılıyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header burada olabilir */}
      <div className="flex flex-1">
        {/* Sidebar burada olabilir */}
        <main className="flex-1 p-6">
          <Suspense fallback={<div>Yükleniyor...</div>}>{children}</Suspense>
        </main>
      </div>
      {/* Footer burada olabilir */}
    </div>
  );
}
