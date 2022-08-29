/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import Component from "retro/Component";
import { Vector3 } from 'three';

class DomLabel extends Component {
    tick_skip = 3;
    in_dom = false;
    _text = "";
    constructor(params) {
        super(params);
        this.dom = document.createElement("div");

        this.apply_styles(this.dom, {
            width: "auto",
            height: "auto",
            padding: "2px",
            background: "rgba(0,0,0,0.5)",
            border: "1px dotted #eee",
            position: `absolute`,
            top: `0`,
            left: `0`,
            pointerEvents: "none",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            ...params.style,
        });
        this.gizmo = document.createElement("div");
        this.apply_styles(this.gizmo, {
            width: "4px",
            height: "4px",
            background: "rgb(1, 1, 1, 0.5)",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: "1px solid white",
            position: "absolute",
            top: "0",
            left: "0",
        });

        this.paragraph = document.createElement("p");
        this.apply_styles(this.paragraph, {
            margin: "0",
            color: "#ffffff",
            fontSize: "10px",
            fontFamily: "monospace",
            whiteSpace: "pre-line",
        });

        this.dom.appendChild(this.gizmo);
        this.dom.appendChild(this.paragraph);

    }
    on_create() {
        this.globals.dom.appendChild(this.dom)
    }
    on_enable() {
        if (!this.in_dom) {
            this.dom.style.display = "flex"
        }
        this.in_dom = true;
    }
    on_disable() {
        if (this.in_dom) {
            this.dom.style.display = "none"
        }
        this.in_dom = false;
    }
    init(params) {
        console.log(`component init params: `, params);
    }
    set_position(x, y, z) {
        let v = new Vector3(x, y, z);
        let p = v.project(this.camera);
        this.dom.style.transform = `translate(calc(${((v.x + 1) / 2) * this.globals.resolution.x
            }px), ${((-v.y + 1) / 2) * this.globals.resolution.y}px)`;
    }
    apply_styles(el, style) {
        for (let k in style) {
            el.style[k] = style[k];
        }
    }
    get text() {
        return this._text;
    }
    set text(v) {
        this._text = v;
        if (this.paragraph !== undefined) {
            this.paragraph.innerHTML = v;
        }
    }
}

export default DomLabel;
