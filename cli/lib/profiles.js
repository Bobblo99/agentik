// Profile → modules to DISABLE (park), mirroring profiles/<name>/profile.md.
// Human-readable source of truth stays in profiles/*.md; this is the
// machine-readable counterpart the scaffolder applies. Keep in sync.
// Locked-core modules are never listed here (they cannot be disabled).

export const PROFILES = {
  'web-frontend': {
    label: 'web-frontend',
    hint: 'React / Next.js app where UI/UX quality matters',
    disableRules: ['api-design'],
    disableSkills: ['api-route', 'db-migration'],
  },
  fullstack: {
    label: 'fullstack',
    hint: 'Frontend + API + database (full set, nothing disabled)',
    disableRules: [],
    disableSkills: [],
  },
  generic: {
    label: 'generic',
    hint: 'CLI, library, scripts, or a non-JS stack',
    disableRules: ['react-nextjs', 'ui-ux', 'api-design'],
    disableSkills: ['frontend-design', 'react-component', 'api-route', 'db-migration'],
  },
};

export const PROFILE_NAMES = Object.keys(PROFILES);
