/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

export default class Data<T> {
    value: T | undefined = undefined;
    constructor(v: T) {
        this.value = v;
    }
    set(v: T) {
        this.value = v;
    }
    get(): T {
        return this.value;
    }
    valueOf(): T {
        return this.value;
    }
}