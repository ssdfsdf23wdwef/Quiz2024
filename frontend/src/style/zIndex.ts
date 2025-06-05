/**
 * z-index değerleri
 * Uygulama genelinde kullanılacak z-index değerleri
 * Tutarlı katmanlama için bu değerleri kullanın
 */

// Temel z-index değerleri
const zIndex = {
  // Negatif değerler (arka planda kalan öğeler)
  behind: -1,
  
  // Nötr (varsayılan) değer
  base: 0,
  
  // Temel UI katmanlaması
  low: 10,
  medium: 20,
  high: 30,
  highest: 40,
  
  // Özel UI bileşenleri
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  drawer: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  
  // En üstte olması gereken öğeler
  overlay: 1000,
  toast: 1100,
  spinner: 1200,
  spotlight: 1300,
  
  // Maksimum değer (her şeyin üzerinde)
  max: 9999,
};

// Bileşen türlerine göre z-index değerleri
export const componentZIndex = {
  // Layout bileşenleri
  header: zIndex.fixed,
  footer: zIndex.low,
  sidebar: zIndex.fixed - 10, // Header'ın altında
  
  // Navigasyon ve menüler
  navbar: zIndex.fixed,
  mobileMenu: zIndex.drawer,
  submenu: zIndex.dropdown,
  
  // İçerik bileşenleri
  card: zIndex.base,
  carousel: zIndex.low,
  
  // İletişim kutuları
  alertDialog: zIndex.modal + 10,
  confirmDialog: zIndex.modal + 20,
  
  // Uyarı ve bildirimler
  notification: zIndex.toast,
  alert: zIndex.toast - 10,
  
  // Yükleme göstergeleri
  loadingOverlay: zIndex.overlay,
  loadingIndicator: zIndex.spinner,
  
  // Yardımcı bileşenler
  tooltip: zIndex.tooltip,
  popover: zIndex.popover,
  
  // Diğer
  dragLayer: zIndex.high,
  floatingButton: zIndex.fixed - 20,
};

// Konum değerleri
export const position = {
  static: 'static',
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',
};

// Tüm değerleri dışa aktar
export default {
  ...zIndex,
  component: componentZIndex,
  position,
}; 