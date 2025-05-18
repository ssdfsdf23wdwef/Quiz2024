import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Log dizini ve dosya yollarını tanımla
const LOG_DIR = path.join(process.cwd(), 'public', 'logs');
const ERROR_LOG_PATH = path.join(LOG_DIR, 'frontend-error.log');
const FLOW_LOG_PATH = path.join(LOG_DIR, 'frontend-flow-tracker.log');

// Log dizininin var olduğundan emin ol
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Logları dosyaya kaydeder
 * @param logPath Log dosyası yolu
 * @param content Kaydedilecek içerik
 */
async function appendToLogFile(logPath: string, content: string): Promise<void> {
  try {
    // Dosya boyutunu kontrol et (max 5MB)
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Dosya boyutu 5MB'ı aştıysa, dosyayı temizle
      if (fileSizeInMB > 5) {
        fs.writeFileSync(logPath, '', { encoding: 'utf8' });
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] Log dosyası temizlendi (5MB sınırına ulaşıldı)\n`);
      }
    }
    
    // Logları dosyaya ekle
    fs.appendFileSync(logPath, content + '\n');
    return Promise.resolve();
  } catch (error) {
    console.error(`Log yazma hatası:`, error);
    return Promise.reject(error);
  }
}

/**
 * POST /api/logs endpoint'i
 * Frontend loglarını alır ve dosyaya kaydeder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Gelen log verisi bir dizi mi kontrol et
    if (!Array.isArray(body) && !body.message) {
      return NextResponse.json(
        { error: 'Geçersiz log formatı' },
        { status: 400 }
      );
    }
    
    // Tek bir log mu yoksa bir dizi mi kontrol et
    const logs = Array.isArray(body) ? body : [body];
    
    for (const log of logs) {
      const { level, message, context, timestamp, metadata } = log;
      
      const formattedTimestamp = timestamp || new Date().toISOString();
      const formattedLevel = level ? level.toUpperCase() : 'INFO';
      const formattedContext = context ? `[${context}]` : '';
      
      // Log satırını oluştur
      let logLine = `[${formattedTimestamp}] [${formattedLevel}] ${formattedContext} ${message}`;
      
      // Metadata varsa ekle
      if (metadata && Object.keys(metadata).length > 0) {
        try {
          const metadataStr = JSON.stringify(metadata);
          logLine += ` | Metadata: ${metadataStr}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // JSON dönüşüm hatası
        }
      }
      
      // Logları ilgili dosyalara kaydet
      if (level === 'error') {
        await appendToLogFile(ERROR_LOG_PATH, logLine);
      } else {
        await appendToLogFile(FLOW_LOG_PATH, logLine);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log işleme hatası:', error);
    return NextResponse.json(
      { error: 'Log kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logs endpoint'i
 * Log dosyalarını temizler
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    if (type === 'error' || type === 'all') {
      fs.writeFileSync(ERROR_LOG_PATH, '', { encoding: 'utf8' });
    }
    
    if (type === 'flow' || type === 'all') {
      fs.writeFileSync(FLOW_LOG_PATH, '', { encoding: 'utf8' });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log temizleme hatası:', error);
    return NextResponse.json(
      { error: 'Log dosyaları temizlenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logs endpoint'i
 * Log dosyalarının içeriğini döndürür
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    const result: Record<string, string> = {};
    
    if (type === 'error' || type === 'all') {
      if (fs.existsSync(ERROR_LOG_PATH)) {
        result.error = fs.readFileSync(ERROR_LOG_PATH, { encoding: 'utf8' });
      } else {
        result.error = '';
      }
    }
    
    if (type === 'flow' || type === 'all') {
      if (fs.existsSync(FLOW_LOG_PATH)) {
        result.flow = fs.readFileSync(FLOW_LOG_PATH, { encoding: 'utf8' });
      } else {
        result.flow = '';
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Log okuma hatası:', error);
    return NextResponse.json(
      { error: 'Log dosyaları okunurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 