import { WebSocketServer } from 'ws';
import Lobby from './lobby.mjs'
const lobby = Lobby()


const wss = new WebSocketServer({
    port: 8080
})


wss.on('connection', (ws)=>{
    ws.on('message', (data)=>{
        
    })
})

