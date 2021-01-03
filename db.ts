import { Client } from "https://deno.land/x/mysql/mod.ts"

export interface User {
  id: number,
  token?: string
}

const DATABASE = ''

export const TABLE = {
	USER: "user"
}

const client = await new Client()
client.connect({
  hostname: "127.0.0.1",
  username: "your db username",
  password: "your db password",
  db: "",
});

const run = async () => {
  await client.execute(`CREATE DATABASE IF NOT EXISTS ${DATABASE}`)
	await client.execute(`USE ${DATABASE}`)
	
	await client.execute(`DROP TABLE IF EXISTS ${TABLE.USER}`)

	await client.execute(`
		CREATE TABLE ${TABLE.USER} (id int(11) NOT NULL AUTO_INCREMENT, token varchar(100) NOT NULL, lastupdated varchar(100), PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8;
	`)
}
run()

export default client
