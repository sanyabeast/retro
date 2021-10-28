
import "./index.html";
import AssetManager from "core/utils/AssetManager";
import Frame from "core/utils/Frame";
import { log, get_app_name, console } from "core/utils/Tools";

import Device from "core/utils/Device"

let App = null
const APP_NAME = get_app_name()
if (APP_NAME === undefined) {
    log(`MAIN`, `no app`)
} else {
    log(`MAIN`, `loading application "${APP_NAME}"`)
    App = require(`apps/${APP_NAME}/App`)
    App = App.default

}

log(`MAIN`, `app version - ${PACKAGE_DATA.version}`)

document.addEventListener("DOMContentLoaded", async () => {
    switch (Device.device_type) {
        case "smartphone": {
            let app = window.app = new App()
            document.body.appendChild(app.dom)
            document.body.addEventListener("mousedown", () => {
                document.body.requestFullscreen()
            })
            break
        }
        case "phablet": {
            let app = window.app = new App()
            document.body.appendChild(app.dom)
            document.body.addEventListener("mousedown", () => {
                document.body.requestFullscreen()
            })
            break
        }
        default: {
            let frame = new Frame();
            frame.set_size(window.innerWidth * 0.94, window.innerHeight * 0.94)
            frame.set_caption(APP_NAME);

            let app = new App()
            frame.content_node.appendChild(app.dom)

            if (process.env.NODE_ENV === 'development') {
                window.app = app
            }
            try {
                document.querySelector("body > .version").innerHTML = PACKAGE_DATA.version
            } catch (err) { }

            frame.add_button("RNDR", "View Final Render", () => {
                app.refs.renderer.set_render_layer_name("rendering")
            }, "#9c27b0")
            frame.add_button("GZMO", "Toggle Gizmos", () => {
                app.refs.renderer.rendering_layers.gizmo = !app.refs.renderer.rendering_layers.gizmo
            }, "#d1e7e4")
            frame.add_button("NRML", "View Normals", () => {
                app.refs.renderer.set_render_layer_name("normal")
            }, "#7e6ae5")
            frame.add_button("DPTH", "View Depth", () => {
                app.refs.renderer.set_render_layer_name("depth")
            }, "#e91e63")

            frame.add_button("WRFM", "View Wireframe", () => {
                app.refs.renderer.set_render_layer_name("wireframe")
            }, "#fe8dff")
            frame.add_button("MTCP", "View Matcap", () => {
                app.refs.renderer.set_render_layer_name("matcap")
            }, "#e91e1e")
            frame.add_button("CLID", "Color Id", () => {
                app.refs.renderer.set_render_layer_name("colorid")
            }, "#4b00ff")

            frame.add_button("|", "", i => i, "#ffffff")

            frame.add_button("PSFX", "Postprocessing toggle", () => {
                app.refs.renderer.use_postfx = !app.refs.renderer.use_postfx
            }, "#cddc39")

            frame.add_button("FOG", "Toggle Fog", () => {
                app.refs.renderer.use_fog = !app.refs.renderer.use_fog
            }, "#6fdc39")
            break
        }
    }


});




