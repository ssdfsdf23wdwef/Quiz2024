"use client";

import { useState, useEffect } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/auth/useAuth";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "ok" | "error"
  >("checking");
  const { register } = useAuth();

  // Component mount olduğunda backend kontrolü yap
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
        console.log(
          `🌐 [RegisterPage] Backend kontrolü yapılıyor: ${apiBaseUrl}/health`,
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(`${apiBaseUrl}/health`, {
            method: "GET",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log("✅ [RegisterPage] Backend erişilebilir!");
            setBackendStatus("ok");
          } else {
            console.error(
              `❌ [RegisterPage] Backend yanıt verdi ama başarısız durum kodu: ${response.status}`,
            );
            setBackendStatus("error");
          }
        } catch (error: unknown) {
          console.error("❌ [RegisterPage] Backend erişim hatası:", error);
          setBackendStatus("error");
        }
      } catch (error: unknown) {
        console.error("❌ [RegisterPage] Backend kontrol hatası:", error);
        setBackendStatus("error");
      }
    };

    checkBackendStatus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateFirstStep = () => {
    if (!formData.firstName || !formData.lastName) {
      setError("Ad ve soyad alanları zorunludur.");
      return false;
    }
    return true;
  };

  const validateSecondStep = () => {
    if (!formData.email) {
      setError("Email alanı zorunludur.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Geçerli bir email adresi giriniz.");
      return false;
    }

    if (!formData.password) {
      setError("Şifre alanı zorunludur.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    setError("");
    if (step === 1 && validateFirstStep()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateSecondStep()) {
      return;
    }

    setIsLoading(true);

    try {
      // Email ve şifre kontrolü
      console.log("🔄 [RegisterPage] Kayıt bilgileri kontrol ediliyor:", {
        email: formData.email,
        password: formData.password ? "Şifre girilmiş" : "Şifre eksik",
        passwordLength: formData.password.length,
      });

      // Firebase kullanarak kayıt işlemini gerçekleştir
      const displayName = `${formData.firstName} ${formData.lastName}`;

      // register çağrısında email, password ve displayName parametrelerini doğru sırayla gönder
      await register(formData.email, formData.password, displayName);

      // Başarılı kayıt sonrası router üzerinden yönlendirme yapılacak
    } catch (error: unknown) {
      console.error("Kayıt hatası:", error);

      // Ağ hatası kontrolü
      if (
        error instanceof Error &&
        (error.message.includes("Network Error") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("Backend sunucusuna") ||
          error.message.includes("net::ERR"))
      ) {
        setError(
          "Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin ve sunucunun çalışır durumda olduğundan emin olun.",
        );
      } else {
        // Firebase hata kodları kontrolü
        const firebaseError = error as { code?: string; message?: string };

        if (
          firebaseError.code === "auth/email-already-in-use" ||
          (firebaseError.message &&
            firebaseError.message.includes("email-already-in-use"))
        ) {
          setError("Bu email adresi zaten kullanılıyor.");
        } else if (
          firebaseError.code === "auth/invalid-email" ||
          (firebaseError.message &&
            firebaseError.message.includes("invalid-email"))
        ) {
          setError("Geçersiz email adresi.");
        } else if (
          firebaseError.code === "auth/weak-password" ||
          (firebaseError.message &&
            firebaseError.message.includes("weak-password"))
        ) {
          setError("Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.");
        } else if (
          firebaseError.code === "auth/missing-password" ||
          (firebaseError.message &&
            firebaseError.message.includes("missing-password"))
        ) {
          setError("Şifre boş olamaz. Lütfen bir şifre girin.");
        } else if (
          firebaseError.code === "auth/network-request-failed" ||
          (firebaseError.message &&
            firebaseError.message.includes("network-request-failed"))
        ) {
          setError("Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.");
        } else {
          setError("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-indigo-600 mb-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            quiz
          </motion.h1>
          <p className="text-gray-600">Akıllı Öğrenme Platformu</p>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Kayıt Ol</h2>

        <div className="mb-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div
                className={`w-full h-2 ${step >= 1 ? "bg-indigo-600" : "bg-gray-200"} rounded-l-full`}
              ></div>
            </div>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              1
            </div>
            <div className="flex-1">
              <div
                className={`w-full h-2 ${step >= 2 ? "bg-indigo-600" : "bg-gray-200"}`}
              ></div>
            </div>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              2
            </div>
            <div className="flex-1">
              <div
                className={`w-full h-2 ${step >= 3 ? "bg-indigo-600" : "bg-gray-200"} rounded-r-full`}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Kişisel Bilgiler</span>
            <span>Hesap Bilgileri</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {backendStatus === "error" && (
          <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-700 p-3 rounded-md mb-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Uyarı:</span>
            </div>
            <p className="mt-1">
              Backend sunucusuna bağlanılamıyor. Lütfen sunucunun çalıştığından
              emin olun. Kayıt işlemi şu anda çalışmayabilir.
            </p>
          </div>
        )}

        <form
          onSubmit={
            step === 2
              ? handleSubmit
              : (e) => {
                  e.preventDefault();
                  nextStep();
                }
          }
        >
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="firstName"
                >
                  Adınız
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Adınız"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="lastName"
                >
                  Soyadınız
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Soyadınız"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                İlerle
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="email"
                >
                  E-posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="password"
                >
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Şifreniz (en az 6 karakter)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-gray-400" />
                    ) : (
                      <FiEye className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="confirmPassword"
                >
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Şifrenizi tekrar girin"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
                </button>
              </div>
            </motion.div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Zaten bir hesabınız var mı?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
