/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import DoobStats from "stats.js";


class Stats {
    enabled = true
    constructor() {
        this.dom = document.createElement("div");
        this.dom.style.background = "rgba(0,0,0,0.5)";
        this.dom.style.position = "absolute";
        this.dom.style.display = "none";
        this.dom.style.flexDirection = "column";
        this.dom.style.zIndex = "11111";
        this.dom.style.minWidth = "32px";
        this.dom.style.minHeight = "32px";
        this.dom.style.left = "16px";
        this.dom.style.bottom = "16px";
        this.dom.style.opacity = "0.666";
        this.dom.style.pointerEvents = "none";
        this.dom.style.zIndex = "1"
        this.dom.classList.add("3hm-stats");
        document.body.appendChild(this.dom);
        this.lines = {};


        this.dom.style.zIndex = "0"

        this.dom.addEventListener("mouseover", () => {
            this.dom.style.zIndex = "9999"
        })
        this.dom.addEventListener("mouseout", () => {
            this.dom.style.zIndex = "1"
        })
    }
    add_line(type) {
        let p = document.createElement("p");
        p.style.color = "#fff";
        p.style.fontFamily = "monospace";
        p.style.fontSize = "10px";
        p.style.margin = "0.25em";
        this.lines[type] = p;
        this.dom.appendChild(p);
    }
    update(type, val) {
        if (!this.enabled) {
            return
        }
        if (!this.lines[type]) {
            this.add_line(type);
        }
        this.lines[type].innerHTML = `[${type}]: ${val}`;
    }

    set_enabled(new_enabled) {
        this.enabled = new_enabled
        if (!this.enabled) {
            this.dom.style.display = 'none'
        } else {
            this.dom.style.display = 'flex'
        }
    }
}

export default Stats;
