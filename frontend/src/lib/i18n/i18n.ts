import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import trTranslation from "./locales/tr.json";
import enTranslation from "./locales/en.json";

// i18next yapılandırması
i18n
  // Tarayıcıda otomatik dil tespiti
  .use(LanguageDetector)
  // React i18next ile entegrasyon
  .use(initReactI18next)
  // Başlat
  .init({
    // Desteklenen diller
    resources: {
      tr: {
        translation: trTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    // Varsayılan dil (fallback)
    fallbackLng: "tr",
    // Debug modunu sadece geliştirme ortamında etkinleştir
    debug: process.env.NODE_ENV === "development",
    // Algılama seçenekleri
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    // Enterpolasyon ayarları
    interpolation: {
      escapeValue: false, // React zaten XSS saldırılarını önlediği için
    },
    // Asenkron olarak yükleme yerine tüm dizel lokalizasyon dosyalarını yükle
    // (bundle boyutu çok büyükse react-i18next/i18next-http-backend kullanabilirsiniz)
    load: "all",
  });

export default i18n;
