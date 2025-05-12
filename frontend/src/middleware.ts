import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Korumalı rotaları belirle (erişim için kimlik doğrulama gerektirir)
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/courses",
  "/documents",
  "/quizzes",
  "/learning-targets",
  "/exams",
  "/learning-goals",
  "/settings",
  "/performance",
  "/quiz-history",
  "/failed-questions",
];

// Kimlik doğrulama gerektirmeyen rotalar
const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Firebase ID Token kontrolü
  const firebaseToken = request.cookies.get("firebase-auth-token")?.value;

  // Authorization header'dan token çıkarımı (API çağrıları için)
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // Yerel depodan token (fallback olarak)
  const localStorageToken = request.cookies.get("auth_token")?.value;

  // Token'ları birleştir ve geçerli bir token var mı kontrol et
  const token = firebaseToken || bearerToken || localStorageToken;

  // Token varsa kullanıcının giriş yaptığını kabul et
  const hasToken = !!token;

  // Kullanıcı giriş yapmış ve kimlik doğrulama sayfalarından birine erişmeye çalışıyorsa
  if (hasToken && authRoutes.some((route) => pathname.startsWith(route))) {
    // Kullanıcı zaten oturum açmışsa, ana sayfaya veya dashboard'a yönlendir
    const redirectPath =
      request.nextUrl.searchParams.get("returnUrl") || "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Kullanıcı giriş yapmamış ve korumalı bir sayfaya erişmeye çalışıyorsa
  if (
    !hasToken &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    // Token yoksa, giriş sayfasına yönlendir ve dönüş URL'ini kaydet
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Middleware'in çalışacağı rotaları belirle
export const config = {
  matcher: [
    /*
     * Hariç tutulanlar:
     * - api/* rotaları (bu rotalar için backend koruması kullanılır)
     * - static dosyalar (js, css, images, fonts, vs.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
