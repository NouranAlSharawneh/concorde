import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    // React Three Fiber drives the scene imperatively inside useFrame: mutating memoised
    // uniform/vector objects per frame is the idiom, and star positions are seeded once.
    // The React Compiler purity/immutability rules don't model that, so relax them here only.
    files: ["components/canvas/**/*.tsx", "components/sections/routes/**/*.tsx", "components/sections/archive/PhotoWall.tsx"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([
    "_assets/**",
    "scripts/**",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
