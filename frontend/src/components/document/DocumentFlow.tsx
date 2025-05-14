import { useState, useCallback, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Progress,
  Chip
} from "@nextui-org/react";
import { 
  FiAlertCircle, 
  FiEdit, 
  FiArrowRight, 
  FiCpu 
} from "react-icons/fi";
import { motion } from "framer-motion";
import { DocumentUploader } from "./index";
import { TopicDetector } from "./index";
import documentService from "@/services/document.service";
import { useRouter } from "next/navigation";
import ErrorService from "@/services/error.service";
import { DetectedSubTopic } from "@/types/learningTarget";
import { trackFlow, prettyLogError, logInfo, logDebug } from "@/lib/logger.utils";
import { FlowCategory } from "@/constants/logging.constants";

export enum DocumentFlowStep {
  UPLOAD = "upload",
  PROCESSING = "processing",
  TOPIC_SELECTION = "topic_selection",
  QUIZ_SETUP = "quiz_setup",
  CREATING_QUIZ = "creating_quiz",
  COMPLETE = "complete",
}

interface DocumentFlowProps {
  courseId?: string;
  onComplete?: (result: Record<string, unknown>) => void;
  onCancel?: () => void;
}

interface DocumentType {
  id: string;
  fileName: string;
  fileUrl: string;
  extractedTextLength?: number;
}

interface CreatedQuizType {
  id: string;
  questionCount: number;
}

export default function DocumentFlow({
  courseId,
  onComplete,
  onCancel,
}: DocumentFlowProps) {
  const router = useRouter();

  // State tanımlamaları
  const [currentStep, setCurrentStep] = useState<DocumentFlowStep>(
    DocumentFlowStep.UPLOAD
  );
  const [uploadedDocument, setUploadedDocument] = useState<DocumentType | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<DetectedSubTopic[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [error, setError] = useState<string | null>(null);
  const [processPercentage, setProcessPercentage] = useState<number>(0);
  const [createdQuiz, setCreatedQuiz] = useState<CreatedQuizType | null>(null);

  // Dosya yükleme başarıyla tamamlandığında
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      logInfo(
        `Dosya yükleme başlatıldı: ${file.name} (${file.size} bytes)`,
        "DocumentFlow.handleFileUpload"
      );
      
      setCurrentStep(DocumentFlowStep.PROCESSING);
      setProcessPercentage(20);

      trackFlow(
        `Dosya yükleniyor: ${file.name}`,
        "DocumentFlow.handleFileUpload",
        FlowCategory.Component
      );
      
      // Belgeyi yükle ve konuları tespit et
      const startTime = performance.now();
      
      const result = await documentService.uploadAndDetectTopics(file, courseId);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logDebug(
        `Belge yüklendi ve konular tespit edildi (${duration.toFixed(2)}ms)`,
        "DocumentFlow.handleFileUpload",
        __filename,
        undefined,
        { 
          documentId: result.document.id,
          fileName: result.document.fileName,
          topicCount: result.topics.length,
          duration: `${duration.toFixed(2)}ms` 
        }
      );
      
      setUploadedDocument(result.document);
      
      // Konuları işle
      const processedTopics = result.topics.map((topic: DetectedSubTopic) => ({
        ...topic,
        id: topic.normalizedSubTopicName,
        isSelected: true,
      }));
      
      setSelectedTopics(processedTopics);
      setProcessPercentage(100);
      
      trackFlow(
        `Yükleme tamamlandı, ${processedTopics.length} konu tespit edildi`,
        "DocumentFlow.handleFileUpload",
        FlowCategory.Component
      );
      
      setCurrentStep(DocumentFlowStep.TOPIC_SELECTION);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Belge yüklenirken veya işlenirken bir hata oluştu.";
      
      prettyLogError(
        error instanceof Error ? error : new Error(errorMessage),
        "DocumentFlow.handleFileUpload",
        { courseId }
      );
      
      setError(errorMessage);
      setCurrentStep(DocumentFlowStep.UPLOAD);
      ErrorService.showToast("Belge işlenirken bir hata oluştu", "error");
    }
  }, [courseId]);

  // Konu seçimi tamamlandığında
  const handleTopicsSelected = useCallback((selectedTopicIds: string[]) => {
    try {
      // Seçilen konuları filtreleme
      const filteredTopics = selectedTopics.filter((topic) =>
        selectedTopicIds.includes(topic.id || topic.normalizedSubTopicName)
      );
      
      logDebug(
        `Konu seçimi tamamlandı: ${filteredTopics.length} konu seçildi`,
        "DocumentFlow.handleTopicsSelected",
        __filename,
        undefined,
        { 
          totalTopicCount: selectedTopics.length,
          selectedTopicCount: filteredTopics.length,
          selectedTopics: filteredTopics.map(t => t.subTopicName)
        }
      );
      
      trackFlow(
        `${filteredTopics.length} konu seçildi`,
        "DocumentFlow.handleTopicsSelected",
        FlowCategory.Component
      );
      
      setSelectedTopics(filteredTopics);
      setCurrentStep(DocumentFlowStep.QUIZ_SETUP);
    } catch (error: unknown) {
      prettyLogError(
        error instanceof Error ? error : new Error("Konu seçimi işlenirken bir hata oluştu"),
        "DocumentFlow.handleTopicsSelected"
      );
      
      ErrorService.showToast("Konu seçimi işlenirken bir hata oluştu", "error");
    }
  }, [selectedTopics]);

  // Konu seçimini iptal ettiğinde
  const handleCancelTopicSelection = useCallback(() => {
    setCurrentStep(DocumentFlowStep.UPLOAD);
    setUploadedDocument(null);
    setSelectedTopics([]);
  }, []);

  // Sınav oluşturulduğunda
  const handleCreateQuiz = useCallback(async () => {
    try {
      logInfo(
        `Sınav oluşturma işlemi başlatılıyor`,
        "DocumentFlow.handleCreateQuiz",
        __filename,
        undefined,
        {
          documentId: uploadedDocument?.id,
          topicCount: selectedTopics.length,
          questionCount,
          difficulty
        }
      );
      
      setCurrentStep(DocumentFlowStep.CREATING_QUIZ);
      
      trackFlow(
        `Sınav oluşturma başlatıldı: ${questionCount} soru, ${difficulty} zorluk`,
        "DocumentFlow.handleCreateQuiz",
        FlowCategory.Component
      );
      
      // Sınav oluşturma için alt konuları hazırla
      const subTopics = selectedTopics.map((topic) => ({
        subTopicName: topic.subTopicName,
        normalizedSubTopicName: topic.normalizedSubTopicName,
      }));
      
      if (!uploadedDocument) {
        throw new Error("Belge bilgisi bulunamadı");
      }
      
      // Sınav oluşturma başlangıç zamanı
      const startTime = performance.now();
      
      logDebug(
        `QuizzesService.createQuiz API isteği gönderiliyor`,
        "DocumentFlow.handleCreateQuiz",
        __filename
      );
      
      // Sınav oluşturma isteği
      const result = await documentService.createQuizFromDocument(
        uploadedDocument.id,
        {
          subTopics,
          questionCount,
          difficulty,
        }
      );
      
      // Sınav oluşturma bitiş zamanı ve süre hesaplama
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logInfo(
        `Sınav başarıyla oluşturuldu: ${result.id} (${duration.toFixed(2)}ms)`,
        "DocumentFlow.handleCreateQuiz",
        __filename,
        undefined,
        {
          quizId: result.id,
          questionCount: result.questionCount,
          duration: `${duration.toFixed(2)}ms`,
        }
      );
      
      trackFlow(
        `Sınav oluşturuldu: ${result.id}, ${result.questionCount} soru`,
        "DocumentFlow.handleCreateQuiz",
        FlowCategory.Component
      );
      
      setCreatedQuiz(result);
      setCurrentStep(DocumentFlowStep.COMPLETE);
      
      // Callback'i çağır ya da yönlendir
      if (onComplete) {
        // Result'ı Record<string, unknown> tipine dönüştür
        const resultAsRecord: Record<string, unknown> = { ...result };
        onComplete(resultAsRecord);
        
        logDebug(
          `onComplete callback çağrıldı`,
          "DocumentFlow.handleCreateQuiz",
          __filename
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Sınav oluşturulurken bir hata oluştu.";
      
      prettyLogError(
        error instanceof Error ? error : new Error(errorMessage),
        "DocumentFlow.handleCreateQuiz",
        {
          documentId: uploadedDocument?.id,
          topicCount: selectedTopics.length,
          questionCount,
          difficulty
        }
      );
      
      trackFlow(
        `❌ Sınav oluşturma hatası: ${errorMessage}`,
        "DocumentFlow.handleCreateQuiz",
        FlowCategory.Error
      );
      
      setError(errorMessage);
      setCurrentStep(DocumentFlowStep.QUIZ_SETUP);
      ErrorService.showToast("Sınav oluşturulamadı", "error");
    }
  }, [uploadedDocument, selectedTopics, questionCount, difficulty, onComplete]);

  // Sınavı görüntüle
  const handleViewQuiz = useCallback(() => {
    if (createdQuiz && createdQuiz.id) {
      router.push(`/exams/${createdQuiz.id}`);
    }
  }, [createdQuiz, router]);

  // İptal et ve sıfırla
  const handleReset = useCallback(() => {
    setCurrentStep(DocumentFlowStep.UPLOAD);
    setUploadedDocument(null);
    setSelectedTopics([]);
    setQuestionCount(10);
    setDifficulty("medium");
    setError(null);
    setProcessPercentage(0);
    setCreatedQuiz(null);
    
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // İlk yükleme sırasında loglama
  useEffect(() => {
    logDebug(
      `DocumentFlow bileşeni yüklendi`,
      "DocumentFlow.useEffect",
      __filename,
      undefined,
      { courseId, step: currentStep }
    );
    
    trackFlow(
      `Belge yükleme ve sınav oluşturma akışı başlatıldı`,
      "DocumentFlow",
      FlowCategory.Component
    );
    
    return () => {
      trackFlow(
        `Belge yükleme ve sınav oluşturma akışı sonlandırıldı`,
        "DocumentFlow",
        FlowCategory.Component
      );
    };
  }, [courseId]);

  // Render içeriği
  const renderStepContent = () => {
    switch (currentStep) {
      case DocumentFlowStep.UPLOAD:
        return (
          <div className="p-6 flex flex-col items-center">
            <DocumentUploader
              onFileUpload={handleFileUpload}
              onError={(msg) => setError(msg)}
              className="w-full max-w-xl"
            />
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-sm">
                <div className="flex items-start">
                  <FiAlertCircle className="mt-0.5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        );
        
      case DocumentFlowStep.PROCESSING:
        return (
          <div className="p-6 flex flex-col items-center">
            <div className="mb-8 text-center">
              <FiCpu className="text-4xl text-indigo-500 dark:text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                Belgeniz İşleniyor
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Yapay zeka belgenizi analiz ediyor ve konuları tespit ediyor
              </p>
            </div>
            
            <div className="w-full max-w-md mb-4">
              <Progress
                value={processPercentage}
                color="primary"
                showValueLabel={true}
                className="w-full"
              />
            </div>

            {uploadedDocument && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Belge: {uploadedDocument.fileName}
                </p>
              </div>
            )}
          </div>
        );
        
      case DocumentFlowStep.TOPIC_SELECTION:
        return (
          <div className="p-0">
            {uploadedDocument ? (
              <TopicDetector
                documentId={uploadedDocument.id}
                fileName={uploadedDocument.fileName}
                onTopicsSelected={handleTopicsSelected}
                onCancel={handleCancelTopicSelection}
                onError={(msg) => setError(msg)}
              />
            ) : (
              <div className="p-6 text-center">
                <FiAlertCircle className="text-4xl text-red-500 dark:text-red-400 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-300">
                  Belge bilgisi bulunamadı
                </p>
                <Button
                  color="primary"
                  variant="light"
                  onClick={() => setCurrentStep(DocumentFlowStep.UPLOAD)}
                  className="mt-4"
                >
                  Yeniden Başla
                </Button>
              </div>
            )}
          </div>
        );
        
      case DocumentFlowStep.QUIZ_SETUP:
        return (
          <div className="p-6">
            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">
              Sınav Ayarları
            </h3>
            
            <div className="mb-6">
              <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seçilen Konular ({selectedTopics.length})
              </h4>
                            <div className="flex flex-wrap gap-2 mb-4">                {selectedTopics.map((topic, index) => (                  <Chip key={`selected-topic-${topic.id || topic.normalizedSubTopicName}-${index}`} color="primary" variant="flat">                    {topic.subTopicName || topic.name}                  </Chip>                ))}              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Soru Sayısı
              </h4>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full max-w-xs"
                />
                <span className="text-gray-800 dark:text-gray-200 min-w-16 text-center">
                  {questionCount} soru
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zorluk
              </h4>
              <div className="flex flex-wrap gap-2">
                                {["easy", "medium", "hard", "mixed"].map((level, index) => (                  <Button                    key={`difficulty-level-${level}-${index}`}                    color={difficulty === level ? "primary" : "default"}                    variant={difficulty === level ? "solid" : "bordered"}                    onClick={() => setDifficulty(level)}                    className="capitalize"                  >                    {level === "easy" && "Kolay"}                    {level === "medium" && "Orta"}                    {level === "hard" && "Zor"}                    {level === "mixed" && "Karışık"}                  </Button>                ))}
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <Button
                color="default"
                variant="bordered"
                onClick={() => setCurrentStep(DocumentFlowStep.TOPIC_SELECTION)}
              >
                Geri
              </Button>
              <Button
                color="primary"
                onClick={handleCreateQuiz}
                endContent={<FiArrowRight />}
              >
                Sınavı Oluştur
              </Button>
            </div>
          </div>
        );
        
      case DocumentFlowStep.CREATING_QUIZ:
        return (
          <div className="p-6 flex flex-col items-center">
            <div className="mb-8 text-center">
              <FiEdit className="text-4xl text-indigo-500 dark:text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                Sınav Oluşturuluyor
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Yapay zeka seçilen konulara göre sınav soruları oluşturuyor
              </p>
            </div>
            
            <div className="w-12 h-12 border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-500 rounded-full animate-spin"></div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Seçilen konular: {selectedTopics.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Hedeflenen soru sayısı: {questionCount}
              </p>
            </div>
          </div>
        );
        
      case DocumentFlowStep.COMPLETE:
        return (
          <div className="p-6 flex flex-col items-center">
            <div className="mb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                Sınav Başarıyla Oluşturuldu!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {createdQuiz?.questionCount || questionCount} soru oluşturuldu
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Sınav ID: {createdQuiz?.id}
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                color="primary"
                className="min-w-32"
                onClick={handleViewQuiz}
                disabled={!createdQuiz?.id}
              >
                Sınava Git
              </Button>
              <Button
                color="default"
                variant="bordered"
                onClick={handleReset}
              >
                Başa Dön
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // İlerleme çubuğu
  const getStepProgress = () => {
    switch (currentStep) {
      case DocumentFlowStep.UPLOAD:
        return 1;
      case DocumentFlowStep.PROCESSING:
        return 2;
      case DocumentFlowStep.TOPIC_SELECTION:
        return 3;
      case DocumentFlowStep.QUIZ_SETUP:
        return 4;
      case DocumentFlowStep.CREATING_QUIZ:
        return 5;
      case DocumentFlowStep.COMPLETE:
        return 6;
      default:
        return 1;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Belgeden Sınav Oluştur
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Belgenizden otomatik olarak sorular oluşturun
          </p>
        </div>
        
        <div className="flex items-center space-x-1 text-xs">
                    {["Yükleme", "İşleme", "Konular", "Ayarlar", "Oluşturma", "Tamamlandı"].map(            (step, index) => (              <div key={`flow-step-${step}-${index}`} className="flex items-center">
                <div
                  className={`rounded-full w-2 h-2 ${
                    index + 1 <= getStepProgress()
                      ? "bg-indigo-600 dark:bg-indigo-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                ></div>
                {index < 5 && (
                  <div
                    className={`w-6 h-0.5 ${
                      index + 1 < getStepProgress()
                        ? "bg-indigo-600 dark:bg-indigo-500"
                        : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  ></div>
                )}
              </div>
            )
          )}
        </div>
      </CardHeader>
      
      <CardBody className="p-0">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </CardBody>
    </Card>
  );
} 