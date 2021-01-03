import { WebSocket, WebSocketServer } from "https://deno.land/x/websocket@v0.0.5/mod.ts"
import { data } from './client.ts'
import { WS_SERVER_PORT } from '../server.ts'

export function init() {
  let interval: any
  const wss = new WebSocketServer(WS_SERVER_PORT)
  wss.on('connection', function (ws: WebSocket) {
    ws.on('message', function (message: string) {
      console.log('[WS Server] Message Received: ' + message)
      ws.send(message)
    })

    interval = setInterval(() => {
      ws.send(JSON.stringify(data))
      console.log('[WS Server] Data sent: ' + JSON.stringify(data))
    }, 1000)

    ws.on('close', function(ws: WebSocket) {
      interval = null
      console.log('[WS Server] Coneection closed.')
    })
  })
}
