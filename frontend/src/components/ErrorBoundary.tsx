"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "./ui/Alert";
import { Button } from "./ui/Button";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { FlowCategory } from "@/services/flow-tracker.service";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  // Loglama seçenekleri
  context?: string;
  enableStackTrace?: boolean;
  captureComponentTree?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo;
  componentStack?: string;
}

/**
 * Hataları yakalayan, loglayan ve uygun bir geri dönüş arayüzü gösteren bileşen
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly logger = getLogger();
  private readonly flowTracker = getFlowTracker();
  public readonly _context: string;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: undefined,
      componentStack: undefined,
    };
    
    this._context = props.context || 'ErrorBoundary';
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const componentStack = errorInfo.componentStack || '';
    
    // Durumu güncelle
    this.setState({
      errorInfo,
      componentStack
    });
    
    // Logger servisi ile hata logla
    this.logger.error(
      `Yakalanan hata: ${error.message}`,
      this._context,
      'ErrorBoundary.tsx',
      51,
      {
        errorName: error.name,
        componentStack,
        stack: error.stack,
      }
    );
    
    // Akış izleme
    this.flowTracker.trackStep(
      FlowCategory.Component,
      `Hata yakalandı: ${error.message}`,
      this._context,
      {
        errorName: error.name,
        hasComponentStack: !!componentStack,
      }
    );
    
    // Console loglama (eski davranış için korundu)
    console.error("Error Boundary yakaladı:", error, errorInfo);

    // Özel hata işleyiciyi çağır
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    // Akış izleme
    this.flowTracker.trackStep(
      FlowCategory.User,
      'Hata sınırını sıfırla',
      this._context
    );
    
    // Özel sıfırlama işleyicisini çağır
    if (this.props.onReset) {
      this.props.onReset();
    }

    // State'i sıfırla
    this.setState({
      hasError: false,
      error: null,
      errorInfo: undefined,
      componentStack: undefined,
    });
    
    // Log
    this.logger.info(
      'Hata durumu sıfırlandı',
      this._context,
      'ErrorBoundary.tsx',
      102
    );
  };

  render() {
    if (this.state.hasError) {
      // Özel fallback bileşeni varsa onu kullan
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Varsayılan hata UI'ı
      return (
        <div className="p-4 flex items-center justify-center min-h-[200px]">
          <div className="w-full max-w-md">
            <Alert variant="error">
              <AlertTitle>Bir hata oluştu</AlertTitle>
              <AlertDescription>
                <div className="mt-2 text-sm">
                  {this.state.error && (
                    <p className="font-mono bg-danger-50 dark:bg-danger-950/30 p-2 rounded text-danger-800 dark:text-danger-200 text-xs mt-2 mb-4 overflow-auto max-h-32">
                      {this.state.error.toString()}
                    </p>
                  )}
                  
                  {this.props.enableStackTrace && this.state.componentStack && (
                    <details className="mt-2 mb-4">
                      <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                        Bileşen Yığını
                      </summary>
                      <pre className="font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300 text-xs mt-2 overflow-auto max-h-48">
                        {this.state.componentStack}
                      </pre>
                    </details>
                  )}
                  
                  <div className="mt-4 flex space-x-2">
                    <Button onClick={this.resetErrorBoundary} size="sm">
                      Yeniden Dene
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                    >
                      Sayfayı Yenile
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
