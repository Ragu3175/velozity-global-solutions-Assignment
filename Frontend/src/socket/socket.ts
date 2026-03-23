import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: {
    token: localStorage.getItem('accessToken')
  }
})

socket.on('joinRoom', (room: string) => {
  if (socket.connected) {
    socket.emit('joinRoom', room)
  }
})

export default socket