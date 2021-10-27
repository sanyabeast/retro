
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import { log, error, is_none, console, makeid } from "core/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "core/utils/Schema"


class RenderTarget extends SceneComponent {
    render_target_id = undefined
    width = 512
    height = 512
    render_target = undefined;
    get texture(){
        return this.render_target.texture
    }
    on_created() {
        log(`RenderTarget`, `created`)
        if (isUndefined(this.render_target_id)){
            this.render_target_id = `RT_${makeid(8)}`
        }
        let render_target = this.render_target = RenderTarget.get_render_target(this.width, this.height)
        if (!THREE.MathUtils.isPowerOfTwo(this.width) || !THREE.MathUtils.isPowerOfTwo(this.height)) {
            render_target.texture.generateMipmaps = false;
        }

        log(this, render_target)
        RenderTarget.list[this.render_target_id] = this
    }
    on_tick(time_delta) {

    }
    get_reactive_props() {
        return [].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
    }
}

RenderTarget.list = {}


RenderTarget.get_render_target = (w = 512, h = 512) => {
    const rt = new THREE.WebGLRenderTarget(w, h, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
    });
    return rt
}

export default RenderTarget;
