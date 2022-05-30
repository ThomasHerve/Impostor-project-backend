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

        this.tasks =[]
        this.numTasks = 0

        // Gameplay related attributes
        this.resetPlayer()
    }

    resetPlayer() {
        this.alive = true
        this.impostor = false
        this.tasks = []
    }

    /**
     * Method which populate the tasks of the player
     * @param {Task[]} tasks all tasks available
     * @param {number} numTasks the number of tasks to do
     */
     generateTasks(tasks, numTasks) {
        this.numTasks = numTasks
        let lastTask = undefined
        for(let i = 0; i < this.numTasks; i++) {
            let randomtask = tasks[Math.floor(Math.random() * tasks.length)]
            while(randomtask == lastTask) {
                randomtask = tasks[Math.floor(Math.random() * tasks.length)]
            }
            this.tasks.push(randomtask)
            lastTask = randomtask
        }
    }

    // Websocket related Method
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
     * Method to call to tell the player the next task to do
     */
    sendNextTask() {
        if(this.tasks.length === 0) {
            this.ws.send(JSON.stringify({
                "type": "allTasksDone",
            }))
        } else {
            let task = this.tasks.shift()
            this.ws.send(JSON.stringify({
                "type": "nextTask",
                "id": task.id,
                "name": task.name
            }))
        }
    }
}