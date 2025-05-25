# Theme System Documentation

Bu dokümantasyon, projenin tema sisteminin nasıl kullanılacağını açıklar.

## Dosya Yapısı

```
src/styles/
├── index.ts          # Ana export dosyası
├── colors.ts         # Renk paleti
├── theme.ts          # Açık ve koyu tema konfigürasyonları
├── typography.ts     # Tipografi ayarları
├── tokens.ts         # Spacing, border-radius, z-index vb.
└── globals.css       # CSS custom properties
```

## Kullanım

### 1. TypeScript/React'te Tema Kullanımı

```tsx
import { lightTheme, darkTheme, colors, typography } from '@/styles';

// Renk kullanımı
const primaryColor = colors.primary[500];
const textColor = lightTheme.colors.text.primary;

// Typography kullanımı
const headingStyle = typography.textStyles.h1;
```

### 2. CSS Custom Properties Kullanımı

```css
/* Tema renkleri */
.my-component {
  background-color: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
  border: 1px solid rgb(var(--color-border-primary));
}

/* Utility sınıfları */
.my-element {
  @apply bg-primary text-primary border-primary shadow-md;
}
```

### 3. Tema Değiştirme

```tsx
// HTML element'ine data-theme attribute'u ekle/çıkar
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.removeAttribute('data-theme'); // light tema için
```

## Renk Sistemi

### Ana Renkler
- **Primary (Mavi)**: Ana marka rengi, butonlar ve bağlantılar için
- **Secondary (Yeşil)**: Başarı durumları ve ikincil eylemler için
- **Accent (Mor)**: Vurgu ve özel durumlar için
- **Warning (Turuncu)**: Uyarı mesajları için
- **Error (Kırmızı)**: Hata durumları için
- **Gray**: Nötr renkler, arka planlar ve kenarlıklar için

### Renk Tonları
Her renk 50'den 950'ye kadar 11 farklı tonda mevcuttur:
- 50-100: Çok açık tonlar (arka planlar için)
- 200-300: Açık tonlar (kenarlıklar için)
- 400-600: Orta tonlar (ana renkler)
- 700-950: Koyu tonlar (metinler ve vurgular için)

## Responsive Breakpoints

```
xs: 0px      (mobil)
sm: 640px    (küçük tablet)
md: 768px    (tablet)
lg: 1024px   (küçük masaüstü)
xl: 1280px   (masaüstü)
2xl: 1536px  (büyük masaüstü)
```

## Spacing Sistemi

4px tabanlı spacing sistemi:
- 1 unit = 4px
- 2 unit = 8px
- 4 unit = 16px
- 8 unit = 32px

## Typography

### Font Families
- **Sans**: Inter (ana font)
- **Mono**: JetBrains Mono (kod için)

### Text Styles
- h1-h6: Başlık stilleri
- body, bodyLarge, bodySmall: Gövde metinleri
- button: Buton metinleri
- caption: Küçük metinler
- code: Kod blokları

## Animasyonlar

### Duration
- fastest: 50ms
- fast: 150ms
- normal: 200ms
- slow: 300ms

### Easing
- linear, easeIn, easeOut, easeInOut
- easeInBack, easeOutBack (özel efektler için)

## Best Practices

1. **Semantic Renk Kullanımı**: Renkleri anlamlarına göre kullanın
   - Primary: Ana eylemler
   - Secondary: İkincil eylemler
   - Success: Başarı durumları
   - Warning: Uyarılar
   - Error: Hatalar

2. **Accessibility**: Kontrast oranlarına dikkat edin
   - Text/background minimum 4.5:1 kontrast
   - Large text minimum 3:1 kontrast

3. **Consistency**: Tüm projede aynı spacing ve typography kurallarını kullanın

4. **Theme Switching**: Kullanıcı tercihi ve sistem temasını destekleyin

## Örnek Kullanımlar

### Component Styling
```tsx
const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  background-color: ${props => 
    props.variant === 'primary' 
      ? 'rgb(var(--color-brand-primary))' 
      : 'rgb(var(--color-brand-secondary))'
  };
  color: rgb(var(--color-text-inverse));
  padding: ${spacing[3]} ${spacing[6]};
  border-radius: ${borderRadius.md};
  transition: background-color ${duration.normal} ${easing.easeInOut};
  
  &:hover {
    background-color: ${props => 
      props.variant === 'primary' 
        ? 'rgb(var(--color-brand-primary-hover))' 
        : 'rgb(var(--color-brand-secondary-hover))'
    };
  }
`;
```

### Layout Styling
```css
.container {
  max-width: 1280px; /* xl breakpoint */
  margin: 0 auto;
  padding: 0 1rem; /* spacing[4] */
}

.card {
  background-color: rgb(var(--color-bg-elevated));
  border: 1px solid rgb(var(--color-border-primary));
  border-radius: 0.5rem; /* borderRadius.lg */
  box-shadow: var(--shadow-md);
  padding: 1.5rem; /* spacing[6] */
}
```
