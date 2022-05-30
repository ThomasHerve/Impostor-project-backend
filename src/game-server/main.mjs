import { Lobby } from '../main-server/lobby.mjs'
import { Player } from './player.mjs'
import {Task} from './task.mjs'
const makeId = Lobby().makeId


/**
 * 
 * PARAMETERS OF A GAME CURRENTLY AVAILABLES:
 * numberOfImpostors (Mandatory): the number of impostors 
 * tasks (Mandatory): the tasks, Array<id, name, nature> (nature: task / sabotage)
 * numTasks (Optional): number of tasks per crewmate, 10 by default
 */

// ********************* DATA STRUCTURES ********************

const gameMap = {} // GameID -> Game
const playerMap = {} // PlayerID -> GameID

// ********************* PUBLIC CLASSES *******************

class Game {

    /**
     * The Game constructor
     * @param {Object} parameters object containing the parameters (See above for more details)
     * @param {*} endGameCallback Function which unregister one player, to call on all player when game is over
     */
    constructor(parameters, endGameCallback) {
        // Attributes
        this.endGameCallback = endGameCallback
        this.parameters = parameters
        this.id = makeId(5)
        this.players = {}
        this.tasks = this.createTasks(parameters)
        this.numTasks = Number.isFinite(parameters["numTasks"]) ? parameters["numTasks"] : 10

        while(this.id in gameMap) {
            this.id = makeId(5)
        }
        gameMap[this.id] = this
    }

    // External functions, Which means they are called by the outside (lobby management, player disconnecting/reconnecting)
    /**
     * Add a player to the game
     * @param {Object} player 
     */
    addPlayer(player) {
        this.players[player.id] = new Player(player.name, player.ws, player.id)
        playerMap[player.id] = this.id
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

    /**
     * Function to handle commands from users
     * @param {Object} data 
     * @param {WebSocket} id
     */
    handleMessage(data, id) {
        let ws = this.players[id].ws



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
        for(let player in this.players) {
            delete playerMap[player.id]
            this.endGameCallback(player.id)
        }
        delete gameMap[this.id]
        console.log(`Game ${this.id} ended`)
    }
}


// Entrypoint for server
function handleMessage(data, id) {
    if(data.gameID != undefined && data.gameID in gameMap) {
        gameMap[data.gameID].handleMessage(data, id)
    }
}

/**
 * Function to create a new game
 * @param {Function} endGameCallback
 * @returns {Game}
 */
function createGame(endGameCallback) {
    return new Game(endGameCallback)
}

/**
 * Function to handle a player which broke the connection with the server
 * @param {String} id the id of the player that broke the connection
 */
function handleLeave(id) {
    if(id in playerMap && playerMap[id] in gameMap) {
        gameMap[playerMap[id]].playerLeaved(id)
    }
}

/**
 * Function to handle the reconnection of a player that leaved a game
 * @param {String} id playerID
 * @param {*} ws the new websocket of the player
 */
function handleReconnect(id, ws) {
    if(id in playerMap && playerMap[id] in gameMap) {
        gameMap[playerMap[id]].playerReconnect(id, ws)
    }
}

function checkGameValid(parameters, ownerID, playersID) {
    let n = playersID.length + 1
    if(n < 4) {
        return false
    }
    if(parameters.numberOfImpostors < 1) {
        return false
    }
    // At least 4 tasks
    if(parameters.tasks.length < 4) {
        return false
    }
    // Check tasks are correct
    parameters.tasks.forEach((task)=>{
        if(task.length != 2) {
            return false
        }
    })
    return true
}

export function GameInterface() {
    return {
        'createGame': createGame,
        'handleMessage': handleMessage,
        'handleLeave':handleLeave,
        'handleReconnect':handleReconnect,
        'checkGameValid': checkGameValid
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