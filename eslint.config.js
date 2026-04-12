import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,

  // ─── 1. Global language options + disabled rules ──────────────────────────
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // typescript-eslint provides its own unused-vars; built-in fires false positives
      'no-undef': 'off',
      // adapter-static has empty base path — SSR resolve() not required
      'svelte/no-navigation-without-resolve': 'off',
    },
  },

  // ─── 2. General JavaScript quality ───────────────────────────────────────
  {
    rules: {
      // Always use === / !==
      eqeqeq: ['error', 'always'],
      // Ban console.log in production code; allow console.warn / console.error
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // No var — use const / let
      'no-var': 'error',
      // Prefer const when variable is never reassigned
      'prefer-const': 'error',
      // Use template literals instead of string concatenation
      'prefer-template': 'error',
      // Use shorthand syntax in object literals: { foo } not { foo: foo }
      'object-shorthand': ['error', 'always'],
      // Disallow !!x, +x, ""+x implicit coercions — be explicit
      'no-implicit-coercion': 'error',
      // Require braces for multi-line blocks to prevent dangling-else bugs
      curly: ['error', 'multi-line'],
      // Always use single quotes; escape single quotes inside strings
      quotes: ['error', 'single', { avoidEscape: false }],
    },
  },

  // ─── 3. TypeScript strict rules (no type information required) ───────────
  {
    rules: {
      // Forbid any — use unknown + type guards instead
      '@typescript-eslint/no-explicit-any': 'error',

      // Unused variables: allow leading-underscore convention for intentional ignores
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none', // catch (err) is fine without using err
        },
      ],

      // Force `import type` for type-only imports to keep runtime bundle clean
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // Prevent side-effect-free `import type` statements
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Forbid non-null assertion (!) — handle null/undefined explicitly
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Prefer ?. over manual null checks
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // Prefer T[] over Array<T> for simple types; Array<T> for complex
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // Ban @ts-ignore and @ts-expect-error without description
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true },
      ],

      // Enforce consistent interface declarations over type aliases for objects
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },

  // ─── 4. Type-aware TypeScript rules (requires full type information) ──────
  //      Applied to .ts and .svelte.ts files only.
  {
    files: ['**/*.ts', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // Prevent operating on any-typed values — forces proper typing
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Prevent unhandled promise rejections; use void to explicitly discard
      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true },
      ],
      // Prevent awaiting non-thenables (await on non-Promise)
      '@typescript-eslint/await-thenable': 'error',
      // Prevent passing async functions where void functions are expected,
      // except in function call arguments and Svelte/HTML event attributes
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false, attributes: false } },
      ],

      // Remove type assertions that are already satisfied by the inferred type
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      // Prefer ?? over || for nullability checks (avoids falsy pitfalls)
      // ignorePrimitives: strings use || '' intentionally in many patterns
      '@typescript-eslint/prefer-nullish-coalescing': [
        'warn',
        { ignorePrimitives: { string: true, boolean: true } },
      ],
    },
  },

  // ─── 5. Svelte files — full type-aware parsing + runes overrides ─────────
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig,
      },
    },
    rules: {
      // Svelte 5 runes semantically require `let` for $props() and $derived()
      // so that the compiler can create reactive bindings. const breaks reactivity.
      'prefer-const': 'off',
    },
  },

  // ─── 6. .svelte.ts files — disable no-unsafe-* for Svelte runes ─────────
  //      The TS language service cannot resolve types of $state / $state.raw /
  //      $derived variables, so variables declared with these runes appear as
  //      unresolvable (error-typed), triggering false-positive no-unsafe-*
  //      violations. Svelte's own compiler types these correctly.
  {
    files: ['**/*.svelte.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
);
