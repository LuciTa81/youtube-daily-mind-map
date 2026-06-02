import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: dirname
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "android/**",
      "dist-apk/**",
      "next-env.d.ts",
      "node_modules/**",
      "out/**",
      "tsconfig.tsbuildinfo"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@next/next/no-img-element": "off"
    }
  }
];

export default eslintConfig;
