import { WebSocket } from "https://deno.land/x/websocket@v0.0.5/mod.ts"
import { WS_ENDPONT } from '../server.ts'

export let data: string

export function init() {
  let ws: WebSocket = new WebSocket(WS_ENDPONT)
  ws.on('open', function() {
  console.log('[WS Client] Connected: ' + WS_ENDPONT)
  })
  ws.on('message', function (message: string) {
  data = JSON.parse(message)
  console.log('[WS Client] Data Received: ' + JSON.stringify(message))
  })
  ws.on('close', function() {
      ws = new WebSocket(WS_ENDPONT)
      console.log('[WS Client] Disconnected and Reconnecting...')
  })
}
