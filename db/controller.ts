import { client, TABLE } from './init.ts'

export const addUser = async (token: string): Promise<any> => {
  let result = await client.execute(`INSERT INTO ${TABLE.USER}(token) values(?)`, [
    token,
  ])
  console.log('[DB] Inserted: ' + result)
  return result
}

export const updateUser = async (token: string): Promise<any> => {
  let result = await client.execute(`UPDATE ${TABLE.USER} set ?? = ?`,
  [
    'token', token
  ])
  console.log('[DB] Inserted: ' + result)
  return result
}

export const getUser = async (token: string): Promise<any> => {
  let result = await client.execute(`SELECT FROM ${TABLE.USER} WHERE ?? LIKE ?`,
  [
    'token', token
  ])
  console.log('[DB] Inserted: ' + result)
  return result
}

export const deleteUser = async (token: string): Promise<any> => {
  let result = await client.execute(`DELETE FROM ${TABLE.USER} WHERE ?? LIKE ?`,
  [
    'token', token
  ])
  console.log('[DB] Deleted: ' + result)
  return result
}