import React from "react";

// Placeholder type for navigation items
// Adjust this based on your actual navigation data structure
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode; // Or a more specific icon type
  className?: string; // Add optional className
  // Add any other properties your navigation items have
}
