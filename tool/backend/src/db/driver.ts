import neo4j from 'neo4j-driver'
import { DB_PASS, DB_PORT } from '../constants'

const driver = neo4j.driver(
  'bolt://localhost:' + DB_PORT,
  neo4j.auth.basic('neo4j', DB_PASS)
)

export default driver
