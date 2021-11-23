import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class SnakePartController extends Component {
    is_head = false
    on_create() {
        this.log(`created`)
    }
    on_tick(time_delta) {
        if (this.is_head) {
            this.log(`head`)
        } else {
            this.load(`not head`)
        }
    }
}

export default SnakePartController;
