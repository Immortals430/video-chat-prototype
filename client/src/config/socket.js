import { io } from "socket.io-client"

const url = "https://wgmh91fz-3000.inc1.devtunnels.ms"

export const socket = io(url)