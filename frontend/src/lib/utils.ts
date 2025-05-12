import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const formatDate = (
  dateString: string,
  locale: string = "tr-TR",
): string => {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Firebase auth token için cookie ve localStorage ayarlar
 * @param token Firebase ID Token
 * @param days Cookie geçerlilik süresi (gün)
 */
export const setAuthCookie = (token: string, days: number = 7): void => {
  if (typeof window === "undefined") return; // Server tarafında çalışmayı engelle

  try {
    // Token timestamp kaydet
    const tokenTimestamp = Date.now();
    localStorage.setItem("token_timestamp", tokenTimestamp.toString());
    localStorage.setItem("auth_token", token);

    // Cookie ayarla
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // gün cinsinden
    const expires = `expires=${date.toUTCString()}`;
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

    // Ana cookie
    document.cookie = `firebase-auth-token=${token}; ${expires}; path=/; SameSite=Lax${secure}`;

    // Yedek cookie
    document.cookie = `auth_token=${token}; ${expires}; path=/; SameSite=Lax${secure}`;

    console.log("🔐 Auth token cookie ve localStorage'a kaydedildi");
  } catch (error) {
    console.error("🔴 Auth token kaydedilirken hata:", error);
  }
};

/**
 * Firebase auth token cookie'lerini ve localStorage verilerini siler
 */
export const removeAuthCookie = (): void => {
  if (typeof window === "undefined") return; // Server tarafında çalışmayı engelle

  try {
    // Cookie'leri temizle
    document.cookie =
      "firebase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // LocalStorage'ı temizle
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token_timestamp");

    console.log("🔓 Auth token cookie ve localStorage'dan silindi");
  } catch (error) {
    console.error("🔴 Auth token silinirken hata:", error);
  }
};

/**
 * Token'ın yenilenip yenilenmemesi gerektiğini kontrol eder
 * @param minRemainingMinutes En az kaç dakika kalan süre olması gerektiği
 * @returns Token'ın yenilenmesi gerekiyorsa true
 */
export const shouldRefreshToken = (
  minRemainingMinutes: number = 10,
): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const tokenTimestamp = localStorage.getItem("token_timestamp");
    if (!tokenTimestamp) return true;

    const tokenAge = Date.now() - parseInt(tokenTimestamp);
    // Firebase tokenları 1 saat (60 dakika) geçerli
    // Verilen süre kadar önce yenileme yap
    const expiryBuffer = minRemainingMinutes * 60 * 1000;
    const refreshThreshold = 60 * 60 * 1000 - expiryBuffer;

    return tokenAge > refreshThreshold;
  } catch (error) {
    console.error("🔴 Token yenileme kontrolünde hata:", error);
    return true; // Hata durumunda token'ı yenile
  }
};

export const getAverageSuccess = <
  T extends { lastAttemptScorePercent?: number },
>(
  items: T[],
): number | null => {
  const valid = items.filter(
    (item) => typeof item.lastAttemptScorePercent === "number",
  );
  if (valid.length === 0) return null;
  const avg =
    valid.reduce((acc, item) => acc + (item.lastAttemptScorePercent || 0), 0) /
    valid.length;
  return Math.round(avg);
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength) + "...";
};

export const getDifficultyValue = (level: "kolay" | "orta" | "zor"): number => {
  switch (level) {
    case "kolay":
      return 1;
    case "orta":
      return 2;
    case "zor":
      return 3;
    default:
      return 2;
  }
};

export const generateUniqueId = (): string => {
  return (
    "id-" +
    Math.random().toString(36).substring(2, 9) +
    "-" +
    Date.now().toString(36)
  );
};

/**
 * CSS sınıflarını birleştirmek için yardımcı fonksiyon
 * clsx ve tailwind-merge kullanarak sınıfları birleştirir
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
