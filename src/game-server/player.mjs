import {Task} from './task.mjs'

export class Player {
    
    /**
     * @param {String} name 
     * @param {WebSocket} ws 
     */
    constructor(name, ws, id) {
        // Not gameplay related attributes
        this.name = name
        this.ws = ws
        this.id = id
        this.online = true // Is the player online ?

        // Gameplay related attributes
        this.resetPlayer()
    }

    resetPlayer() {
        this.alive = true
        this.impostor = false
        this.tasks = []
    }

    // Websocket related functions
    /**
     * Send the role to the client
     */
    sendRole() {
        let role = "crewmate"
        if(this.impostor) {
            role = "impostor"
        }
        this.ws.send(JSON.stringify({
            "type": "playerRole",
            "role": role
        }))
    }

    /**
     * Function which populate the tasks of the player
     * @param {Task[]} all tasks available
     */
    generateTasks(tasks) {
        
    }
}