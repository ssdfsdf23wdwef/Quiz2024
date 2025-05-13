"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Bir sonraki render'da fallback UI'yi göstermek için state'i güncelle
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Hata detaylarını loglama veya bir hata raporlama servisine gönderme
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Gerçek bir uygulamada bu loglama işlemini bir sunucuya göndereceksiniz
    // errorService.logError(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Özel fallback UI
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Bir şeyler yanlış gitti
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Uygulama bir hatayla karşılaştı ve devam edemiyor. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
              </p>
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
                {this.state.error?.toString()}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 