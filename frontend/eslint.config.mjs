/**
 * This is the modern "flat config" file for ESLint, used for maintaining
 * code quality and consistency across the project.
 */
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// --- SETUP ---
// These lines are necessary boilerplate for using the FlatCompat utility,
// which allows this modern config format to use older ESLint configurations.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// --- ESLINT CONFIGURATION ARRAY ---
const eslintConfig = [
  // 1. EXTEND RECOMMENDED RULES
  // We extend the recommended rule sets from Next.js, which include best practices
  // for React, accessibility (core-web-vitals), and TypeScript.
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 2. DEFINE IGNORED FILES
  // This section tells ESLint to ignore certain files and directories,
  // such as build outputs and dependency folders, to speed up linting.
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
