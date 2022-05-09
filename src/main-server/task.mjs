class Task {
    constructor(id) {
        this.id = id
    }
}

export function TaskInterface() {
    return {
        'Task': Task,
    }
}
