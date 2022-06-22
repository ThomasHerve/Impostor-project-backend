import { WebSocket } from "ws";
import * as readline  from "readline";

// Setup
let ws = new WebSocket("ws://localhost:8080")


// Args
let name = undefined
if(process.argv.length >= 3) {
    name = process.argv[2]
}


// React to server
ws.on("message", (server)=>{
    server = JSON.parse(server)
    if(server.type == "startGame") {
        console.log(server)
        startGame(server.port)
    } else {
        console.log(server)
        question()
    }
})

// Game
function startGame(port) {
    ingame = true
    ws.close()
    ws = new WebSocket(`ws://localhost:${port}`)
    
    ws.on("message", (server)=>{
        server = JSON.parse(server)
        console.log(server)
        question()
    })
    ws.on('close', ()=>{
        console.log("Game server died, quitting...")
        process.exit()
    })
    if(name === undefined) {
        name = "Player"
    }
    ws.on("open", ()=>{
        ws.send(JSON.stringify({
            "type": "connect",
            "playerName": name
        }))
    })
}

// Start
ws.on("open", ()=>{
    question()
})

ws.on('close', ()=>{
    if(!ingame) {
        console.log("Server died, quitting...")
        process.exit()
    }
})

// input
const r = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


let ingame = false

// question
function question() {
    r.question('$#', value => {
        if(!ingame) {
            if(value === "help") {
                console.log("'Create': create lobby")
                console.log("'Join <id>': join lobby")
                console.log("'Leave': leave lobby")
                console.log("'Launch': launch the game")
                question()
            } else if(value.startsWith("Create") || value.startsWith("create") || value === "c") {
                let obj = {
                    "type": "createLobby",
                }
                if(name != undefined) {
                    obj.playerName = name
                }
                ws.send(JSON.stringify(obj))
            } else if(value.startsWith("Join") || value.startsWith("join") || (value.startsWith("j") && value.split(" ")[0] === "j")) {
                if(value.split(" ").length < 2) {
                    console.log("Error: need a room id")
                    question()
                } else {
                    let obj = {
                        "type": "joinLobby",
                        "lobbyID": value.split(" ")[1]
                    }
                    if(name != undefined) {
                        obj.playerName = name
                    }
                    ws.send(JSON.stringify(obj))
                }
            } else if(value.startsWith("Leave") || value.startsWith("leave") || value === "le") {
                ws.send(JSON.stringify({
                    "type": "leaveLobby",
                }))
            } else if(value.startsWith("Launch") || value.startsWith("launch") || value === "l") {
                ws.send(JSON.stringify({
                    "type": "launchGame",
                    "numberOfImpostors": 1,
                    "tasks": [
                        {
                            id: 1,
                            name: "A",
                            nature: "task"
                        },
                        {
                            id: 2,
                            name: "B",
                            nature: "task"
                        },
                        {
                            id: 3,
                            name: "C",
                            nature: "task"
                        },
                        {
                            id: 4,
                            name: "OXYGEN",
                            nature: "sabotage"
                        },
                        {
                            id: 5,
                            name: "D",
                            nature: "task"
                        },
                    ]
                }))
            } else if(value.startsWith("ChangeName") || value.startsWith("changename") || value === "cn") {
                name = value.split(" ")[1]
                ws.send(JSON.stringify({
                    "type": "changeName",
                    "playerName": name
                }))
                question() 
            } else if(value.startsWith("exit")) {
                ws.close()
            } 
            else {
                console.log("Unknown command")
                question()
            }
        } else {
            if(value === "help") {
                console.log("TODO")
                question()
            } else if(value.startsWith("exit")) {
                ws.close()
            }
        }
    });
}
