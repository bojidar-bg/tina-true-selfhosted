import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["**/dist"]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: {...globals.browser, ...globals.node} }
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    "settings": {
      "react": {
        "version": "18.3.1",
      }
    },
    "rules": {
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
        }
      ],
      "@typescript-eslint/no-explicit-any": "off",
    }
  }
]) as any;
