class Task {
    constructor(params) {
        this.ticks = 0
        for (let k in params) {
            this[k] = params[k]
        }
    }
    get progress() {
        if (this.end_date < 0) return 1
        return (+new Date() - this.start_date) / (this.end_date - this.start_date)
    }
    start() {
        this.start_date = +new Date()
        if (typeof this.task_duration === 'number' && this.task_duration > 0) {
            this.end_date = this.start_date + ((this.task_duration) * 1000)
        } else {
            this.end_date = -1
        }
        this.finished = false
        if (this.handle.start) {
            this.handle.start(this)
        }
    }
    update() {
        this.ticks++
        if (this.handle.update) {
            this.handle.update(this)
        }
        if (this.progress >= 1) {
            this.end()
        }
    }
    end() {
        this.finished = true
        if (this.handle.end) {
            this.handle.end(this)
        }
    }
}
class TaskScheduler {
    constructor(tasks) {
        this.queues = tasks || []
        this._last = []
        this._first = []
        this.active_tasks = {}
    }
    on_tick() {
        let is_first = false
        let is_generic = false
        let is_last = false
        {
            let queue = this._first
            let k = '_first'
            if (this.active_tasks[k] !== undefined) {
                if (this.active_tasks[k].finished) {
                    this.active_tasks[k] = undefined
                } else {
                    is_first = true
                    this.active_tasks[k].update()
                }
            }
            if (this.active_tasks[k] === undefined && queue.length > 0) {
                let task = queue.shift()
                this.active_tasks[k] = task
                task.start()
                task.update()
                is_first = true
            }
        }
        if (!is_first) {
            this.queues.forEach((queue, k) => {
                if (this.active_tasks[k] !== undefined) {
                    if (this.active_tasks[k].finished) {
                        this.active_tasks[k] = undefined
                    } else {
                        is_generic = true
                        this.active_tasks[k].update()
                    }
                }
                if (this.active_tasks[k] === undefined && queue.length > 0) {
                    let task = queue.shift()
                    this.active_tasks[k] = task
                    task.start()
                    task.update()
                    is_generic = true
                }
            })
            this.queues = this.queues.filter(queue => queue.length > 0)
        }
        if (!is_first && !is_generic) {
            let queue = this._last
            let k = '_last'
            if (this.active_tasks[k] !== undefined) {
                if (this.active_tasks[k].finished) {
                    this.active_tasks[k] = undefined
                } else {
                    is_last = true
                    this.active_tasks[k].update()
                }
            }
            if (this.active_tasks[k] === undefined && queue.length > 0) {
                let task = queue.shift()
                this.active_tasks[k] = task
                is_last = true
                task.start()
                task.update()
            }
        }
    }
    add(queue_name, task) {
        let queue = []
        if (queue_name === '_first') {
            queue = this._first
        } else if (queue_name === '_last') {
            queue = this._last
        } else {
            this.queues[queue_name] = this.queues[queue_name] || []
            queue = this.queues[queue_name]
        }
        task = new Task(task)
        if (task.id) {
            for (let a = 0; a < queue.length; a++) {
                if (queue[a].id === task.id) {
                    queue.splice(a, 1)
                }
            }
        }
        queue.push(new Task(task))
    }
}

export { Task, TaskScheduler }