import MathObject from 'core/utils/MathObject'

class EventDispatcher extends MathObject {
    constructor(params) {
        super(params)
        this.sub_id = 0
        this.subs = {
            id: {},
            name: {}
        }
    }
    on(event_name, callback) {
        let id = this.sub_id
        this.subs.name[event_name] = this.subs.name[event_name] || {}
        this.subs.id[id] = this.subs.name[event_name][id] = {
            event_name,
            id,
            callback
        }
        this.sub_id++
        return id
    }
    emit(event_name, payload) {
        if (this.subs.name[event_name]) {
            for (let k in this.subs.name[event_name]) {
                this.subs.name[event_name][k].callback(payload)
            }
        }
    }
    unsub(id) {
        if (this.subs.id[id]) {
            let event_name = this.subs.id[id]
            delete this.subs.id[id]
            delete this.subs.name[event_name][id]
        }
    }


}

export default EventDispatcher

