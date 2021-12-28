/** created by @sanyabeast / 28 dec 2021 */

import axios from "axios";
import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import path from "path"
import { Vector3 } from "three";
import { log, error, is_none, console } from "retro/utils/Tools";
import {
    isString,
    isObject,
    isFunction,
    isArray,
    isNumber,
    isBoolean,
    isUndefined,
    isNull,
    map,
    filter,
    keys,
    values,
    set,
    get,
    unset
} from "lodash-es";
import Schema from "retro/utils/Schema";

class HTTPAgent extends Component {
    base_uri = window.location.origin
    general_opts = {}

    on_create() {
        this.log("created");
    }
    on_tick(time_data) {}
    get(uri = "", opts = {}) {
        return axios.get(path.join(this.base_uri, uri), opts);
    }
    post(uri = "", opts = {}) {
        return axios.post(path.join(this.base_uri, uri), opts);
    }
}

export default HTTPAgent;
