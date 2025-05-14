import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "quiz - Akıllı Sınav Hazırlama ve Öğrenme Platformu",
  description: "Kişiselleştirilmiş sınavlarla öğrenmenizi geliştirin",
  applicationName: "quiz",
  authors: [{ name: "quiz Team" }],
  keywords: [
    "eğitim",
    "sınav",
    "öğrenme",
    "yapay zeka",
    "kişiselleştirilmiş öğrenme",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}; 