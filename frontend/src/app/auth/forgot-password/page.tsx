"use client";

import { useState } from "react";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/auth/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // useAuth hook ile şifre sıfırlama
      await resetPassword(email);

      // Başarılı sonuç
      setIsSubmitted(true);
    } catch (error: unknown) {
      // Firebase hata kodlarına göre kullanıcı dostu mesajlar
      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === "auth/user-not-found") {
        setError("Bu email adresiyle ilişkili bir hesap bulunamadı.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Geçersiz email adresi.");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setError(
          "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
        );
      } else if (firebaseError.code === "auth/missing-email") {
        setError("Lütfen bir email adresi girin.");
      } else {
        setError(
          "Şifre sıfırlama bağlantısı gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        );
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

        {!isSubmitted ? (
          <>
            <div className="flex items-center mb-6">
              <Link
                href="/auth/login"
                className="text-indigo-600 hover:text-indigo-800"
              >
                <FiArrowLeft className="inline-block mr-2" />
                Giriş sayfasına dön
              </Link>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Şifremi Unuttum
            </h2>
            <p className="text-gray-600 mb-6">
              Hesabınıza bağlı e-posta adresinizi girin. Size şifrenizi
              sıfırlamanız için bir bağlantı göndereceğiz.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
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
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-2 px-4 bg-indigo-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-indigo-700"
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Bağlantı Gönderildi
            </h2>
            <p className="text-gray-600 mb-6">
              Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine
              gönderildi. Lütfen e-postanızı kontrol edin ve şifrenizi
              sıfırlamak için bağlantıya tıklayın.
            </p>
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Giriş sayfasına dön
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
