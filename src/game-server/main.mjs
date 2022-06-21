import { Player } from './player.mjs'
import {Task} from './task.mjs'
import { WebSocketServer } from 'ws';
import { Lobby } from '../main-server/lobby.mjs'
const lobby = Lobby()

/**
 * 
 * PARAMETERS OF A GAME CURRENTLY AVAILABLES:
 * numberOfImpostors (Mandatory): the number of impostors 
 * tasks (Mandatory): the tasks, Array<id, name, nature> (nature: task / sabotage)
 * numTasks (Optional): number of tasks per crewmate, 10 by default
 */


// ********************* PUBLIC CLASSES *******************

export class Game {

    /**
     * The Game constructor
     * Initialize the listening websocket
     */
    constructor(port) {
        let initialized = false
        this.players = {}
        this.port = port
        this.playersIDSet = new Set()
        this.wss = new WebSocketServer({
            port: port
        })
        
        let numberOfPlayers = 0
        let totalPlayers = undefined
        this.wss.on('connection', (ws)=>{
            // Clients cannot connect to this websocket (we don't open 8081 on AWS), we are sure the messages are from our agents and are safe
            ws.on('message', (data)=>{
                data = JSON.parse(data)
                if(initialized) {
                    // The game is running, for e better code comprehension the behaviour is defined bellow
                    handleMessage(data, ws)
                } else  {
                    // Manage to get all the players
                    if(data.spawner != undefined) {
                        // We get the number of players + the parameters
                        this.setParameters(data.parameters)
                        totalPlayers = data.parameters.numPlayers
                        this.log(`Spawner send that we have ${totalPlayers} players`)
                    } else if(data.type === "connect" && data.playerName != undefined) {
                        this.addPlayer(data.playerName, ws)
                        numberOfPlayers++
                        this.log(`We currently have ${numberOfPlayers} players`)
                    }

                    // Launch
                    if(totalPlayers != undefined && totalPlayers === numberOfPlayers) {
                        this.log(`All conditions fullfilled to start the game`)
                        initialized = true
                        this.startGame()
                    }
                } 
            })
        })
    }


    // External functions, Which means they are called by the outside (lobby management, player disconnecting/reconnecting)
    /**
     * Add a player to the game
     * @param {String} name the player to register
     * @param {WebSocket} ws the websocket of the player
     */
    addPlayer(name, ws) {
        this.log(`player ${name} joined`)
        let id = lobby.makeId(5)
        while(this.playersIDSet.has(id)) {
            id = lobby.makeId(5)
        }
        this.playersIDSet.add(id)
        this.players[id] = new Player(name, ws, id)
    }

    setParameters(parameters) {
        // Attributes
        this.parameters = parameters
        this.players = {}
        this.tasks = this.createTasks(parameters)
        this.numTasks = Number.isFinite(parameters["numTasks"]) ? parameters["numTasks"] : 10
    }

    /**
     * Function to handle commands from users
     * @param {Object} data 
     * @param {WebSocket} ws
     */
     handleMessage(data, ws) {
        // TODO HANDLE MESSAGES
        

     }
    
    /**
     * Handle a player of this particular game leaving
     * @param {String} playerID 
     */
    playerLeaved(playerID) {
        this.players[playerID].online = false
    }

    /**
     * handle the reconnection of a player
     * @param {String} playerID 
     */
    playerReconnect(playerID, ws) {
        this.players[playerID].online = true
        this.players[playerID].ws = ws
    }

    // Game functions, called from this class (excepting startGame)
    /**
     * Method to start the Game
     */
    startGame() {
        // Players are already notified that the game has began
        // We select the impostors
        this.selectImpostors()
        // We notify the players of their roles
        this.notifyPlayersRoles()
        // We populate the tasks
        this.giveTasks()
        // Send first task to all players
        this.sendFirstTaskToAllPlayers()
    }

    /**
     * Method which design the impostors among the players
     */
    selectImpostors() {
        // Security, you cannot have more than 25% of the players as impostor
        let playersID = Object.keys(this.players)
        let numberOfImpostors = Math.min(this.parameters.numberOfImpostors, Math.floor(playersID.length / 4))

        // Security against any possible infinite loop
        let maxRetry = 10000

        while(numberOfImpostors > 0) {
            let randomPlayer = playersID[Math.floor(Math.random() * playersID.length)]
            if(!this.players[randomPlayer].impostor) {
                this.players[randomPlayer].impostor = true
                numberOfImpostors--
            } else {
                maxRetry--
                if(maxRetry === 0) {
                    console.log(`Game ${this.id} was stuck in an infinite loop for impostors selection`)
                    this.end()
                }
            }
        }
    }

    /**
     * Method to call at the start of a game to notify each player of their role
     */
    notifyPlayersRoles() {
        for(let player in this.players) {
            player.sendRole()
        }
    }

    /**
     * Method to create all the tasks based on the info given by the game owner
     */
    createTasks(parameters) {
        let tasks = []
        parameters.tasks.forEach((taks_data)=>{
            tasks.push(new Task(taks_data.id, taks_data.name, taks_data.nature))
        })
        return tasks
    }

    /**
     * Method to call to generate the task pathing of each player
     */
    giveTasks() {
        for(let player in this.players) {
            player.generateTasks(this.tasks, this.numTasks)
        }
    }

    /**
     * Call this function to send the first task to do to all players
     */
    sendFirstTaskToAllPlayers() {
        for(let player in this.players) {
            player.sendNextTask()
        }
    }

    // End the game
    /**
     * Method to call to end this game
     */
    end() {
        this.wss.close()
        console.log(`Game ${this.id} ended`)
    }

    log(text) {
        console.log(`Game ${this.port}: ${text}`)
    }
}



/**
 * 
 * Send type:
 * - validTask (id)
 * - 
 * 
 * 
 * Receive type
 * - playerRole (role) 
 */