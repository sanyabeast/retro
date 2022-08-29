/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */



export default class StateMachine {
	listener: { [x: string]: Function }
	list: Array<string>
	handle: { [x: string]: Function }
	_current_state: string
	constructor(data, listener) {
		this.listener = listener
		this.list = data.list ?? []
		this.handle = data.handle ?? {}
	}
	set current_state(v: string) {
		let prev_state = this._current_state
		if (v !== prev_state && this.list.indexOf(v) > -1) {
			this.leave_state(prev_state, v)
			this._current_state = v
			this.enter_state(v, prev_state, this.list[v])
		}
	}
	get current_state(): string {
		if (this._current_state === undefined) {
			this.current_state = this.list[0]
		}
		return this._current_state
	}
	enter_state(name: string, prev_state: string, data): void {
		if (this.handle && typeof this.handle.enter_state === 'function') {
			this.handle.enter_state(name, prev_state, data)
		}
		this.listener.enter_state(name, prev_state, data)
	}
	leave_state(name: string, new_state: string): void {
		if (this.handle && typeof this.handle.leave_state === 'function') {
			this.handle.leave_state(name, new_state)
		}
		this.listener.leave_state(name, new_state)
	}
	update_state(name: string): void {
		if (name === undefined) {
			name = this.current_state
		}
		if (this.handle && typeof this.handle.update_state === 'function') {
			this.handle.update_state(name)
		}
		this.listener.update_state(name)
	}
}