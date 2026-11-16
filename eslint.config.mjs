import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "vendor/**",
      "public/**",
      "storage/**",
      ".next/**",
      "deploy-arenhost/**",
      "src/payload/**",
      "src/migrations/**",
      "src/app/(payload)/**",
      "src/app/api/**",
      "src/app/robots.ts",
      "src/app/sitemap.ts",
      "src/app/(frontend)/layout.tsx",
      "src/app/(frontend)/page.tsx",
      "src/app/(frontend)/projects/page.tsx",
      "src/app/(frontend)/cv/page.tsx",
      "src/lib/cms.ts",
      "app.js",
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@next/next": {
        rules: {
          "no-img-element": {
            create: () => ({}),
          },
        },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
