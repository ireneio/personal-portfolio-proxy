import { Application, Router, Context } from "https://deno.land/x/oak/mod.ts"
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { config, DotenvConfig } from "https://deno.land/x/dotenv/mod.ts";
// import { create, verify } from "https://deno.land/x/djwt@$VERSION/mod.ts"

import { init as initWsServer } from './ws/server.ts'
import { init as initWsClient } from './ws/client.ts'
import { run as initDb } from './db/init.ts'

const isUseAuth = false
const isUseWs = false

const { API_URL, CORS_URL, HTTP_PORT, WS_ENDPONT: WS_EP, WS_SERVER_PORT: WS_PORT }: DotenvConfig = config()
console.log('[env] API_URL: ' + API_URL)
console.log('[env] CORS_URL: ' + CORS_URL)
console.log('[env] HTTP_PORT: ' + HTTP_PORT)
console.log('[env] WS_ENDPONT: ' + WS_EP)
console.log('[env] WS_SERVER_PORT: ' + WS_PORT)

export const WS_ENDPONT: string = WS_EP
export const WS_SERVER_PORT: number = Number(WS_PORT)

const JWT_SECRET: string = 'secret'
const JWT_CONTENT: { source: string } = { source: 'proxy-server-deno' }

async function initHttpServer(): Promise<void> {
  const app = new Application()
  const router = new Router()

  // Logger
  app.use(async(ctx: Context, next: Function) => {
    await next()
    const rt = ctx.response.headers.get("X-Response-Time")
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`)
  })

  // Set CORS Headers
  app.use(
    oakCors({
      origin: CORS_URL,
      optionsSuccessStatus: 200
    })
  )

  // fetch('https://ire1.blob.core.windows.net/personal-portfolio/static/data.json').then((res: any) => {
  //   return res.json()
  // }).then((json: any) => {
  //   console.log(json)
  // })

  interface ResponseBody {
    status?: number, 
    message?: string,
    data?: any
  }

  class HttpResponse {
    constructor(response?: ResponseBody) {
      if(response) {
        const { status, message } = response
        if(status)  this.status = status
        if(message) this.message = message
      }
    }
    
    private message: string = ''
    
    private status: number = 200

    private data: string = ''

    public setResponse(response: ResponseBody): void {
      if(response.status) this.status = Number(response.status)
      if(response.message) this.message = response.message
      if(response.data) this.data = JSON.stringify(response.data)
    }
  }

  interface RequestBody {
    authorization?: string, 
    acceptLanguage?: string, 
    timezone?: string, 
    method: string, 
    endpoint: string, 
    data: any, 
    contentType?: string
  }

  class HttpRequest {
    constructor(request: RequestBody, API_URL: string) {
      this.request = request
      this.endpoint = request.endpoint
      this.API_URL = API_URL
    }

    private request: RequestBody

    private API_URL = ''

    private endpoint: string = ''

    private headers: Headers = new Headers()

    private config: RequestInit = {
      cache: 'no-cache',
      credentials: 'same-origin',
      mode: 'cors',
      redirect: 'follow',
      referrer: 'no-referrer',
      method: '',
      headers: new Headers(),
      body:　''
    }

    private setHeadersAndBaseConfig(request: RequestBody): void {
      const { authorization, method, contentType, acceptLanguage, timezone } = request

      this.config.method = method
      if(contentType) {
        this.headers.append('content-type', contentType)
      }
      if(authorization) {
        this.headers.append('authorization', authorization)
      }
      if(acceptLanguage) {
        this.headers.append('accept-language', acceptLanguage)
      }
      if(timezone) {
        this.headers.append('timezone', timezone)
      }
      this.config.headers = this.headers
    }

    private mapData(): FormData | string {
      const { contentType, data, method } = this.request
      
      if(method === 'get' || method === 'GET') {
        return ''
      } else if(contentType === 'application/json') {
        return JSON.stringify(data)
      } else if(contentType === 'multipart/formdata') {
        const formData = new FormData()
        data.forEach((item: any) => {
          formData.append(item, data[item])
        })
        return formData
      } else {
        throw new HttpResponse({ status: 400, message: 'Request "contentType" Not Supported. JSON or Multipart/Formdata only.' })
      }
    }

    private async sendRequest(): Promise<JSON> {
      try {
        const response: Response = await fetch(`${this.API_URL}${this.endpoint}`)
        const json = await response.json()
        return json
      } catch(e) {
        throw new HttpResponse({ status: e.status, message: e.message })
      }
    }

    private async setData(): Promise<HttpResponse> {
      const response = new HttpResponse()
      try {
        const mappedData = this.mapData()
        this.config.body = mappedData
        const data = await this.sendRequest()
        response.setResponse({ status: 200, message: 'success', data })
      } catch(e) {
        response.setResponse({ status: e.status, message: e.message })
      } finally {
        return response
      }
    }

    public async init() {
      this.setHeadersAndBaseConfig(this.request)
      const result: HttpResponse = await this.setData()
      return result
    }
  }

  class IncomingRequestProcessor {
    constructor() {}

    private jwt: string = ''

    private JWT_SECRET: string = JWT_SECRET

    private async getRequestType(request: any): Promise<string> {
      const body = await request.body()
      const { type } = await body
      return type
    }

    private async getRequestBody(request: any): Promise<any> {
      const body = await request.body()
      const { value } = body
      return value
    }

    private verifyRequestType(type: string): boolean {
      return type === 'json'
    }

    public async initApiRequest(incRequest: any): Promise<HttpResponse> {
      const values: RequestBody = await this.getRequestBody(incRequest)
      
      console.log(values)
      
      if(values.method === 'get' || values.method === 'GET') {
        const request = new HttpRequest(values, API_URL)
        return await request.init()
      } else {
        const type = await this.getRequestType(incRequest)
        const isValidRequestType = this.verifyRequestType(type)
        if(isValidRequestType) {
          const request = new HttpRequest(values, API_URL)
          return await request.init()
        } else {
          return new HttpResponse({ status: 400, message: 'Body Format to the Proxy Server Is Not Accepted.' })
        }
      }

      // let values: RequestBody
      // const type = await this.getRequestType(incRequest)
      // const isValidRequestType = this.verifyRequestType(type)
    
      // if(isValidRequestType) {
      //   values = await this.getRequestBody(incRequest)
      //   const request = new HttpRequest(values, API_URL)
      //   return await request.init()
      // } else {
      //   return new HttpResponse({ status: 400, message: 'Body Format to the Proxy Server Is Not Accepted.' })
      // }
    }

    // public async initAuthRequest(): Promise<HttpResponse> {
    //   const res = new HttpResponse()
    //   try {
    //     const jwt = await create({ alg: "HS512", typ: "JWT" }, { ...JWT_CONTENT }, JWT_SECRET)
    //     this.jwt = jwt
    //     res.setResponse({ status: 200, message: 'Token Sent.', data: jwt })
    //   } catch(e) {
    //     res.setResponse({ status: 500, message: 'Server Error.' })
    //   } finally {
    //     return res
    //   }
    // }

    // public async initAuthVerificationRequest(incRequest: any): Promise<HttpResponse> {
    //   const res = new HttpResponse()
    //   const type = this.getRequestType(incRequest)
    //   const isValidRequestType = this.verifyRequestType(type)
    //   if(isValidRequestType) {
    //     try {
    //       const payload = await verify(this.jwt, "secret", "HS512")
    //       if(payload && payload.source && payload.source === this.JWT_SECRET) {
    //         res.setResponse({ status: 200, message: 'Authentication Success.' })
    //       } else {
    //         res.setResponse({ status: 401, message: 'Authentication Failed.' })
    //       }
    //     } catch(e) {
    //       res.setResponse({ status: 500, message: 'Server Error.' })
    //     } finally {
    //       return res
    //     }
    //   } else {
    //     res.setResponse({ status: 400, message: 'Body Format to the Proxy Server Is Not Accepted.' })
    //     return res
    //   }
    // }
  }

  // [api] send request
  router.post('/api', async ({ request, response }: { request: any, response: any }) => {
    const processor = new IncomingRequestProcessor()
    response.body = await processor.initApiRequest(request)
  })

  // [proxy local authentication] create token
  router.get('/auth', async ({ response }: { request: any, response: any }) => {
    const processor = new IncomingRequestProcessor()
    // response.body = await processor.initAuthRequest()
  })

  // [proxy local authentication] verify token
  router.post('/auth', async ({ request, response }: { request: any, response: any }) => {
    const processor = new IncomingRequestProcessor()
    // response.body = await processor.initAuthVerificationRequest(request)
  })

  // [server] check server health
  router.get('/health', ({ response } : { request: any, response: any }) => {
    response.body = new HttpResponse({ status: 200, message: 'Server Running!' })
  })

  app.use(router.routes())
  app.use(router.allowedMethods())
  await app.listen({ port: Number(HTTP_PORT) })
  console.log('Listening on port ', HTTP_PORT)
}

async function initApp(): Promise<boolean> {
  try {
    if(isUseAuth) {
      await initDb()
    }
    if(isUseWs) {
      initWsServer()
      initWsClient()
    }
    await initHttpServer()
    return true
  } catch(e) {
    console.log('[App] Initialization Error: ' + e.message)
    return false
  }
}

async function init() {
  try {
    const initResult = await initApp()
    if(initResult) {
      console.log('[App] Server Initialization Success.')
    } else {
      throw new Error('Http Server Halted.')
    }
  } catch(e) {
    console.log('[App] Process Halted. Error: ' + e.message)
  }
}

await init()
