/**
 * Runs the RoomRelay AI logic tests. No new dependencies and no ServiceNow connection.
 *
 *   npm run test:logic        (or: node scripts/run-logic-tests.mjs)
 *
 * What it does:
 *   1. Compiles the pure logic files (readiness rules, validation, handoff, permissions, data)
 *      with the project's own TypeScript into a temporary folder, in strict mode.
 *   2. Runs tests/logic.test.cjs against the compiled code with Node's built-in test runner.
 *   3. Deletes the temporary folder.
 *
 * These tests cover the deterministic rules that the backend must also enforce.
 * They do not cover the screens; see docs/TEST_PLAN.md for the manual and browser checks.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = mkdtempSync(path.join(os.tmpdir(), 'roomrelay-logic-'))
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc')

const sources = [
    'domain/readiness.ts',
    'domain/selectors.ts',
    'domain/validation.ts',
    'domain/handoff.ts',
    'domain/actions.ts',
    'domain/progress.ts',
    'domain/scope.ts',
    'domain/permissions.ts',
    'app/routes.ts',
    'data/mockData.ts',
].map((f) => path.join(root, 'src', 'client', f))

function finish(code) {
    rmSync(outDir, { recursive: true, force: true })
    process.exit(code)
}

console.log('Compiling the logic files (strict mode)...')
const compile = spawnSync(
    process.execPath,
    [
        tsc,
        ...sources,
        '--outDir', outDir,
        '--rootDir', path.join(root, 'src', 'client'),
        '--module', 'commonjs',
        '--moduleResolution', 'node10',
        '--target', 'es2022',
        '--strict',
        '--skipLibCheck',
        '--jsx', 'react-jsx', // some logic files import types from .tsx files, so the compiler must be able to read them
        '--esModuleInterop',
    ],
    { cwd: root, encoding: 'utf8' }
)

if (compile.status !== 0) {
    console.error(compile.stdout || compile.stderr)
    console.error('\nThe logic files did not compile, so the tests were not run.')
    finish(1)
}

const run = spawnSync(process.execPath, ['--test', path.join(root, 'tests', 'logic.test.cjs')], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ROOMRELAY_LOGIC_DIR: outDir },
})

finish(run.status ?? 1)
