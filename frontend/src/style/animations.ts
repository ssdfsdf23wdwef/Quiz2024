/**
 * Animasyon değişkenleri
 * Tüm uygulama genelinde kullanılacak animasyon ve geçiş özellikleri
 */

import { Variants } from "framer-motion";

// Geçiş süreleri
export const duration = {
  fastest: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slowest: 0.8,
};

// Geçiş fonksiyonları
export const easing = {
  // Standart geçişler
  ease: [0.25, 0.1, 0.25, 1], // Cubic-bezier
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  
  // İleri seviye geçişler
  // https://cubic-bezier.com adresinden örnekler
  sharp: [0.4, 0, 0.6, 1],
  elastic: [0.68, -0.55, 0.265, 1.55],
  bounce: [0.34, 1.56, 0.64, 1],
  smooth: [0.4, 0.0, 0.2, 1],
  
  // İlgi çekici geçişler
  spring: [0.155, 1.105, 0.295, 1.12],
  snappy: [0.25, 0.8, 0.25, 1],
};

// Temel animasyon geçiş özellikleri
export const transition = {
  default: {
    duration: duration.normal,
    ease: easing.easeInOut,
  },
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  },
  bounce: {
    type: "spring",
    stiffness: 300,
    damping: 10,
    mass: 0.8,
  },
  gentle: {
    type: "spring",
    stiffness: 100,
    damping: 20,
  },
};

// Framer Motion için hazır animasyon varyantları
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.normal,
      ease: easing.easeInOut,
    },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.15,
      duration: duration.normal,
      ease: easing.smooth,
    },
  }),
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

export const scale: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: duration.normal,
      ease: easing.spring,
    },
  },
};

// Sayfa geçiş animasyonları
export const pageTransitions: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: duration.normal,
      ease: easing.easeInOut,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: duration.fast,
      ease: easing.easeOut,
    },
  },
};

// Stagger (sıralı animasyon) efektleri için
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Buton animasyonları
export const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
  },
  tap: { scale: 0.98 },
};

// Çeşitli özel animasyonlar
export const specialAnimations = {
  gradient: {
    backgroundSize: "200% 200%",
    transition: {
      backgroundPosition: {
        duration: 15,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "linear",
      }
    }
  },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  shimmer: {
    x: ["0%", "100%"],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }
};

// Tüm animasyon değişkenlerini gruplandırarak dışa aktar
const animations = {
  duration,
  easing,
  transition,
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scale,
  pageTransitions,
  staggerContainer,
  buttonHover,
  specialAnimations,
};

export default animations; 