import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Simulated data may only enter the app through DataProvider (?demo=1). See CLAUDE.md.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/demo/**", "src/components/data/DataProvider.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/demo", "@/demo/*", "**/demo/*"],
              message:
                "Simulated data may only be imported by src/components/data/DataProvider.tsx (?demo=1).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
