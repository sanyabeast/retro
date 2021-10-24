
import "./index.html";

import Frame from "core/utils/Frame";
import Launcher from "core/Launcher"

import Device from "core/utils/Device"
console.log(Device)


console.log(`[MAIN] app version - ${PACKAGE_DATA.version}`)

document.addEventListener("DOMContentLoaded", async () => {

    switch (Device.device_type) {
        case "smartphone": {
            let launcher = window.launcher = new Launcher()
            document.body.appendChild(launcher.dom)
            document.body.addEventListener("mousedown", () => {
                document.body.requestFullscreen()
            })
            break
        }
        case "phablet": {
            let launcher = window.launcher = new Launcher()
            document.body.appendChild(launcher.dom)
            document.body.addEventListener("mousedown", () => {
                document.body.requestFullscreen()
            })
            break
        }
        default: {
            let frame = new Frame();
            frame.set_size(window.innerWidth * 0.94, window.innerHeight * 0.94)
            frame.set_caption("Launcher");

            let launcher = new Launcher()
            frame.content_node.appendChild(launcher.dom)

            if (process.env.NODE_ENV === 'development') {
                window.launcher = launcher
            }
            try {
                document.querySelector("body > .version").innerHTML = PACKAGE_DATA.version
            } catch (err) { }

            frame.add_button("RNDR", "View Final Render", () => {
                launcher.app.refs.renderer_component.set_service_view_mode("default")
            }, "#9c27b0")
            frame.add_button("NRML", "View Normals", () => {
                launcher.app.refs.renderer_component.set_service_view_mode("normal")
            }, "#7e6ae5")
            frame.add_button("DPTH", "View Depth", () => {
                launcher.app.refs.renderer_component.set_service_view_mode("depth")
            }, "#e91e63")
            frame.add_button("WRFM", "View Wireframe", () => {
                launcher.app.refs.renderer_component.set_service_view_mode("wireframe")
            }, "#fe8dff")
            frame.add_button("MTCP", "View Matcap", () => {
                launcher.app.refs.renderer_component.set_service_view_mode("matcap")
            }, "#e91e1e")

            frame.add_button("|", "", i=>i, "#ffffff")

            frame.add_button("PSFX", "Postprocessing toggle", () => {
                launcher.app.refs.renderer_component.use_postfx = !launcher.app.refs.renderer_component.use_postfx
            }, "#cddc39")

            frame.add_button("FOG", "Toggle Fog", () => {
                launcher.app.refs.renderer_component.use_fog = !launcher.app.refs.renderer_component.use_fog
            }, "#6fdc39")
            break
        }
    }


});




