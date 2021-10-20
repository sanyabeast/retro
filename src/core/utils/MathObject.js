
import { log } from "core/utils/Tools";
class MathObject {
    log() {
        return MathObject.log(...arguments);
    }
    static log() {
        log(...arguments);
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
}

export default MathObject