/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

class Data {
    value = undefined;
    constructor(v) {
        this.value = v;
    }
    set(v) {
        this.value = v;
    }
    get(v) {
        return this.value;
    }
    valueOf() {
        return this.value;
    }
}

export default Data;
