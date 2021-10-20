

class Frame {
    constructor() {
        this.dom = document.createElement("div");
        this.set_styles(this.dom, {
            position: "absolute",
            top: 0,
            left: 0,
            minWidth: "200px",
            minHeight: "200px",
            border: "2px solid #eee",
            display: "grid",
            gridTemplateColumns: "1fr",
            gridTemplateRows: "32px 1fr",
            overflow: "hidden",
            boxSizing: "border-box",
            fontFamily: "monospace",
            fontSize: "12px",
            zIndex: "10"
        });

        this.header_node = document.createElement("div");
        this.header_toolbar_node = document.createElement("div")
        this.set_styles(this.header_toolbar_node, {
            flexDirection: "row",
            display: "flex",
            alignItems: "center",
            padding: "0 32px"
        });

        this.caption_node = document.createElement("div");
        this.header_node.appendChild(this.caption_node);
        this.header_node.appendChild(this.header_toolbar_node);
        this.set_styles(this.header_node, {
            height: "32px",
            borderBottom: "1px dotted #eee",
            flexDirection: "row",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            background: "#bbb",
            cursor: "move",
            userSelect: "none",
            overflow: "hidden",
        });

        this.content_node = document.createElement("div");
        this.set_styles(this.content_node, {
            width: "100%",
            height: "100%",
            overflow: "hidden",
            border: "2px solid black",
            background: "linear-gradient(rgb(3, 16, 43) 0%, #f46336 100%)"
        });

        this.resize_node = document.createElement("div");
        this.set_styles(this.resize_node, {
            position: "absolute",
            bottom: "0",
            right: "0",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#ffeeee",
            transform: "translate(50%, 50%)",
            cursor: "nwse-resize",
            zIndex: '9999',
            border: "2px solid black"
        });

        this.dom.appendChild(this.resize_node);
        this.dom.appendChild(this.header_node);
        this.dom.appendChild(this.content_node);
        document.body.appendChild(this.dom);

        this.width = 680;
        this.height = 460;
        this.x = 48;
        this.y = 48;

        this.setup_evnts();

        this.update();
    }
    setup_evnts() {
        let header_node_captured = false;
        let prev_pointer = [0, 0];
        let resize_node_captured = false;

        this.header_node.addEventListener("mousedown", (evt) => {
            header_node_captured = true;
            prev_pointer[0] = evt.pageX;
            prev_pointer[1] = evt.pageY;
        });
        this.resize_node.addEventListener("mousedown", (evt) => {
            resize_node_captured = true;
            prev_pointer[0] = evt.pageX;
            prev_pointer[1] = evt.pageY;
        });
        document.body.addEventListener("mousemove", (evt) => {
            if (header_node_captured) {
                let pointer = [0, 0];
                pointer[0] = evt.pageX;
                pointer[1] = evt.pageY;
                let dx = pointer[0] - prev_pointer[0];
                let dy = pointer[1] - prev_pointer[1];
                prev_pointer = pointer;
                this.set_position(this.x + dx, this.y + dy);
            }
            if (resize_node_captured) {
                let pointer = [0, 0];
                pointer[0] = evt.pageX;
                pointer[1] = evt.pageY;
                let dx = pointer[0] - prev_pointer[0];
                let dy = pointer[1] - prev_pointer[1];
                prev_pointer = pointer;
                this.set_size(this.width + dx, this.height + dy);
            }
        });
        document.body.addEventListener("mouseup", (evt) => {
            header_node_captured = false;
            resize_node_captured = false;
        });
    }
    set_content(el) {
        this.content_node.appendChild(el);
    }
    set_styles(el, style) {
        for (let k in style) {
            el.style[k] = style[k];
        }
    }
    set_size(w, h) {
        this.width = w;
        this.height = h;
        this.update();
        if (typeof this.on_size_changed === "function") {
            this.on_size_changed(this.width, this.height);
        }
    }
    set_position(x, y) {
        this.x = x;
        this.y = y;
        this.update();
    }
    set_caption(text) {
        this.caption_node.innerHTML = text;
    }
    update() {
        this.set_styles(this.dom, {
            width: `${this.width}px`,
            height: `${this.height}px`,
            transform: `translate(${this.x}px, ${this.y}px)`,
        });
    }
    add_button(caption, title, callback, color = "#eee") {
        let div = document.createElement("div")
        let p = document.createElement("p")
        p.innerHTML = caption
        p.setAttribute("title", title)
        div.appendChild(p)
        this.set_styles(div, {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            fontWeight: "900",
            border: "1px solid black",
            minWidth: "16px",
            height: "16px",
            borderRadius: "5px",
            background: color,
            fontSize: "14px",
            margin: "0 4px",
            padding: "2px"
        })

        div.addEventListener("mousedown", (evt) => {
            evt.stopPropagation()
            callback()
        })

        this.header_toolbar_node.appendChild(div)
    }
}

export default Frame;
