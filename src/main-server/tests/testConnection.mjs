import { WebSocket } from "ws";
import * as readline  from "readline";

// Setup
const ws = new WebSocket("ws://localhost:8080")

// React to server
ws.on("message", (server)=>{
    server = JSON.parse(server)
    console.log(server)
    question()
})

// Start
ws.on("open", ()=>{
    question()
})

ws.on('close', ()=>{
    console.log("Server died, quitting...")
    process.exit()
})

// input
const r = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// question
function question() {
    r.question('$#', value => {
        if(value === "help") {
            console.log("'Create': create lobby")
            console.log("'Join <id>': join lobby")
            console.log("'Leave': leave lobby")
            console.log("'Launch': launch the game")
            question()
        } else if(value.startsWith("Create")) {
            ws.send(JSON.stringify({
                "type": "createLobby",
                "playerName": "testPlayerCreate"
            }))    
        } else if(value.startsWith("Join")) {
            if(value.split(" ").length < 2) {
                console.log("Error: need a room id")
                question()
            } else {
                ws.send(JSON.stringify({
                    "type": "joinLobby",
                    "playerName": "testPlayerJoin",
                    "lobbyID": value.split(" ")[1]
                }))
            }
        } else if(value.startsWith("Leave")) {
            console.log("OK")
            ws.send(JSON.stringify({
                "type": "leaveLobby",
            }))    
        } else {
            console.log("Unknown command")
        }
    });
}
