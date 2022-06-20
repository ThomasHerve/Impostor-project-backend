import { Player } from './player.mjs'
import {Task} from './task.mjs'


/**
 * 
 * PARAMETERS OF A GAME CURRENTLY AVAILABLES:
 * numberOfImpostors (Mandatory): the number of impostors 
 * tasks (Mandatory): the tasks, Array<id, name, nature> (nature: task / sabotage)
 * numTasks (Optional): number of tasks per crewmate, 10 by default
 */


// ********************* PUBLIC CLASSES *******************

class Game {

    /**
     * The Game constructor
     * @param {Object} parameters object containing the parameters (See above for more details)
     */
    constructor(parameters) {
        // Attributes
        this.parameters = parameters
        this.players = {}
        this.tasks = this.createTasks(parameters)
        this.numTasks = Number.isFinite(parameters["numTasks"]) ? parameters["numTasks"] : 10
    }

    // External functions, Which means they are called by the outside (lobby management, player disconnecting/reconnecting)
    /**
     * Add a player to the game
     * @param {Object} player 
     */
    addPlayer(player) {
        this.players[player.id] = new Player(player.name, player.ws, player.id)
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
        // TODO HANDLE MESSAGES


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
        console.log(`Game ${this.id} ended`)
    }
}


// ***************** ENTRYPOINT *****************

console.log("OK IT WORKS")


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