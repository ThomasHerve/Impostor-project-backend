// This module detect if  we are in production or development, and deploy games
import { WebSocketServer, WebSocket } from 'ws';
import { Game } from '../game-server/main.mjs'

let devel = false
if(process.argv.includes("devel")) {
    devel = true // We are on the developer computer 
    log("We are in devel context")
}

const wss = new WebSocketServer({
    port: 8081
})
log("Started")

wss.on('connection', (ws)=>{
    // Clients cannot connect to this websocket (we don't open 8081 on AWS), we are sure the messages are from our agents and are safe
    ws.on('message', (data)=>{
        data = JSON.parse(data)
        if(data.command === "create") {
            let port = spawnGame(data.parameters)
            ws.send(JSON.stringify({
                "port": port
            }))
            // connect to game
            const gameWs = new WebSocket("ws://localhost:" + port)
            // Wait for websocket to open
            gameWs.on("open", ()=>{
                gameWs.send(JSON.stringify({
                    "spawner": true,
                    "parameters": data.parameters
                }))
            })
            gameWs.on("close",()=>{
                removeGame(port)
            })
        }
    })
})

//**********************    DATA   ***************************/

let portsAvailables = initPorts()
let portsTaken = new Set()


//********************** FUNCTIONS ***************************/

/**
 * Initialize all the available ports
 * @returns Array<number>
 */
function initPorts() {
    let ports = []
    for(let i = 4000; i <= 8000; i++) {
        ports.push(i)
    }
    return ports
}

/**
 * Function which take a port from the list of the availables ones
 * @returns number
 */
function takePort() {
    let port = portsAvailables.pop()
    // /!\ we cannot have more than 4000 games simultaneously, this shouldn't happend i guess
    portsTaken.add(port)
    return port
}


/**
 * Function which put a port back in the available ones
 * @param {number} portNumber 
 */
function freePort(portNumber) {
    portsTaken.remove(portNumber)
    ports.push(portNumber)
}

//******************* SPAWN GAME **************/

/**
 * Function to call to spawn a game
 */
function spawnGame() {
    let port = takePort()
    if(devel) {
        spawnGameDevel(port)
    } else {
        spawnGameProd(port)
    }
    return port
}

function spawnGameDevel(port) {
    new Game(port)
}

function spawnGameProd(port) {
    // TODO
}

//****************** REMOVE GAME *************/

/**
 * Function to call to remove a game spawned on a given port
 * @param {number} portNumber 
 */
function removeGame(portNumber) {
    freePort(portNumber)
    if(devel) {
        removeGameDevel(portNumber)
    } else {
        removeGameProd(portNumber)
    }
}

function removeGameDevel() {
    freePort()
}

function removeGameProd() {
    // TODO
}

//******************* HEALTHCHECK **************/

// TODO => each minute check if our ongoing games are alive


//*******************     LOGS    **************/

function log(text) {
    console.log(`Spawner: ${text}`)
}