
import { map, isObject, isArray, isRegExp, isString, isUndefined, isBoolean, isNumber, isNaN, isNull, isTypedArray, isFunction, forEach, forEachRightvv } from "lodash-es"
import DateTime from "datetime-js"
import exp from "constants";
import { Color, Vector2, Vector3 } from "three"
const color_blend = require("color-blend")
/**blend modes*/
/*  color: (…)
    colorBurn: (…)
    colorDodge: (…)
    darken: (…)
    difference: (…)
    exclusion: (…)
    hardLight: (…)
    hue: (…)
    lighten: (…)
    luminosity: (…)
    multiply: (…)
    normal: (…)
    overlay: (…)
    saturation: (…)
    screen: (…)
    softLight: (…)
*/



const easings = {
    linear: t => t,
    ease_in_quad: t => t * t,
    ease_out_quad: t => t * (2 - t),
    ease_in_out_quad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    ease_in_cubic: t => t * t * t,
    ease_out_cubic: t => (--t) * t * t + 1,
    ease_in_out_cubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    ease_in_quart: t => t * t * t * t,
    ease_out_quart: t => 1 - (--t) * t * t * t,
    ease_in_out_quart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    ease_in_quint: t => t * t * t * t * t,
    ease_out_quint: t => 1 + (--t) * t * t * t * t,
    ease_in_out_quint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    ease_in_back: t => t * t * ((2.5 + 1) * t - 2.5),
    ease_out_back: t => --t * t * ((2.5 + 1) * t + 2.5) + 1,
    ease_in_out_back: t => ((t *= 2) < 1 ? t * t * ((2.5 + 1) * t - 2.5) : (t -= 2) * t * ((2.5 + 1) * t + 2.5) + 2) / 2
}

const cached_tag_colors = {}
function get_random_color_for_string(tag) {
    if (cached_tag_colors[tag]) return cached_tag_colors[tag]
    let h = 0;
    let s = 100
    let l = 75

    for (let a = 0; a < 10; a += 2) {
        h += ((tag.charCodeAt(a) || 0) % 18.5113) * 14.35546
    }

    h = Math.floor(h) % 360

    cached_tag_colors[tag] = `hsl(${h}, ${s}%, ${l}%)`
    return cached_tag_colors[tag]
}

let _console = window.console
function log(tag, ...data) {
    if (!isString(tag)) {
        return log('ANONYMOUS', ...arguments)
    }
    _console.log(`%c[${tag}]`, `color: ${get_random_color_for_string(tag)}`, ...data);
}

function error(tag, ...data) {
    if (!isString(tag)) {
        return error('ANONYMOUS', ...arguments)
    }
    _console.log(`%c[${tag}]`, "color: red", ...data);
}


function get_query_string_params(query) {
    return query
        ? (/^[?#]/.test(query) ? query.slice(1) : query)
            .split('&')
            .reduce((params, param) => {
                let [key, value] = param.split('=');
                try {
                    params[key] = JSON.parse(value)
                } catch (err) {
                    params[key] = value
                }
                return params;
            }, {}
            )
        : {}
};

function get_unique_props(dict_list) {
    let r = []
    dict_list.forEach(d => {
        if (isObject(d)) {
            let keys = Object.getOwnPropertyNames(d)
            keys.forEach(k => {
                if (r.indexOf(k) < 0) {
                    r.push(k)
                }
            })
        }
    })
    return r
}

function get_app_name() {
    let result = ""
    let url_params = get_query_string_params(window.location.search.replace("?", ""))
    if (process.env.NODE_ENV === "development") {
        if (url_params.app_name !== undefined) {
            result = url_params.app_name
        } else {
            result = process.env.APP_NAME
        }
    } else {
        result = process.env.APP_NAME
    }

    log(`TOOLS`, `APP_NAME: ${result}`)
    return result

}

function request_text_sync(url) {
    let xhr = new XMLHttpRequest()
    xhr.open("get", url, false)
    xhr.send()
    return xhr.responseText
}

function hex_to_hsl(H) {
    // Convert hex to RGB first
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
        r = "0x" + H[1] + H[1];
        g = "0x" + H[2] + H[2];
        b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
        r = "0x" + H[1] + H[2];
        g = "0x" + H[3] + H[4];
        b = "0x" + H[5] + H[6];
    }
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta == 0)
        h = 0;
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    else if (cmax == g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return [h, s, l]
}

function hsl_to_rgb(h, s, l) {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;
    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m));
    g = Math.round((g + m));
    b = Math.round((b + m));

    return [r, g, b]
}

function hex_to_rgb(h) {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];
        // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }
    return [(+r) / 255, (+g) / 255, (+b) / 255]
}

function rgb_to_hex(r, g, b) {
    r = (+r * 255).toString(16);
    g = (+g * 255).toString(16);
    b = (+b * 255).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

function is_none(v) {
    return v === undefined || v === null || v === NaN
}

function camel_to_snake(key) {
    var result = key.replace(/([A-Z])/g, " $1");
    result = result.split(' ').join('_').toLowerCase();
    if (result.startsWith("_")) {
        result = result.replace("_", "")
    }

    return result
}

function is_inline_dict(data) {
    return (isString(data)) && data.startsWith("??")
}

function parse_inline_dict(d) {
    let r = {}
    let s = d.replace("??", "")
    let t = s.split("&")

    t.forEach(p => {
        let k = p.split("=")[0]
        let v = p.split("=")[1]
        r[k] = v
    })
    return r
}

function makeid(length = 24, lowercase = true, uppercase = true, digits = true) {
    let result = '';
    let uc_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let lc_chars = "abcdefghijklmnopqrstuvwxyz"
    let d_chars = "0123456789"
    let characters = (uppercase ? uc_chars : "") + (lowercase ? lc_chars : "") + (digits ? d_chars : "");
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function datetime(template = "%H:%i:%s", date = new Date) {
    return DateTime(date, template)
}

// let console = {
//     log() {
//         return log(...arguments)
//     },
//     error() {
//         return error(...arguments)
//     },
//     dir() {
//         return _console.dir(...arguments)
//     }
// }

function get_most_suitable_dict_keys(dict, test_string, single_key = false) {
    if (!isString(test_string) || !isObject(dict)) {
        return []
    }
    let r = []
    forEach(dict, (value, key) => {
        if (key.match(new RegExp(test_string, "gm"))) {
            r.push(key)
        }
    })
    return r
}

function random_in_range(min, max) {
    return Math.random() * (max - min) + min
}

let console = _console

let $color1 = new Color()
let $color2 = new Color()
let $color3 = new Color()
let $v3 = new Vector3()
function blend_colors(mode, color_a, color_b, output_type = "rgb") {
    $color1.set_any(color_a)
    $color2.set_any(color_b)
    let { r, g, b, a } = color_blend[mode](
        { r: $color1.r * 255, g: $color1.g * 255, b: $color1.b * 255, a: 1 },
        { r: $color2.r * 255, g: $color2.g * 255, b: $color2.b * 255, a: 1 }
    )

    switch (output_type) {
        case "rgb": {
            $color3.set(r / 255, g / 255, b / 255)
            return $color3
        }
        case "hex": {
            return rgb_to_hex(r / 255, g / 255, b / 255)
        }
        case "0hex": {
            return parseInt(rgb_to_hex(r / 255, g / 255, b / 255).replace("#", ""), 16)
        }
        case "array": {
            return [r / 255, g / 255, b / 255]
        }
        case "v3": {
            $v3.set(r / 255, g / 255, b / 255)
            return
        }
        default: {
            $color3.set(r / 255, g / 255, b / 255)
            return $color3
        }
    }
}



window.blend_colors = blend_colors

export {
    log,
    get_query_string_params,
    get_app_name,
    request_text_sync,
    hex_to_hsl,
    hsl_to_rgb,
    hex_to_rgb,
    rgb_to_hex,
    get_unique_props,
    is_none,
    camel_to_snake,
    is_inline_dict,
    parse_inline_dict,
    makeid,
    datetime,
    error,
    get_random_color_for_string,
    get_most_suitable_dict_keys,
    random_in_range,
    blend_colors,
    console,
    easings
}
