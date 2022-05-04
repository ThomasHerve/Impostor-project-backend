import { WebSocket } from "ws";

// Setup
const ws = new WebSocket("ws://localhost:8080")

// React to server
ws.on("message", (server)=>{
    server = JSON.parse(server)
    console.log(server)
})

// Start
ws.on("open", ()=>{
    ws.send(JSON.stringify({
        "type": "createLobby",
        "playerName": "testPlayer"
    }))    
})
