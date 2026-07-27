import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Test and E2E files run under Vitest/Playwright, not the Next lint gate.
    ignores: ["e2e/**", "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
  },
];

export default eslintConfig;
