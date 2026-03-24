#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process"
import { createServer } from "node:net"

const host = process.env.HOST ?? "0.0.0.0"
const requestedPort = Number.parseInt(process.env.PORT ?? "3000", 10)
const maxAttempts = 100

function isPortOpen(hostname, port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.unref()

    server.once("error", () => {
      resolve(false)
    })

    server.listen({ host: hostname, port }, () => {
      server.close(() => resolve(true))
    })
  })
}

async function findOpenPort(startPort) {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    if (await isPortOpen(host, port)) {
      return port
    }
  }

  throw new Error(
    `Unable to find an open port between ${startPort} and ${startPort + maxAttempts - 1}.`,
  )
}

function getTailnetIp() {
  const result = spawnSync("tailscale", ["ip", "-4"], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  })

  if (result.status !== 0) {
    return null
  }

  const ip = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  return ip ?? null
}

const port = await findOpenPort(requestedPort)
const tailnetIp = getTailnetIp()

if (port !== requestedPort) {
  console.log(
    `Port ${requestedPort} is busy, using ${port} instead. Set PORT to override the start point.`,
  )
}

console.log(`Starting Next.js on http://localhost:${port}`)
console.log(`LAN URL:  http://${host}:${port}`)

if (tailnetIp) {
  console.log(`Tailnet:  http://${tailnetIp}:${port}`)
}

const child = spawn(
  "next",
  ["dev", "--hostname", host, "--port", String(port)],
  {
    env: process.env,
    stdio: "inherit",
  },
)

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

