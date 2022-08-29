
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import { console } from "retro/utils/Tools"
import { isNumber } from "lodash-es"

export class WebSocketAgent extends Component {
    time_correction: number
    reconnect_on_close: boolean = true
    reconnect_timeout: number = 1000
    reconnect_timeout_mul: number = 1
    host: string = ""
    auto_connect_on_create: boolean = false
    auto_connect_on_start: boolean = true
    response_format: string = "json"
    on_after_reconnect: Function
    /**private */
    protected socket: WebSocket = undefined
    protected conn_resolve: (p: void) => void
    protected conn_reject: (p: void) => void
    protected conn_close_resolve: (p: void) => void
    protected conn_close_reject: (p: void) => void
    protected connection_opened: Boolean = false
    protected messages_history: any[] = []
    protected max_messages_history_length = 100

    constructor(params: any) {
        super(params);
        this.handle_socket_open = this.handle_socket_open.bind(this)
        this.handle_socket_message = this.handle_socket_message.bind(this)
        this.handle_socket_close = this.handle_socket_close.bind(this)
        this.handle_socket_error = this.handle_socket_error.bind(this)
    }
    public override on_create(): void {
        if (this.auto_connect_on_create && !this.auto_connect_on_start) {
            this.make_connection()
        }
    }
    public override async on_destroy(): Promise<void> {
        this.reconnect_on_close = false
        this.close_connection()
    }
    public override on_start(): void {
        if (this.auto_connect_on_start && !this.auto_connect_on_create) {
            this.make_connection()
        }
    }
    public override on_tick(time_data: IRetroObjectTimeData) { }
    public async start(): Promise<void> {
        await this.make_connection()
    }
    protected correct_time(date): void {
        if (isNumber(date)) {
            let local_now: number = +new Date
            let delta: number = local_now - date
            console.log(local_now, date, delta)
            this.time_correction = delta
            this.log(`time delta: ${delta}`)
        } else {

        }
    }
    public async make_connection(): Promise<void> {
        if (this.connection_opened === true) {
            this.log(`closing existing opened connection`, this.socket)
            await this.close_connection()
        }
        if (this.host === undefined || this.host === "") {
            this.error(`unabled to make connected - no host provided`, this)
            return
        }
        return new Promise((resolve, reject) => {
            if (this.conn_reject) {
                this.conn_reject()
            }

            this.conn_reject = reject
            this.conn_resolve = resolve
            let socket: WebSocket = this.socket = new WebSocket(this.host)
            socket.onopen = this.handle_socket_open
            socket.onmessage = this.handle_socket_message
            socket.onclose = this.handle_socket_close
            socket.onerror = this.handle_socket_error
        })
    }
    protected async close_connection(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.conn_close_resolve = resolve
            this.conn_close_reject = reject
            this.socket.close()
            this.socket = undefined
        })
    }
    public send(data) {
        this.log(`sengind data to ${this.host}`)
        this.socket.send(JSON.stringify(data))
    }
    protected handle_socket_open(event: MessageEvent): void {
        this.connection_opened = true
        this.reconnect_timeout_mul = 1
        if (this.conn_resolve) {
            this.conn_resolve()
            this.conn_resolve = this.conn_reject = undefined
        }
        this.log(`socket opened`, event)
        this.call_inside("handle_socket_open_event", {
            agent: this,
            event: event,
            data: event.data
        })
    }
    protected handle_socket_message(event: MessageEvent): void {
        this.log(`socket message`, event)
        let data: any = event.data
        switch (this.response_format) {
            case "json": {
                data = JSON.parse(data as string)
                break
            }
        }
        this.call_inside("handle_socket_message_event", {
            agent: this,
            event: event,
            data: data
        })
        this.messages_history.push(data)
        this.messages_history = this.messages_history.slice(Math.max(0, this.messages_history.length - this.max_messages_history_length), this.messages_history.length)
    }
    protected handle_socket_close(event: CloseEvent): void {
        if (this.conn_close_resolve) {
            this.conn_close_resolve()
            delete this.conn_close_resolve
            delete this.conn_close_reject
        }
        this.connection_opened = false
        this.error(`socket close`, event)
        if (this.reconnect_on_close) {
            this.log(`reconnection in ${this.reconnect_timeout * this.reconnect_timeout_mul}ms`)
            setTimeout(async () => {
                await this.make_connection()
                if (this.tools.type.is_function(this.on_after_reconnect)) {
                    this.on_after_reconnect()
                }
            }, this.reconnect_timeout * this.reconnect_timeout_mul)
        }
        this.call_inside("handle_socket_close_event", {
            agent: this,
            event: event
        })
        this.reconnect_timeout_mul++
    }
    protected handle_socket_error(event: ErrorEvent): void {
        this.error(`socket error`, event)
        this.reconnect_timeout_mul++

        this.call_inside("handle_socket_error_event", {
            agent: this,
            event: event
        })
    }
}