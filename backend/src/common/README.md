# Hata ve Akış İzleme Sistemi

Bu sistem, uygulamanın çalışma sırasında oluşan hataları ve program akışını izlemek için tasarlanmıştır.

## Özellikler

1. **Hata Kaydı**:
   - Tüm hatalar `logs/bitirme-app-error.log` dosyasına kaydedilir
   - Hatalar terminale yazdırılmaz
   - Her uygulama başlangıcında log dosyası temizlenir ve yeniden oluşturulur
   - Hata kaydı dosya adı, satır numarası ve bağlam bilgisini içerir

2. **Akış İzleme**:
   - Program akışı sadece terminale yazdırılır
   - Akış bilgileri dosyaya kaydedilmez
   - Zaman damgası ve bağlam bilgisi içerir

## Kullanım

### Hata Kaydı

```typescript
import { logError } from '../common/utils/logger.utils';

try {
  // Hata oluşabilecek kod
} catch (error) {
  logError(
    error,                   // Hata nesnesi
    'SınıfAdı.metodAdı',     // Bağlam bilgisi
    __filename,              // Dosya adı (__filename kullanın)
    undefined,               // Satır numarası (otomatik tespit için undefined)
    { id: '123', extra: 'bilgi' } // Ek bilgiler (opsiyonel)
  );
}
```

### Akış İzleme

```typescript
import { logFlow } from '../common/utils/logger.utils';

// Fonksiyon başlangıcında
logFlow('İşlem başlatılıyor', 'SınıfAdı.metodAdı');

// İşlem adımlarında
logFlow('Veri alındı', 'SınıfAdı.metodAdı');

// İşlem sonunda
logFlow('İşlem tamamlandı', 'SınıfAdı.metodAdı');
```

## Entegrasyon

Yeni bir dosyaya entegre etmek için:

1. İlgili import'ları ekleyin:
   ```typescript
   import { logError, logFlow } from '../common/utils/logger.utils';
   ```

2. `console.log`, `console.error` ve NestJS Logger kullanımlarını değiştirin:
   - Hata kayıtları için `logError`
   - Akış izleme için `logFlow`

3. Sınıf constructor'ında başlangıç log'u ekleyin:
   ```typescript
   constructor() {
     logFlow('SınıfAdı başlatıldı', 'SınıfAdı.constructor');
   }
   ```

4. Tüm try-catch bloklarında hata yönetimini güncelleyin.

## Dikkat Edilmesi Gerekenler

- Hassas bilgileri (şifreler, tokenlar vb.) log'lara kaydetmekten kaçının
- Hata loglarında yeterli bağlam bilgisi sağlayın
- Akış loglarını aşırı kullanmaktan kaçının, sadece önemli adımları kaydedin 