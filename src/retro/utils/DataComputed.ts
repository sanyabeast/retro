/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

export default class DataComputed<T> {
    value: Function = function () { };
    cached_value: T | undefined
    request_id: number = 0
    throttle: number = 1
    changed: boolean = true
    constructor(v: () => T, throttle: number = 1) {
        this.throttle = throttle
        this.value = v;
    }
    set(v: Function): void {
        this.value = v;
    }
    get(): T {
        let r = this.cached_value;
        if (this.throttle === 1 || this.request_id % this.throttle === 0) {
            r = this.value(this.changed);
            this.changed = r !== this.cached_value
            this.cached_value = r;
        }

        this.request_id++;
        return r
    }
    valueOf(): T {
        return this.get()
    }
}