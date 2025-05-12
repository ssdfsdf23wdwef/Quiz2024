"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthUser, useAuthStatus } from "@/store/auth.store";
import { getLogger, getFlowTracker, FlowCategory, trackFlow } from "@/lib/logger.utils";
import type { User } from "@/types/user";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[]; // Erişim için gerekli roller
  redirectUrl?: string; // Yetki yoksa yönlendirilecek sayfa
  loadingComponent?: ReactNode; // Yükleme durumunda gösterilecek bileşen
}

/**
 * Sadece oturumu açık kullanıcıların erişebileceği sayfalar için koruma sağlar
 * Roller, yönlendirme ve yükleme durumu konfigüre edilebilir
 */
export default function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectUrl = "/auth/login",
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { checkSession } = useAuth();
  
  // Zustand selektörleri
  const user = useAuthUser() as User | null;
  const { isAuthenticated, isLoading } = useAuthStatus() as { 
    isAuthenticated: boolean; 
    isLoading: boolean 
  };
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Kullanıcı durumunu izle
  useEffect(() => {
    const verifyAuth = async () => {
      const authVerifyId = flowTracker.startSequence('AuthVerification');
      
      logger.debug(
        `Korumalı sayfa erişimi kontrol ediliyor: ${pathname}`,
        'ProtectedRoute.verifyAuth',
        'ProtectedRoute.tsx',
        40
      );
      
      // İlk render'da isLoading true olduğundan bekle
      if (isLoading) {
        logger.debug(
          'Kullanıcı durumu yükleniyor',
          'ProtectedRoute.verifyAuth',
          'ProtectedRoute.tsx',
          47
        );
        return;
      }
      
      setIsVerifying(true);
      
      try {
        // 1. Zaten oturum açılmış mı kontrol et
        if (isAuthenticated && user) {
          logger.debug(
            `Kullanıcı zaten oturum açmış: ${user.email}`,
            'ProtectedRoute.verifyAuth',
            'ProtectedRoute.tsx',
            60,
            { userId: user.id }
          );
          
          // 2. Rol kontrolü yap (eğer requiredRoles belirtilmişse)
          if (requiredRoles.length > 0) {
            const hasRequiredRole = user.role && requiredRoles.includes(user.role);
            
            if (!hasRequiredRole) {
              logger.warn(
                `Yetkisiz erişim girişimi: ${pathname}`,
                'ProtectedRoute.verifyAuth',
                'ProtectedRoute.tsx',
                71,
                { 
                  userId: user.id, 
                  userRole: user.role, 
                  requiredRoles 
                }
              );
              
              trackFlow(
                'Rol yetkisi reddedildi', 
                'ProtectedRoute.verifyAuth',
                FlowCategory.Auth,
                { 
                  path: pathname,
                  requiredRoles, 
                  userRole: user.role 
                }
              );
              
              setHasAccess(false);
              flowTracker.endSequence(authVerifyId);
              
              // Ana sayfaya yönlendir
              router.push("/");
              return;
            }
            
            logger.debug(
              `Rol yetkisi onaylandı: ${user.role}`,
              'ProtectedRoute.verifyAuth',
              'ProtectedRoute.tsx',
              98,
              { 
                userId: user.id,
                requiredRoles 
              }
            );
          }
          
          // Erişime izin ver
          setHasAccess(true);
          flowTracker.endSequence(authVerifyId);
          return;
        }
        
        logger.debug(
          'Kullanıcı oturumu açık değil, kontrol yapılıyor',
          'ProtectedRoute.verifyAuth',
          'ProtectedRoute.tsx',
          113
        );
        
        // 3. Aktif oturum kontrolü yap
        const isSessionValid = await checkSession();
        
        if (isSessionValid) {
          logger.debug(
            'Oturum kontrolü başarılı, erişim onaylandı',
            'ProtectedRoute.verifyAuth',
            'ProtectedRoute.tsx',
            122
          );
          
          trackFlow(
            'Oturum kontrolü başarılı', 
            'ProtectedRoute.verifyAuth',
            FlowCategory.Auth
          );
          
          // Zustand store'u auth context tarafından zaten güncellendi
          setHasAccess(true);
        } else {
          logger.warn(
            `Oturumsuz erişim girişimi: ${pathname}`,
            'ProtectedRoute.verifyAuth',
            'ProtectedRoute.tsx',
            136
          );
          
          trackFlow(
            'Oturum kontrolü başarısız, yönlendiriliyor', 
            'ProtectedRoute.verifyAuth',
            FlowCategory.Auth,
            { redirectTo: redirectUrl }
          );
          
          // Giriş sayfasına yönlendir ve mevcut sayfayı kaydet
          router.push(`${redirectUrl}?returnUrl=${encodeURIComponent(pathname)}`);
          setHasAccess(false);
        }
      } catch (error) {
        logger.error(
          'Oturum kontrolü sırasında hata oluştu',
          'ProtectedRoute.verifyAuth',
          'ProtectedRoute.tsx',
          154,
          { error, pathname }
        );
        
        // Hata durumunda giriş sayfasına yönlendir
        router.push(redirectUrl);
        setHasAccess(false);
      } finally {
        setIsVerifying(false);
        flowTracker.endSequence(authVerifyId);
      }
    };

    verifyAuth();
  }, [
    isLoading, 
    isAuthenticated, 
    user, 
    pathname, 
    router, 
    checkSession, 
    redirectUrl, 
    requiredRoles
  ]);

  // Doğrulama durumunda yükleme ekranını göster
  if (isVerifying || isLoading) {
    // Özel yükleme bileşeni veya varsayılan
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
      </>
    );
  }

  // Erişimi varsa içeriği göster
  return hasAccess ? <>{children}</> : null;
}
