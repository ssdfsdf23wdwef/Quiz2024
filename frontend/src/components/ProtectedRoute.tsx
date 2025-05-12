"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import Spinner from "@/components/ui/Spinner";
import type { User } from "@/types/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Belirli roller için erişim kısıtlaması ekleme imkanı
}

/**
 * Korumalı route'lar için bir Higher Order Component
 * Kullanıcı giriş yapmamışsa login sayfasına yönlendirir
 * İsteğe bağlı olarak, belirli rollere sahip kullanıcılar için erişim kısıtlaması eklenebilir
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  console.log("🔒 [ProtectedRoute] ProtectedRoute bileşeni render ediliyor");

  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  console.log("🔑 [ProtectedRoute] Auth Durumu:", {
    user: user ? { id: user.id, email: user.email } : null,
    isAuthenticated,
    isLoading,
    hasAllowedRoles: !!allowedRoles?.length,
  });

  useEffect(() => {
    console.log("⚡ [ProtectedRoute] useEffect tetiklendi:", {
      user: user ? "var" : "yok",
      isAuthenticated,
      isLoading,
    });

    // Kimlik doğrulama süreci tamamlandıysa ve kullanıcı yoksa login sayfasına yönlendir
    if (!isLoading && !isAuthenticated && !user) {
      console.log(
        "⚠️ [ProtectedRoute] Kullanıcı kimliği doğrulanmadı, yönlendiriliyor...",
      );
      const returnUrl = encodeURIComponent(window.location.pathname);
      console.log(
        `🔀 [ProtectedRoute] Yönlendirme: /auth/login?returnUrl=${returnUrl}`,
      );
      router.push(`/auth/login?returnUrl=${returnUrl}`);
    }

    // Rol kontrolü (isteğe bağlı)
    if (
      isAuthenticated &&
      user &&
      allowedRoles?.length &&
      !checkUserRole(user, allowedRoles)
    ) {
      console.log("⛔ [ProtectedRoute] Kullanıcı yetkisiz, yönlendiriliyor...");
      // Kullanıcı oturum açmış ancak gerekli role sahip değil
      router.push("/unauthorized");
    }
  }, [user, isAuthenticated, router, allowedRoles, isLoading]);

  // Kimlik doğrulama durumu yüklenirken spinner göster
  if (isLoading) {
    console.log("🔄 [ProtectedRoute] Kimlik doğrulama durumu yükleniyor...");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <span className="mt-4 text-gray-500">Kimlik doğrulanıyor...</span>
      </div>
    );
  }

  // Kimlik doğrulama tamamlandı ama kullanıcı giriş yapmamışsa children gösterme
  if (!isAuthenticated || !user) {
    console.log(
      "👤 [ProtectedRoute] Kullanıcı bulunamadı, içerik gösterilmiyor",
    );
    return null;
  }

  // Rol kısıtlaması varsa ve kullanıcı yetkili değilse children gösterme
  if (allowedRoles?.length && !checkUserRole(user, allowedRoles)) {
    console.log(
      "🚫 [ProtectedRoute] Kullanıcının gerekli rolü yok, içerik gösterilmiyor",
    );
    return null;
  }

  console.log(
    "✅ [ProtectedRoute] Kimlik doğrulaması başarılı, içerik gösteriliyor",
  );
  // Kullanıcı giriş yapmış ve gerekli rollere sahipse içeriği göster
  return <>{children}</>;
}

// Kullanıcının rolünü kontrol eden yardımcı fonksiyon
function checkUserRole(user: User, allowedRoles: string[]): boolean {
  // Kullanıcı rolünü doğrudan user.role üzerinden kontrol et
  const userRole = user.role || "student";
  console.log("🔍 [ProtectedRoute] Rol kontrolü:", { userRole, allowedRoles });
  return allowedRoles.includes(userRole);
}
