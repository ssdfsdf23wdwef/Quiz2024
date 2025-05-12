"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { User } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Hoş Geldiniz, {user?.firstName || "Kullanıcı"}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Bu dashboard sayfası sadece giriş yapmış kullanıcılar tarafından
            görüntülenebilir. Oturum açık olduğu için bu içeriği
            görebiliyorsunuz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Kurslarım</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Devam ettiğiniz kursları buradan takip edebilirsiniz.
            </p>
            <Link href="/courses">
              <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                Kurslara Git
              </button>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Sınavlarım</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Yaklaşan sınavlarınızı ve geçmiş sonuçlarınızı görüntüleyin.
            </p>
            <Link href="/exams">
              <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                Sınavlara Git
              </button>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Profil Bilgilerim</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Hesap ayarlarınızı ve profil bilgilerinizi güncelleyin.
            </p>
            <Link href="/profile">
              <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                Profil Sayfasına Git
              </button>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
