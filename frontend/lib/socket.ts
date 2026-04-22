import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function joinRoom(room: string) {
  getSocket().emit('join', room)
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
