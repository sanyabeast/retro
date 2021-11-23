/**created by @sanyabeast at 11/10/2021 */

import { CanvasTexture } from "three"
import { isString, isArray } from "lodash-es"
import {
    hex_to_hsl,
    hsl_to_rgb,
    hex_to_rgb,
    rgb_to_hex,
    rgb_to_hsl
} from "retro/utils/Tools"

const cache = {}
const filters_lib = {
    invert(pixel) {
        return [
            1 - pixel[0],
            1 - pixel[1],
            1 - pixel[2],
            pixel[2],
        ]
    },
    extract_ch(pixel, channel_id) {
        let v = pixel[channel_id]
        return [v, v, v, pixel[3]];
    },
    separate_ch(pixel, channel_id) {
        let v = pixel[channel_id]
        return [channel_id === 0 ? v : 0, channel_id === 1 ? v : 0, channel_id === 2 ? v : 0, pixel[3]];
    },
    desaturate(pixel) {
        let hsl = rgb_to_hsl(...pixel)
        hsl[1] = 0
        let rgb = hsl_to_rgb(...hsl)
        return rgb
    },
    hsl(pixel, h_delta = 0, s_delta = 0, l_delta = 0) {
        let hsl = rgb_to_hsl(...pixel)
        hsl[0] = Math.min(Math.max((hsl[0] + h_delta), 0), 1)
        hsl[1] = Math.min(Math.max((hsl[1] + s_delta), 0), 1)
        hsl[2] = Math.min(Math.max((hsl[2] + l_delta), 0), 1)
        return hsl_to_rgb(...hsl)
    }
}

class ImageFilter {
    constructor() {
        let canvas = this.canvas = document.createElement("canvas")
        let ctx = this.ctx = this.canvas.getContext("2d")
    }
    load(src, max_size, onready, onerror) {
        let image = new Image()
        let canvas = document.createElement("canvas")
        let ctx = canvas.getContext("2d")
        canvas.ctx = ctx

        image.onload = () => {
            let w = Math.floor(Math.min(image.width, max_size))
            let h = Math.floor(Math.min(image.height, max_size))
            canvas.width = w
            canvas.height = h
            ctx.drawImage(image, 0, 0, w, h)
            onready()
        }
        image.onerror = (data) => {
            onerror()
        }
        image.src = src
        return canvas
    }
    parse_filter(data) {
        if (isString(data)) {
            let r = []
            data = data.replace("[", "").replace("]", "").replace(/\s+/g, '').replace(/'/gm, "\"")
            data = data.split(";")
            data.forEach((token, index) => {
                let has_args = token.indexOf("(") > -1
                let args = []
                let name = token
                if (has_args) {
                    let start = token.indexOf("(")
                    name = token.substring(0, start)
                    let end = token.indexOf(")")
                    let args_tokens = token.substring(start + 1, end)
                    args_tokens = args_tokens.split(",")
                    args_tokens.forEach((arg, index) => {
                        args[index] = JSON.parse(arg)
                    })
                }
                if (!filters_lib[name]) {
                    console.warn(`[ImageFilter] no filter with name "${name}"`)
                } else {
                    r.push({
                        name,
                        args
                    })
                }

            })
            return r
        } else if (isArray(data)) {
            return data
        }
    }
    apply_to_pixel(pixel, filter) {
        let new_pixel = [...pixel]
        filter = this.parse_filter(filter)
        filter.forEach(f => {
            new_pixel = filters_lib[f.name](new_pixel, ...f.args)
        })
        return new_pixel

    }
    apply_to_image(canvas, filter, onready) {
        setTimeout(() => {
            filter = this.parse_filter(filter)
            if (filter.length > 0) {
                let ctx = canvas.ctx
                let width = canvas.width
                let height = canvas.height
                var image_data = ctx.getImageData(0, 0, width, height);
                const { data } = image_data;
                const { length } = data;
                for (let i = 0; i < length; i += 4) { // red, green, blue, and alpha
                    const r = data[i + 0] / 255;
                    const g = data[i + 1] / 255;
                    const b = data[i + 2] / 255;
                    const a = data[i + 3] / 255;
                    let new_pixel = this.apply_to_pixel([r, g, b, a], filter)
                    data[i + 0] = Math.floor(new_pixel[0] * 255);
                    data[i + 1] = Math.floor(new_pixel[1] * 255);
                    data[i + 2] = Math.floor(new_pixel[2] * 255);
                    data[i + 3] = Math.floor((new_pixel[3] === undefined ? a : new_pixel[3]) * 255);
                }
                ctx.putImageData(image_data, 0, 0);
                onready()
            } else {
                onready()
            }
        })
    }
    get_texture(src, filter = "[]", max_size = 1) {
        let texture = cache[`${src}|${filter}|${max_size}`]
        if (texture) return texture
        let image = this.load(src, max_size, () => {
            this.apply_to_image(image, filter, () => {
                texture.needsUpdate = true
            })
            texture.needsUpdate = true
        })
        texture = new CanvasTexture(image)
        cache[`${src}|${filter}|${max_size}`] = texture
        return texture
    }
}

export default ImageFilter