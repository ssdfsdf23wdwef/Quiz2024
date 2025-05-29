"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { RiGlobalLine, RiArrowDownSLine } from "react-icons/ri";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

// Desteklenen diller
const languages = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

/**
 * Uygulama dilini değiştirmek için kullanılan bileşen
 */
export default function LanguageSwitcher({
  variant = "icon",
}: {
  variant?: "text" | "icon" | "full";
}) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);

  // Dışarı tıklama ile dropdown'ı kapat
  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  // Dil değiştirme işlevi
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  // Mevcut dili bul
  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative" ref={setDropdownRef}>
      <Button
        variant="ghost"
        size={variant === "icon" ? "icon" : "sm"}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Dil değiştir"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5"
      >
        {variant !== "text" && <RiGlobalLine className="h-4 w-4" />}

        {variant !== "icon" && (
          <>
            <span className="mr-1">{currentLanguage.flag}</span>
            <span>{currentLanguage.name}</span>
          </>
        )}

        {variant === "full" && <RiArrowDownSLine className="h-4 w-4 ml-1" />}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 rounded-md bg-elevated shadow-md border border-primary z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-interactive-hover flex items-center space-x-2 ${
                  language.code === i18n.language
                    ? "bg-interactive-selected text-primary"
                    : "text-secondary"
                }`}
                role="menuitem"
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
