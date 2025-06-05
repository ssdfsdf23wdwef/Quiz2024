import React from "react";
import Link from "next/link";
import { FiGithub, FiMail, FiHelpCircle } from "react-icons/fi";

export interface FooterProps {
  /** Telif hakkı yılı */
  copyrightYear?: number;
  /** Proje veya şirket ismi */
  companyName?: string;
}

/**
 * Tüm sayfalarda kullanılan alt bilgi bileşeni
 * Yeni stil sistemine uygun olarak güncellenmiştir
 */
export const Footer: React.FC<FooterProps> = ({
  copyrightYear = new Date().getFullYear(),
  companyName = "EduAI",
}) => {
  const footerLinks = [
    { href: "/about", label: "Hakkımızda" },
    { href: "/privacy", label: "Gizlilik Politikası" },
    { href: "/terms", label: "Kullanım Koşulları" },
    { href: "/help", label: "Yardım" },
  ];

  const socialLinks = [
    {
      href: "https://github.com/yourusername/eduai",
      label: "GitHub",
      icon: <FiGithub />,
    },
    { href: "mailto:contact@example.com", label: "E-posta", icon: <FiMail /> },
    { href: "/support", label: "Destek", icon: <FiHelpCircle /> },
  ];

  return (
<<<<<<< HEAD
    <footer className="bg-elevated border-t border-primary mt-auto">
=======
    <footer className="bg-light-background dark:bg-dark-bg-primary border-t border-light-border dark:border-dark-border mt-auto">
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sol kısım - Logo ve Açıklama */}
          <div className="space-y-4">
            <div className="flex items-center">
<<<<<<< HEAD
              <span className="text-xl font-bold text-brand-primary">
                {companyName}
              </span>
            </div>
            <p className="text-sm text-secondary max-w-md">
=======
              <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-transparent bg-clip-text">
                {companyName}
              </span>
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-md">
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
              Kişiselleştirilmiş öğrenme deneyimi sunan yapay zeka destekli
              eğitim platformu. Hedeflerinize ulaşmanıza yardımcı oluyoruz.
            </p>
          </div>

          {/* Orta kısım - Hızlı Linkler */}
          <div>
<<<<<<< HEAD
            <h3 className="text-sm font-semibold text-primary mb-4">
=======
            <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
              Hızlı Linkler
            </h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
<<<<<<< HEAD
                    className="text-sm text-secondary hover:text-brand-primary transition-colors"
=======
                    className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sağ kısım - Sosyal Medya ve İletişim */}
          <div>
<<<<<<< HEAD
            <h3 className="text-sm font-semibold text-primary mb-4">
=======
            <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
              Bize Ulaşın
            </h3>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
<<<<<<< HEAD
                    className="text-sm text-secondary hover:text-brand-primary flex items-center space-x-2 transition-colors"
=======
                    className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 flex items-center space-x-2 transition-colors"
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
<<<<<<< HEAD
                    <span className="text-brand-accent">{link.icon}</span>
=======
                    <span className="text-primary-500">{link.icon}</span>
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Alt kısım - Telif hakkı */}
<<<<<<< HEAD
        <div className="border-t border-primary mt-8 pt-6 text-center">
          <p className="text-xs text-tertiary">
=======
        <div className="border-t border-light-border dark:border-dark-border mt-8 pt-6 text-center">
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
            &copy; {copyrightYear} {companyName}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
