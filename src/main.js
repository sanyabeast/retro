
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
            document.body.addEventListener("mousedown", ()=>{
                document.body.requestFullscreen()
            })
            break
        }
        default: {
            let frame = new Frame();
            frame.set_size(window.innerWidth * 0.777, window.innerHeight * 0.777)
            frame.set_caption("Launcher");

            let launcher = new Launcher()
            frame.content_node.appendChild(launcher.dom)

            if (process.env.NODE_ENV === 'development') {
                window.launcher = launcher
            }
            try {
                document.querySelector("body > .version").innerHTML = PACKAGE_DATA.version
            } catch (err) { }
            break
        }
    }


});




