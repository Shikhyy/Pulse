import { Server } from 'socket.io'
import { createServer } from 'http'

let io: Server

export function initSocket(httpServer: ReturnType<typeof createServer>) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    // Worker/Employer join their private room
    socket.on('join', (room: string) => {
      socket.join(room)
      console.log(`[Socket] ${socket.id} joined room: ${room}`)
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}
