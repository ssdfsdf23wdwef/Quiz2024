import { useEffect } from "react";

/**
 * Belirtilen elementin dışına tıklandığında bir callback fonksiyonu çalıştıran hook
 *
 * @param ref Element referansı
 * @param handler Tıklama yakalandığında çalıştırılacak fonksiyon
 * @param mouseEvent Dinlenecek fare olayı ('mousedown' veya 'mouseup')
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: T | null,
  handler: (event: MouseEvent | TouchEvent) => void,
  mouseEvent: "mousedown" | "mouseup" = "mousedown",
): void {
  useEffect(() => {
    // Eğer ref geçerli değilse işlem yapma
    if (!ref) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // Tıklama ref içindeyse veya ref null ise bir şey yapma
      if (!ref || ref.contains(event.target as Node)) {
        return;
      }

      // Tıklama dışarıdaysa handler'ı çağır
      handler(event);
    };

    // Hem fare hem de dokunmatik olayları dinle
    document.addEventListener(mouseEvent, listener);
    document.addEventListener("touchend", listener);

    // Temizlik fonksiyonu
    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener("touchend", listener);
    };
  }, [ref, handler, mouseEvent]);
}
