import { WebSocket } from "ws";

// Setup
const ws = new WebSocket("ws://localhost:8080")

// React to server
ws.on("message", (server)=>{
    
    console.log(server)
})

// Start
ws.on("open", ()=>{
    ws.send(JSON.stringify({
        "type": "createLobby",
        "playerName": "testPlayer"
    }), (error)=>{console.log("server down :(")})    
})
