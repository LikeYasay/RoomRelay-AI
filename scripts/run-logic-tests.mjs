/**
 * Runs the RoomRelay AI logic tests. No new dependencies and no ServiceNow connection.
 *
 *   npm run test:logic        (or: node scripts/run-logic-tests.mjs)
 *
 * What it does:
 *   1. Type-checks the pure logic files (readiness rules, validation, handoff, permissions, data) in strict mode,
 *      then transpiles them with the project's own TypeScript into a temporary folder.
 *   2. Runs tests/logic.test.cjs against the compiled code with Node's built-in test runner.
 *   3. Deletes the temporary folder.
 *
 * These tests cover the deterministic rules that the backend must also enforce.
 * They do not cover the screens; see docs/TEST_PLAN.md for the manual and browser checks.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import ts from 'typescript'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = mkdtempSync(path.join(os.tmpdir(), 'roomrelay-logic-'))
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc')

// The pure logic files of each feature (vertical slice). No screens.
const sources = [
    'features/rooms/readiness.ts',
    'features/rooms/roomViews.ts',
    'features/rooms/roomActions.ts',
    'features/rooms/progress.ts',
    'features/rooms/scope.ts',
    'features/rooms/roomCommands.ts',
    'features/housekeeping/taskCommands.ts',
    'features/housekeeping/taskValidation.ts',
    'features/dashboard/dashboardStats.ts',
    'features/maintenance/blockers.ts',
    'features/maintenance/defectValidation.ts',
    'features/maintenance/defectCommands.ts',
    'features/maintenance/scope.ts',
    'features/handoff/briefing.ts',
    'features/handoff/handoffCommands.ts',
    'features/handoff/aiBriefing.ts',
    'features/access/permissions.ts',
    'features/activity/recentActivity.ts',
    'features/portal/portalOverview.ts',
    'app/applyCommand.ts',
    'shared/api/commands.ts',
    'app/routes.ts',
    'app/parseHash.ts',
    'mock/mockData.ts',
].map((f) => path.join(root, 'src', 'client', f))

function finish(code) {
    rmSync(outDir, { recursive: true, force: true })
    process.exit(code)
}

// 1. Type-check the logic files in strict mode (nothing is written).
console.log('Type-checking the logic files (strict mode)...')
const check = spawnSync(
    process.execPath,
    [
        tsc,
        ...sources,
        '--noEmit',
        '--allowImportingTsExtensions', // server-module files import each other with explicit .ts (ServiceNow needs exact paths)
        '--module', 'es2022',
        '--moduleResolution', 'bundler',
        '--target', 'es2022',
        '--strict',
        '--skipLibCheck',
        '--jsx', 'react-jsx',
        '--esModuleInterop',
    ],
    { cwd: root, encoding: 'utf8' }
)
if (check.status !== 0) {
    console.error(check.stdout || check.stderr)
    console.error('\nThe logic files did not type-check, so the tests were not run.')
    finish(1)
}

// 2. Transpile every plain .ts file under src/client to CommonJS for Node, pointing the .ts imports at the .js output.
const clientDir = path.join(root, 'src', 'client')
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
for (const file of walk(clientDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('fontData.ts'))) {
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
        fileName: file,
    })
    const out = path.join(outDir, path.relative(clientDir, file)).replace(/\.ts$/, '.js')
    mkdirSync(path.dirname(out), { recursive: true })
    writeFileSync(out, outputText.replace(/require\("(\.{1,2}\/[^"]+)\.ts"\)/g, 'require("$1.js")'))
}

const run = spawnSync(process.execPath, ['--test', path.join(root, 'tests', 'logic.test.cjs')], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ROOMRELAY_LOGIC_DIR: outDir },
})

finish(run.status ?? 1)
