import * as bcrypt from 'bcrypt';
import { LoggerService } from '../services/logger.service';
import { FlowTrackerService } from '../services/flow-tracker.service';

const logger = LoggerService.getInstance();
const flowTracker = FlowTrackerService.getInstance();

/**
 * Şifre hash'leme ve karşılaştırma işlemleri için yardımcı fonksiyonlar
 */

/**
 * Verilen şifreyi hash'ler
 * @param password Düz metin şifre
 * @returns Hash'lenmiş şifre
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    flowTracker.trackStep("Şifre hash'leniyor", 'password.utils');

    // Tuz değeri oluştur (10 tur)
    const salt = await bcrypt.genSalt(10);

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, salt);

    logger.debug(
      "Şifre başarıyla hash'lendi",
      'password.utils.hashPassword',
      __filename,
      27,
    );

    return hashedPassword;
  } catch (error) {
    logger.logError(error, 'password.utils.hashPassword', {
      additionalInfo: "Şifre hash'lenirken hata oluştu",
    });
    throw new Error("Şifre hash'lenirken hata oluştu");
  }
}

/**
 * Verilen şifrenin hash ile eşleşip eşleşmediğini kontrol eder
 * @param plainPassword Düz metin şifre
 * @param hashedPassword Hash'lenmiş şifre
 * @returns Eşleşme durumu (true/false)
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    flowTracker.trackStep('Şifre karşılaştırılıyor', 'password.utils');

    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    logger.debug(
      `Şifre karşılaştırma sonucu: ${isMatch ? 'Eşleşiyor' : 'Eşleşmiyor'}`,
      'password.utils.comparePassword',
      __filename,
      58,
    );

    return isMatch;
  } catch (error) {
    logger.logError(error, 'password.utils.comparePassword', {
      additionalInfo: 'Şifre karşılaştırılırken hata oluştu',
    });
    throw new Error('Şifre karşılaştırılırken hata oluştu');
  }
}

/**
 * Şifre güvenlik seviyesini kontrol eder
 * @param password Şifre
 * @returns Şifrenin güvenli olup olmadığı (true/false)
 */
export function isPasswordSecure(password: string): boolean {
  try {
    flowTracker.trackStep('Şifre güvenliği kontrol ediliyor', 'password.utils');

    // En az 8 karakter
    const isLengthValid = password.length >= 8;

    // En az bir büyük harf
    const hasUpperCase = /[A-Z]/.test(password);

    // En az bir küçük harf
    const hasLowerCase = /[a-z]/.test(password);

    // En az bir rakam
    const hasDigit = /\d/.test(password);

    // En az bir özel karakter
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    const isSecure =
      isLengthValid &&
      hasUpperCase &&
      hasLowerCase &&
      hasDigit &&
      hasSpecialChar;

    logger.debug(
      `Şifre güvenliği: ${isSecure ? 'Güvenli' : 'Güvensiz'}`,
      'password.utils.isPasswordSecure',
      __filename,
      94,
      {
        criteria: {
          isLengthValid,
          hasUpperCase,
          hasLowerCase,
          hasDigit,
          hasSpecialChar,
        },
      },
    );

    return isSecure;
  } catch (error) {
    logger.logError(error, 'password.utils.isPasswordSecure', {
      additionalInfo: 'Şifre güvenliği kontrol edilirken hata oluştu',
    });
    return false;
  }
}
