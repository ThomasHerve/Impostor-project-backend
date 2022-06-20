// This module detect if  we are in production or development, and deploy games
import { WebSocketServer, WebSocket } from 'ws';

let devel = false
if(process.argv.includes("devel")) {
    devel = true // We are on the developer computer 
}

const wss = new WebSocketServer({
    port: 8081
})
console.log("Spawner started")

wss.on('connection', (ws)=>{
    // Clients cannot connect to this websocket (we don't open 8081 on AWS), we are sure the messages are from our agents and are safe
    ws.on('message', (data)=>{

    })
})

//**********************    DATA   ***************************/

let portsAvailables = getPorts()
let portsTaken = new Set()


//********************** FUNCTIONS ***************************/

function getPorts() {
    let ports = []
    for(let i = 4000; i <= 8000; i++) {
        ports.push(i)
    }
    return ports
}


function takePort() {
    let port = portsAvailables.pop()
    // /!\ we cannot have more than 4000 games simultaneously, this shouldn't happend i guess
    portsTaken.add(port)
}

function freePort(portNumber) {
    portsTaken.remove(portNumber)
    ports.push(portNumber)
}


function spawnGame() {

}

function removeGame() {

}

//******************* HEALTHCHECK **************/

// TODO => each minute check if our ongoing games are alive


