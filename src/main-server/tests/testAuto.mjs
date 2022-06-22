import { WebSocket } from "ws";

// Setup
let ws1 = new WebSocket("ws://localhost:8080")
let ws2 = new WebSocket("ws://localhost:8080")
let name1 = "owner"
let name2 = "joiner"

ws1.on("message", (server)=>{
    server = JSON.parse(server)
    if(server.type == "startGame") {
        transit(ws1, name1, server.port)
    }  else if(server.type === "lobbyCreated") {
        ws2.send(JSON.stringify({
            "type": "joinLobby",
            "playerName": name2,
            "lobbyID": server.lobbyID
        }))
    }
    process.stdout.write("owner: ")
    console.log(server)
})

ws2.on("message", (server)=>{
    server = JSON.parse(server)
    if(server.type == "startGame") {
        transit(ws2, name2, server.port)
    } else if(server.type === "lobbyJoinSuccess") {
        ws1.send(JSON.stringify({
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
    }
    process.stdout.write("joiner: ")
    console.log(server)
})

function transit(ws, name, port) {
    ws.close()
    ws = new WebSocket(`ws://localhost:${port}`)
    
    ws.on("message", (server)=>{
        server = JSON.parse(server)
        console.log(server)
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

ws1.on("open", ()=>{
    ws1.send(JSON.stringify({
        "type": "createLobby",
        "playerName": name1
    }))
})



