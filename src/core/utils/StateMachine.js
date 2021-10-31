class StateMachine {
	constructor(data, listener) {
		this.listener = listener
		this.list = data.list || []
		this.handle = data.handle || {}
	}
	set current_state(v) {
		let prev_state = this._current_state
		if (v !== prev_state && this.list.indexOf(v) > -1) {
			this.leave_state(prev_state, v, this.list[prev_state])
			this._current_state = v
			this.enter_state(v, prev_state, this.list[v])
		}
	}
	get current_state() {
		if (this._current_state === undefined) {
			this.current_state = this.list[0]
		}
		return this._current_state
	}
	enter_state(name, prev_state, data) {
		if (this.handle && typeof this.handle.enter_state === 'function') {
			this.handle.enter_state(name, prev_state, data)
		}
		this.listener.enter_state(name, prev_state, data)
	}
	leave_state(name, new_state) {
		if (this.handle && typeof this.handle.leave_state === 'function') {
			this.handle.leave_state(name, new_state)
		}
		this.listener.leave_state(name, new_state)
	}
	update_state(name) {
		if (name === undefined){
			name = this.current_state
		}
		if (this.handle && typeof this.handle.update_state === 'function') {
			this.handle.update_state(name)
		}
		this.listener.update_state(name)
	}
}

export default StateMachine