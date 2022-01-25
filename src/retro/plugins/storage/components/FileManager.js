
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { Vector3 } from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

const base64_params = {
    mime_prefix: {
        "png": "data:image/png"
    }
}

class FileManager extends Component {
    /** private */
    link_dom = undefined
    on_create() {
        let link_dom = this.link_dom = document.createElement("a"); //Create <a>

    }
    download_file(name, data, mime) {
        this.log(`prepare to download ${name}`)
        let link_dom = this.link_dom
        if (mime == undefined) {
            link_dom.href = data
        } else {
            let mime_str = base64_params.mime_prefix[mime]
            link_dom.href = `${mime_str},${data}`
        }
        
        link_dom.download = name; //File name Here
        link_dom.click(); //Downloaded file
    }
    download_text(name, text){
        let link_dom = this.link_dom
        link_dom.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
        link_dom.download = name
        link_dom.click()
    }
    on_tick(time_data) {

    }
}

export default FileManager;

