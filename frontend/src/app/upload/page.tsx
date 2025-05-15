"use client";

import React from "react";
import { Card, CardHeader, CardBody, Divider } from "@nextui-org/react";
import { DocumentFlow } from "@/components/document";
import PageTransition from "@/components/transitions/PageTransition";

type QuizResult = Record<string, unknown>;

export default function UploadPage() {
  const handleUploadComplete = (result: QuizResult) => {
    console.log("Yükleme ve sınav oluşturma tamamlandı:", result);
    // Gerekiyorsa başka işlemler eklenebilir
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center dark:text-white">
          Belge Yükle ve Sınav Oluştur
        </h1>

        <div className="max-w-4xl mx-auto">
          <DocumentFlow 
            onComplete={handleUploadComplete}
              />

          <Card className="mt-8">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-lg font-medium">Nasıl Çalışır?</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belgelerinizden hızlıca sınav oluşturma rehberi
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <ol className="space-y-4 list-decimal list-inside">
                <li>
                  <strong>Belge Yükleyin:</strong> PDF, DOCX veya TXT formatındaki ders notunuzu, kitap bölümünüzü veya çalışma materyalinizi yükleyin.
                </li>
                <li>
                  <strong>Konuları İnceleyin:</strong> Yapay zekanın belgenizde tespit ettiği konuları gözden geçirin ve düzenleyin. Sadece sınavda görmek istediğiniz konuları seçin.
                </li>
                <li>
                  <strong>Sınav Ayarlarını Belirleyin:</strong> Soru sayısı, zorluk seviyesi gibi sınav parametrelerini tercihlerinize göre ayarlayın.
                </li>
                <li>
                  <strong>Sınav Oluşturun:</strong> Seçtiğiniz konulara ve ayarlara göre yapay zeka sınav sorularını otomatik olarak oluşturacaktır.
                </li>
                <li>
                  <strong>Sınavı Çözün:</strong> Oluşturulan sınavı çözerek bilgi seviyenizi ölçün ve öğrenme sürecinizi takip edin.
                </li>
              </ol>
            </CardBody>
          </Card>
          </div>
      </div>
    </PageTransition>
  );
}
