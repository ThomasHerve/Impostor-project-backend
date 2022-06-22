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
        this.tasksSabotage = []
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
        this.tasksSabotage = []
        let tasksNormal = []
        tasks.forEach((task)=>{
            if(task.nature == "sabotage") {
                this.tasksSabotage.push(task)
            } else {
                tasksNormal.push(task)
            }
        })
        this.numTasks = numTasks
        let lastTask = undefined
        for(let i = 0; i < this.numTasks; i++) {
            let randomtask = tasksNormal[Math.floor(Math.random() * tasksNormal.length)]
            while(randomtask == lastTask) {
                randomtask = tasksNormal[Math.floor(Math.random() * tasksNormal.length)]
            }
            this.tasks.push(randomtask)
            lastTask = randomtask
        }
    }

    /**
     * Method to hadle a task done by the player
     * @param {number} taskID
     */
    handleTaskDone(taskID) {
        if(this.tasks.length > 0 && this.tasks[0].id == taskID) {
            
            return
        } 
        let idInSabotage = false
        this.tasksSabotage.forEach((task)=>{
            if(task.id == taskID) {
                idInSabotage = true
            }
        })
        if(idInSabotage) {
            // TODO HANDLE SABOTAGE
        } else {
            // TODO HANDLE TASK
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
        console.log("Send ROLE")
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