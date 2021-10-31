
import { log, error, console } from "core/utils/Tools";
import * as THREE from "three"
class BasicObject extends THREE.EventDispatcher {
    constructor() {
        super()
        this.sub_id = 0
        this.subs = {
            id: {},
            name: {}
        }
    }
    round(x, n) {
        if (x % 5 == 0) {
            return Math.floor(x / n) * n;
        } else {
            return Math.floor(x / n) * n + n;
        }
    }
    wait(d) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, d);
        });
    }
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }
    clamp(v, min, max) {
        v = Math.max(min, v)
        v = Math.min(max, v)
        return v
    }
    log() {
        log(this.constructor.name, ...arguments);
    }
    error() {
        error(this.constructor.name, ...arguments);
    }
    shuffle_array(arr) {
        return arr.sort(() => (Math.random() > .5) ? 1 : -1);
    }
    random_range(min, max) {
        return Math.random() * (max - min) + min;
    }
    random_choice(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    }
    /*events*/
    on() {
        return this.addEventListener(...arguments)
    }
    off() {
        return this.removeEventListener(...arguments)
    }
    has_listener() {
        return this.hasEventListener(...arguments)
    }
    emit(type, payoad) {
        return this.dispatchEvent({ type: type, payoad })
    }
}

export default BasicObject