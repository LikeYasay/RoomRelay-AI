/**
 * Local preview of the RoomRelay AI frontend. No ServiceNow connection.
 *
 * What it does:
 *   1. Runs `npm run build` (local SDK build only; it does NOT deploy) unless you pass --no-build.
 *   2. Serves the built React bundle on http://127.0.0.1:4173 using only Node built-ins.
 *
 * Usage (from the project folder, in the VS Code terminal):
 *   node scripts/local-preview.mjs              build, then serve
 *   node scripts/local-preview.mjs --no-build   serve the existing build
 *   PORT=5000 node scripts/local-preview.mjs    use another port (PowerShell: $env:PORT=5000)
 *
 * Limits: this is NOT ServiceNow. There is no sign-in, no ACLs and no ServiceNow page
 * shell here. It only shows how the prototype looks and behaves with its synthetic data.
 * Press Ctrl+C to stop. Re-run after changing code so the bundle is rebuilt.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bundlePath = path.join(root, 'dist', 'static', 'main.jsdbx')
const host = '127.0.0.1' // local machine only; not reachable from other computers
const port = Number(process.env.PORT) || 4173

if (!process.argv.includes('--no-build')) {
    console.log('Building the app (npm run build). This does not deploy anything...')
    try {
        execSync('npm run build', { cwd: root, stdio: 'inherit' })
    } catch {
        console.error('\nThe build failed, so the preview was not started. Fix the errors above and try again.')
        process.exit(1)
    }
}

if (!existsSync(bundlePath)) {
    console.error('No build found at dist/static/main.jsdbx. Run "npm run build" first, or run this script without --no-build.')
    process.exit(1)
}

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RoomRelay AI | Local preview</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/main.js"></script>
</body>
</html>
`

// Only these two URLs are served, so no other file on disk can be requested.
const server = http.createServer((req, res) => {
    const url = (req.url ?? '/').split('?')[0]
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }

    if (url === '/' || url === '/index.html') {
        res.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' })
        res.end(page)
    } else if (url === '/main.js') {
        res.writeHead(200, { ...headers, 'Content-Type': 'text/javascript; charset=utf-8' })
        res.end(readFileSync(bundlePath))
    } else {
        res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
    }
})

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Stop the other program, or run with a different PORT.`)
    } else {
        console.error('Could not start the preview server:', err.message)
    }
    process.exit(1)
})

server.listen(port, host, () => {
    console.log(`\nRoomRelay AI local preview is running:\n  http://${host}:${port}/\n\nPress Ctrl+C to stop.`)
})
