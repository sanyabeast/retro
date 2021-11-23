/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

class Data {
    value = undefined;
    cahed_value = undefined
    request_id = 0
    throttle = 1
    changed = true
    constructor(v, throttle) {
        this.throttle = throttle ?? 1
        this.value = v;
    }
    set(v) {
        this.value = v;
    }
    get(v) {

        let r = this.cached_value;
        if (this.throttle === 1 || this.request_id % this.throttle === 0) {
            r = this.value(this.changed);
            this.changed = r !== this.cached_value
            this.cached_value = r;
        }

        this.request_id++;
        return r
    }
    valueOf() {
        return this.get()
    }
}

export default Data;
