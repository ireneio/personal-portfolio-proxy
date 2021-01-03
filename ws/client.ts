import { WebSocket } from "https://deno.land/x/websocket@v0.0.5/mod.ts"
import { WS_ENDPONT } from '../server.ts'

export let data: string

const ws: WebSocket = new WebSocket(WS_ENDPONT)
ws.on("open", function() {
  console.log("ws connected!")
})
ws.on("message", function (message: string) {
  data = JSON.parse(message)
})
ws.send("something")