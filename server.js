require('dotenv').config()
const express = require('express')
const { Server } = require('socket.io')
const config = require('config')
const path = require('path')
const http = require('http')
const { version, validate, v4 } = require('uuid')

const PORT = process.env.PORT ?? config.get('PORT')
// const WS_PORT = process.env.WS_PORT ?? config.get('WS_PORT');
const staticPath = path.join(__dirname, 'src')

const app = express()
app.use(express.static(staticPath))
const server = http.createServer(app)
const io = new Server(server)

function getRooms () {
  return Array.from(io.sockets.adapter.rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4)
}

function getSocketRooms (socket) {
  return Array.from(socket.rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4)
}

io.on('connection', socket => {
  console.log(`connect ${socket.id}`)

  socket.emit('myId', { id: socket.id })

  socket.on('create', () => {
    const roomId = v4()
    socket.join(roomId)
    socket.emit('createSuccess', { id: roomId })
  })

  socket.on('join', ({ roomId, name }) => {
    const rooms = getRooms()

    if (!rooms.includes(roomId)) {
      socket.emit('message', { message: `Room with id \`${roomId}\` not found!` })
      return
    }

    const roomClients = Array.from(io.sockets.adapter.rooms.get(roomId).keys())

    if (roomClients.includes(socket.id)) {
      socket.emit('message', { message: 'You already join to this room' })
      return
    }

    socket.join(roomId)
    socket.emit('joinSuccess', { roomClients: [...roomClients, socket.id] })
    socket.to(roomId).emit('joinSuccess', { roomClients: [...roomClients, socket.id] })
  })

  socket.on('write', ({ text, name }) => {
    const rooms = getSocketRooms(socket)

    if (!rooms.length) {
      console.log('no rooms to send')
      return
    }

    const room = io.sockets.adapter.rooms.get(rooms[0])

    if (!room) {
      console.log(`Room ${rooms[0]} not found!`)
      return
    }

    socket.to(rooms[0]).emit('write', { text, name, id: socket.id })
  })

  socket.on('disconnect', () => {
    console.log(`disconnect ${socket.id}`)
  })
})

server.listen(PORT)
