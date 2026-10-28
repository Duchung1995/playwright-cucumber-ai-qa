// Cucumber profiles. Select with `cucumber-js --profile <name>` (see package.json scripts).
// `paths` is left unset so it defaults to features/**/*.feature and a positional path narrows the run.
const parallel = Number(process.env.PARALLEL ?? 1);

const common = {
  requireModule: ['tsx/cjs'],
  require: ['src/support/**/*.ts', 'src/steps/**/*.ts'],
  format: [
    'progress-bar',
    'json:reports/cucumber.json',
    'html:reports/cucumber.html',
    'rerun:reports/@rerun.txt',
  ],
  formatOptions: { snippetInterface: 'async-await' },
  parallel,
  retry: Number(process.env.RETRY ?? 0),
};

export default { ...common, tags: 'not @wip' };
export const api = { ...common, tags: '@api and not @wip' };
export const ui = { ...common, tags: '@ui and not @wip' };
export const smoke = { ...common, tags: '@smoke and not @wip' };

/** Used by the harness hooks to validate step bindings without touching reports/. */
export const dryrun = {
  requireModule: common.requireModule,
  require: common.require,
  format: ['summary'],
  dryRun: true,
  strict: true,
};
