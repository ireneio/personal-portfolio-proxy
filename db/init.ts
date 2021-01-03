import { Client } from "https://deno.land/x/mysql/mod.ts"

const DATABASE = 'jwt_auth'

export interface User {
  id?: number,
  token: string
}

export const TABLE = {
	USER: "user"
}

export const client = await new Client()
client.connect({
  hostname: "127.0.0.1",
  username: "root",
  password: "ilove69",
  db: "jwt_auth",
  poolSize: 3
})

const createTable = async (): Promise<boolean> => {
  await client.execute(`DROP TABLE IF EXISTS ${TABLE.USER}`)

	await client.execute(`
		CREATE TABLE ${TABLE.USER} (
      id int(11) NOT NULL AUTO_INCREMENT, 
      token varchar(100) NOT NULL, 
      lastupdated varchar(100), 
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `)
  return true
}

export const run = async () => {
  try {
    await client.execute(`CREATE DATABASE IF NOT EXISTS ${DATABASE}`)
    await client.execute(`USE ${DATABASE}`)
    return await createTable()
  } catch(e) {
    console.log('[DB] Creation Error: ' + e.message)
  }
}
