import Component from "core/Component";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "core/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "core/utils/Schema"

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
