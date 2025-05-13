"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { FaGoogle } from "react-icons/fa";
import { ErrorService } from "@/services/error.service";
import { FirebaseError } from "firebase/app";
import axios from "axios";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const forceLogin = searchParams.get("forceLogin") === "true";
  const returnUrl = searchParams.get("returnUrl") || "/";
  const errorType = searchParams.get("error");

  const {
    user,
    isAuthenticated,
    login,
    loginWithGoogle,
    signOut,
    checkSession,
  } = useAuth();

  // Hata mesajlarını göster
  useEffect(() => {
    if (errorType) {
      switch (errorType) {
        case "session_expired":
          setError("Oturumunuz sona erdi, lütfen tekrar giriş yapın.");
          break;
        case "auth_required":
          setError("Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.");
          break;
        case "unauthorized":
          setError("Bu işlemi yapmak için yetkiniz yok.");
          break;
        default:
          setError("Bir hata oluştu, lütfen tekrar giriş yapın.");
      }
    }
  }, [errorType]);

  // Oturum durumunu kontrol et
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Kullanıcı zaten giriş yapmışsa ve forceLogin parametresi yoksa
      if (isAuthenticated && user && !forceLogin) {
        try {
          // Oturum durumunu kontrol et (token geçerli mi?)
          const sessionValid = await checkSession();

          if (sessionValid) {
            // Kullanıcı bilgilerini göster ve seçenek sun
            setShowLoginOptions(true);
          } else {
            // Oturum geçersizse formu göster
            setShowLoginOptions(false);
          }
        } catch (error) {
          console.error("Oturum kontrolü hatası:", error);
          setShowLoginOptions(false);
        }
      }
    };

    checkAuthStatus();
  }, [isAuthenticated, user, forceLogin, checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Temel validasyonlar
      if (!email.trim()) {
        throw new Error("E-posta adresi boş olamaz");
      }

      if (!password.trim()) {
        throw new Error("Şifre boş olamaz");
      }

      // Login işlemi
      await login(email, password);

      // Başarılı giriş sonrası yönlendirme
      router.push(returnUrl);
    } catch (err: unknown) {
      // Firebase veya API hatalarını daha detaylı işle
      let errorMessage: string;
      
      if (err instanceof FirebaseError) {
        console.error("Firebase giriş hatası:", err.code, err.message);
        
        // Özel hata mesajları
        switch(err.code) {
          case 'auth/invalid-credential':
          case 'auth/invalid-login-credentials':
            errorMessage = "E-posta adresi veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.";
            break;
          case 'auth/user-not-found':
            errorMessage = "Bu e-posta adresine sahip bir kullanıcı bulunamadı.";
            break;
          case 'auth/wrong-password':
            errorMessage = "Şifre hatalı. Lütfen tekrar deneyin.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin veya şifrenizi sıfırlayın.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.";
            break;
          case 'auth/user-disabled':
            errorMessage = "Bu hesap devre dışı bırakılmıştır. Destek ekibiyle iletişime geçin.";
            break;
          default:
            errorMessage = err.message || "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.";
        }
      } else if (axios.isAxiosError(err)) {
        // API hatalarını işle
        const statusCode = err.response?.status;
        console.error("API giriş hatası:", statusCode, err.response?.data);
        
        if (statusCode === 400) {
          errorMessage = "Geçersiz kimlik bilgileri";
        } else if (statusCode === 401) {
          errorMessage = "Oturum açma yetkiniz yok";
        } else if (statusCode === 500) {
          errorMessage = "Sunucu hatası. Lütfen daha sonra tekrar deneyin";
        } else {
          errorMessage = err.response?.data?.message || "API hatası: Giriş yapılamadı";
        }
      } else {
        // Diğer hatalar
        console.error("Giriş hatası:", err);
        errorMessage = err instanceof Error 
          ? err.message 
          : "Giriş yapılırken bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.";
      }

      setError(errorMessage);
      ErrorService.showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { isNewUser } = await loginWithGoogle();

      // Eğer yeni kullanıcıysa onboarding sayfasına, değilse istenen sayfaya yönlendir
      if (isNewUser) {
        router.push("/onboarding");
      } else {
        router.push(returnUrl);
      }
    } catch (err: unknown) {
      console.error("Google ile giriş hatası:", err);

      // Hata mesajını göster
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.";

      setError(errorMessage);
      ErrorService.showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWithCurrentAccount = () => {
    // Kullanıcıyı istenen sayfaya yönlendir
    router.push(returnUrl);
  };

  const handleUseAnotherAccount = async () => {
    try {
      setIsLoading(true);
      await signOut(); // Mevcut hesaptan çıkış yap
      setShowLoginOptions(false); // Login formunu göster
    } catch (err: unknown) {
      console.error("Çıkış hatası:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Hesap değiştirme işlemi sırasında bir hata oluştu.";
      setError(errorMessage);
      ErrorService.showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı zaten giriş yapmışsa ve seçenekler gösteriliyorsa
  if (showLoginOptions) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="w-full max-w-sm mx-auto lg:w-96">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Hoş Geldiniz
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {user?.email} olarak giriş yaptınız
              </p>

              <div className="mt-8">
                <div className="space-y-4">
                  <button
                    onClick={handleContinueWithCurrentAccount}
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Bu hesapla devam et
                  </button>

                  <button
                    onClick={handleUseAnotherAccount}
                    disabled={isLoading}
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isLoading
                      ? "İşlem yapılıyor..."
                      : "Başka hesapla giriş yap"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex-1 hidden w-0 lg:block">
          <div className="absolute inset-0 object-cover w-full h-full bg-gradient-to-r from-blue-100 to-blue-300" />
        </div>
      </div>
    );
  }

  // Normal login formu
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Hesabınıza giriş yapın
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Veya{" "}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                yeni bir hesap oluşturun
              </Link>
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    E-posta adresi
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Şifre
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="remember-me"
                      className="block ml-2 text-sm text-gray-900"
                    >
                      Beni hatırla
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      href="/auth/forgot-password"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Şifrenizi mi unuttunuz?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? "Giriş yapılıyor..." : "Giriş yap"}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-gray-500 bg-gray-50">
                      Veya şununla devam edin
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <FaGoogle className="w-5 h-5 mr-2 text-red-600" />
                    Google ile giriş yap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex-1 hidden w-0 lg:block">
        <div className="absolute inset-0 object-cover w-full h-full bg-gradient-to-r from-blue-100 to-blue-300" />
      </div>
    </div>
  );
};

export default LoginPage;
