// Agentik flat ESLint config (ESLint 9+). Encodes rules/typescript.md
// so the linter enforces what the rule states. Adopters: install the deps
// below, then extend (Next.js: add `next/core-web-vitals`, eslint-plugin-react,
// eslint-plugin-react-hooks, jsx-a11y to match rules/ui-ux.md).
//
// Required dev deps (init-foundation installs these):
//   eslint  typescript-eslint
//
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/build/**', '**/.next/**', '**/coverage/**', '**/node_modules/**'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // rules/typescript.md — no any, no enum, type-only imports, no ts-ignore
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'No enums — use a union type or an `as const` object (rules/typescript.md).' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
);
