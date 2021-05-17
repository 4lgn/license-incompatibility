import express from 'express'
import multer from 'multer'
import { insertAndFindIncompatibilities } from './db/insertProject'
import NPMParser from './parsers/NPMParser'
import Parser from './parsers/Parser'
import driver from './db/driver'
import { SERVER_PORT } from './constants'
import cors from 'cors'
import ParserFactory from './parsers/ParserFactory'
import { Socket } from 'socket.io'
const http = require('http')
const socketIo = require('socket.io')

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const app = express()
app.use(cors())
app.use(express.json())
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const sockets: any = {}

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('connectInit', sessionId => {
    sockets[sessionId] = socket.id
    app.set('sockets', sockets)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})

app.post('/parserino', upload.single('pm'), async (req, res) => {
  let parser: Parser

  try {
    parser = new ParserFactory().createParser(req.file.originalname)
  } catch (e) {
    console.error(e)
    res.send({ error: e })
    return
  }

  const socketId = sockets[req.body.sessionId]
  const socketInstance = io.to(socketId)
  socketInstance.emit('progress', 'Processing...')

  try {
    const parsedProject = await parser.parse(req.file.buffer)
    console.log('parsed project:')
    console.log(parsedProject)
    const incompatibilities = await insertAndFindIncompatibilities(
      driver,
      'neo4j',
      parsedProject,
      JSON.parse(req.body.licenseIncompatabilities),
      socketInstance
    )
    console.log('found incomp:')
    console.log(incompatibilities)
    res.json({ incompatibilities })
  } catch (e) {
    console.log(e)
    res.json({ error: 'Failed' })
  }
})

server.listen(SERVER_PORT, () => {
  console.log('Listening on port ' + SERVER_PORT)
})
