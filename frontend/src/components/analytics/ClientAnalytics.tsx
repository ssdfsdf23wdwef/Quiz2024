"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Client-side only analytics bileşenini lazy load et
const AnalyticsComponent = dynamic(() => import("./AnalyticsComponent"), {
  ssr: false,
});

export const ClientAnalytics = () => {
  // Client tarafında çalıştığından emin olmak için bir state kullanıyoruz
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <AnalyticsComponent />;
};

export default ClientAnalytics;
