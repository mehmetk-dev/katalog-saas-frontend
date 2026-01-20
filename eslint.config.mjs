import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
    {
        ignores: [".next/**", "node_modules/**", "backend/**", "**/*.config.js", "**/*.config.mjs", "scripts/**", "debug-config.mjs"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            "@next/next": nextPlugin,
            "react": reactPlugin,
            "react-hooks": hooksPlugin,
        },
        rules: {
            // Manually include necessary rules
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,

            // React specific overrides
            "react/no-unescaped-entities": "off",
            "react/display-name": "off",
            "react/prop-types": "off",

            // Hooks
            ...hooksPlugin.configs.recommended.rules,
            "react-hooks/exhaustive-deps": "warn",

            // TypeScript
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",

            // General Relaxations for Legacy Codebase compatibility
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "prefer-const": "warn",
            "no-var": "error",
            "no-undef": "off",
            "no-useless-catch": "warn",
            "no-empty": "warn",
            "no-useless-escape": "warn",
            "@typescript-eslint/no-var-requires": "off",
            "no-unused-expressions": "off",
            "@typescript-eslint/no-unused-expressions": "warn",
            // Allow setState in useEffect for hydration patterns (mounted state)
            "react-hooks/set-state-in-effect": "off"
        },
        settings: {
            react: {
                version: "detect"
            }
        }
    },
    {
        files: ["scripts/**/*.mjs", "**/*.mjs"],
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly"
            },
            ecmaVersion: "latest",
            sourceType: "module"
        },
        rules: {
            "no-console": "off",
            "no-undef": "off"
        }
    }
);
