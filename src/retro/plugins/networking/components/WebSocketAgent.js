
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset, forEach } from "lodash-es"
import Schema from "retro/utils/Schema"

class WebSocketAgent extends Component {
    reconnect_on_close = true
    reconnect_timeout = 1000
    reconnect_timeout_mul = 1
    host = ""
    auto_connect_on_create = false
    auto_connect_on_start = true
    response_format = "json"
    /**private */
    socket = undefined
    conn_resolve = undefined
    conn_reject = undefined
    conn_close_resolve = undefined
    conn_close_reject = undefined
    connection_opened = false
    messages_history = []
    max_messages_history_length = 100
    constructor() {
        super(...arguments);
        this.handle_socket_open = this.handle_socket_open.bind(this)
        this.handle_socket_message = this.handle_socket_message.bind(this)
        this.handle_socket_close = this.handle_socket_close.bind(this)
        this.handle_socket_error = this.handle_socket_error.bind(this)
    }
    on_create() {
        if (this.auto_connect_on_create && !this.auto_connect_on_start) {
            this.make_connection()
        }
    }
    on_start() {
        if (this.auto_connect_on_start && !this.auto_connect_on_create) {
            this.make_connection()
        }
    }
    on_tick(time_data) { }
    async start() {
        await this.make_connection()
    }
    correct_time(date) {
        if (isNumber(date)) {
            let local_now = +new Date
            let delta = local_now - date
            console.log(local_now, date, delta)
            this.time_correction = delta
            this.log(`time delta: ${delta}`)
        } else {

        }
    }
    make_connection() {
        if (this.connection_opened === true) {
            this.log(`closing existing opened connection`, this.socket)
            this.close_connection()
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
            let socket = this.socket = new WebSocket(this.host)
            socket.onopen = this.handle_socket_open
            socket.onmessage = this.handle_socket_message
            socket.onclose = this.handle_socket_close
            socket.onerror = this.handle_socket_error
        })
    }
    async close_connection() {
        return new Promise((resolve, reject) => {
            this.conn_close_resolve = resolve
            this.conn_close_reject = reject
            this.socket.close()
            this.socket = undefined
        })
    }
    send(data) {
        this.log(`sengind data to ${this.host}`)
        this.socket.send(JSON.stringify(data))
    }
    handle_socket_open(event) {
        this.connection_opened = true
        this.reconnect_timeout_mul = 1
        if (this.conn_resolve) {
            this.conn_resolve()
            this.conn_resolve = this.conn_reject = undefined
        }
        this.log(`socket opened`, event)
        this.call_down("handle_socket_open_event", {
            agent: this,
            event: event,
            data: event.data
        })
    }
    handle_socket_message(event) {
        this.log(`socket message`, event)
        let data = event.data
        switch (this.response_format) {
            case "json": {
                data = JSON.parse(data)
                break
            }
        }
        this.call_down("handle_socket_message_event", {
            agent: this,
            event: event,
            data: data
        })
        this.messages_history.push(data)
        this.messages_history = this.messages_history.slice(Math.max(0, this.messages_history.length - this.max_messages_history_length), this.messages_history.length)
    }
    handle_socket_close(event) {
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
        this.call_down("handle_socket_close_event", {
            agent: this,
            event: event,
            data: event.data
        })
        this.reconnect_timeout_mul++
    }
    handle_socket_error(event) {
        this.error(`socket error`, event)
        this.reconnect_timeout_mul++

        this.call_down("handle_socket_error_event", {
            agent: this,
            event: event,
            data: event.data
        })
    }
}

export default WebSocketAgent;