/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */


declare interface ITaskHandles {
    start(task: Task): void
    update(task: Task): void
    end(task: Task): void
}
declare interface IActiveTasksDict {
    [x: string]: Task
}
declare interface ITaskParams {
    finished?: boolean
    ticks?: number
    start_date?: number
    end_date?: number
    task_duration?: number
    handle?: ITaskHandles
    id?: string | number
}

export class Task {
    finished: boolean
    ticks: number
    start_date: number
    end_date: number
    task_duration: number
    handle: ITaskHandles
    id: string | number

    constructor(params: ITaskParams) {
        this.ticks = 0
        for (let k in params) {
            this[k] = params[k]
        }
    }
    get progress(): number {
        if (this.end_date < 0) return 1
        return (+new Date() - this.start_date) / (this.end_date - this.start_date)
    }
    start(): void {
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
    update(): void {
        this.ticks++
        if (this.handle.update) {
            this.handle.update(this)
        }
        if (this.progress >= 1) {
            this.end()
        }
    }
    end(): void {
        this.finished = true
        if (this.handle.end) {
            this.handle.end(this)
        }
    }
}
export class TaskScheduler {
    queues: Array<Task[]>
    _last: Task[]
    _first: Task[]
    active_tasks: IActiveTasksDict
    constructor(tasks) {
        this.queues = tasks || []
        this._last = []
        this._first = []
        this.active_tasks = {}
    }
    on_tick() {
        let is_first: boolean = false
        let is_generic: boolean = false
        let is_last: boolean = false
        {
            let queue: Task[] = this._first
            let k: string = '_first'
            if (this.active_tasks[k] !== undefined) {
                if (this.active_tasks[k].finished) {
                    this.active_tasks[k] = undefined
                } else {
                    is_first = true
                    this.active_tasks[k].update()
                }
            }
            if (this.active_tasks[k] === undefined && queue.length > 0) {
                let task: Task = queue.shift()
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
                    let task: Task = queue.shift()
                    this.active_tasks[k] = task
                    task.start()
                    task.update()
                    is_generic = true
                }
            })
            this.queues = this.queues.filter(queue => queue.length > 0)
        }
        if (!is_first && !is_generic) {
            let queue: Task[] = this._last
            let k: string = '_last'
            if (this.active_tasks[k] !== undefined) {
                if (this.active_tasks[k].finished) {
                    this.active_tasks[k] = undefined
                } else {
                    is_last = true
                    this.active_tasks[k].update()
                }
            }
            if (this.active_tasks[k] === undefined && queue.length > 0) {
                let task: Task = queue.shift()
                this.active_tasks[k] = task
                is_last = true
                task.start()
                task.update()
            }
        }
    }
    add(queue_name: string, task: Task) {
        let queue: Task[] = []
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
            for (let a: number = 0; a < queue.length; a++) {
                if (queue[a].id === task.id) {
                    queue.splice(a, 1)
                }
            }
        }
        queue.push(new Task(task))
    }
}