// src/app/components/ThemeProvider.jsx
"use client"; // Provider needs to be a client component

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// Make sure 'ThemeProviderProps' is imported if you use it, or remove if not
// import { type ThemeProviderProps } from "next-themes/dist/types";

// The export here is NAMED, which is fine as it's imported by name in layout.jsx
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}