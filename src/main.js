
import "./index.html";
import ResourceManager from "retro/ResourceManager";
import Frame from "retro/utils/Frame";
import { log, get_app_name, console } from "retro/utils/Tools";
import Device from "retro/utils/Device"
import VueGUIComponent from "retro/components/VueGUIComponent"
ResourceManager.preload_vue_components("editor", require.context("editor/", false, /\.vue$/))
let editor_gui_data = VueGUIComponent.create_vue_app("editor.Main", {})
let editor_app = window.editor_app = editor_gui_data.vue_app
let editor_store = window.editor_store = editor_gui_data.vuex_store
//editor_app.$mount(document.getElementById("editor"))
console.log(editor_gui_data)

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

window.on_click_to_start = () => {
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
            let frame = window._frame = new Frame();
            frame.set_size((window.innerWidth * 0.8), (window.innerWidth * 0.8) / 16 * 9)
            // frame.set_size((window.innerWidth * 0.15), (window.innerWidth * 0.15))
            frame.set_caption(APP_NAME);

            if (false && Device.os_name === "mac os"){
                frame.toggle_maximize()
            }
            if (Device.is_mobile){
                frame.toggle_maximize()
            }

            let app = new App()
            frame.content_node.appendChild(app.dom)

            console.log(app)

            if (process.env.NODE_ENV === 'development') {
                window.app = app
            }
            try {
                document.querySelector("body > .version").innerHTML = PACKAGE_DATA.version
            } catch (err) { }

            frame.add_button("RNDR", "View Final Render", () => {
                app.refs.renderer.set_render_layer_name("rendering")
            }, "#9c27b0")
            frame.add_button("GZMO", "Toggle Gizmos", (button) => {
                app.refs.renderer.rendering_layers.gizmo = !app.refs.renderer.rendering_layers.gizmo
                button.set_active(app.refs.renderer.rendering_layers.gizmo)
            }, "#f44336", a => app.refs.renderer.rendering_layers.gizmo)
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

            frame.add_button("PSFX", "Postprocessing toggle", (button) => {
                app.refs.renderer.use_postfx = !app.refs.renderer.use_postfx
                button.set_active(app.refs.renderer.use_postfx)
            }, "#cddc39", a => app.refs.renderer.use_postfx)

            frame.add_button("FFX", "Fidelity FX toggls", (button) => {
                let postfx = app.find_component_of_type("Postprocessing")
                if (!postfx) return
                postfx.use_ffx = !postfx.use_ffx
                button.set_active(postfx.use_ffx)
            }, "#cddc39", a => app.find_component_of_type("Postprocessing") ? app.find_component_of_type("Postprocessing").use_ffx : false)

            frame.add_button("SSGI", "Screen Space Global Illumination Toggle", (button) => {
                let postfx = app.find_component_of_type("Postprocessing")
                if (!postfx) return
                postfx.use_ssgi = !postfx.use_ssgi
                button.set_active(postfx.use_ssgi)
            }, "#cddc39", a => app.find_component_of_type("Postprocessing") ? app.find_component_of_type("Postprocessing").use_ssgi : false)

            frame.add_button("FOG", "Toggle Fog", () => {
                app.refs.renderer.use_fog = !app.refs.renderer.use_fog
            }, "#6fdc39")
            break
        }
    }
}




