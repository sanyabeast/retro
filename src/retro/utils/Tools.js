
import { defaults, map, isObject, isArray, isRegExp, isString, isUndefined, isBoolean, isNumber, isNaN, isNull, isTypedArray, isFunction, forEach, forEachRight, throttle, debounce, isNil } from "lodash-es"
import DateTime from "datetime-js"
import exp from "constants";
import { Color, Vector2, Vector3 } from "three"
import device from "./Device"
import dateformat from "dateformat";
import accounting, { formatNumber } from "accounting"
import getSymbolFromCurrency from 'currency-symbol-map'
import hotkeys from 'hotkeys-js';

let VERBOSE = false
let url_app_params = {}

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

/**extra */
const spawn_retro_greetings = () => {
    console.log(
        `         
            %c_____ _____ _____ _____ _____              
            %c| __  |   __|_   _| __  |     |            
            %c|    -|   __| | | |    -|  |  |            
            %c|__|__|_____| |_| |__|__|_____| %cv. ${PACKAGE_DATA.version}
            %c- - - - - - - - - - - - - - - - - - - - - - - 
            %chttps://github.com/sanyabeast/retro
        `,
        'color:#f44336; background: #222',
        'color:#607d8b; background: #222',
        'color:#ffc107; background: #222',
        'color:#03a9f4; background: #222',
        'color:#8bc34a; background: #222',
        'color:#444; background: #222;',
        'color:#9c27b0; background: #222'

    );
}

const get_random_color_for_string = (tag) => {
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
const get_random_color_for_string2 = (tag) => {
    if (cached_tag_colors[tag]) return cached_tag_colors[tag]
    let h = 0;
    let s = 100
    let l = 75

    for (let a = 0; a < tag.length; a += 2) {
        h += ((tag.charCodeAt(a) || 0) % 18.5113) * 14.35546
    }

    h = Math.floor(h) % 360

    cached_tag_colors[tag] = rgb_to_hex(hsl_to_rgb(h / 360, s / 100, l / 100))
    return cached_tag_colors[tag]
}
let _console = window.console
const log = (tag, ...data) => {
    if (!VERBOSE) return
    if (!isString(tag)) {
        return log('ANONYMOUS', ...data)
    }
    _console.log(`%c[${tag}]`, `color: ${get_random_color_for_string(tag)}`, ...data);
}
const log2 = (tag, ...data) => {
    if (!isString(tag)) {
        return log('ANONYMOUS', ...data)
    }
    _console.log(`%c[${tag}]`, `color: ${get_random_color_for_string(tag)}`, ...data);
}
const error = (tag, ...data) => {
    if (!isString(tag)) {
        return error('ANONYMOUS', ...data)
    }
    _console.log(`%c[${tag}]`, "color: red", ...data);
}


const get_query_string_params = (query = '', target = {}) => {
    let result = target
    if (isString(query)) {
        query = query.indexOf('?' > -1) ? query.split("?")[1] : query
        let url_search_params = new URLSearchParams(query)
        for (const key of url_search_params.keys()) {
            result[key] = url_search_params.get(key)
        }
    }
    return result
};

const get_query_string_params2 = (query = '', target = {}) => {
    let result = target
    if (isString(query)) {
        query = query.indexOf('?' > -1) ? query.split("?")[1] : query
        let url_search_params = new URLSearchParams(query)
        for (const key of url_search_params.keys()) {
            try {
                result[key] = JSON.parse(url_search_params.get(key))
            } catch (err) {
                result[key] = url_search_params.get(key)
            }
        }
    }
    return result
};

const get_unique_props = (dict_list) => {
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
const get_app_name = () => {
    let result = ""
    let url_params = get_query_string_params(window.location.search.replace("?", ""))
    if (IS_DEV) {
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

const request_text_sync = (url) => {
    let xhr = new XMLHttpRequest()
    xhr.open("get", url, false)
    xhr.send()
    return xhr.responseText
}
/**COLOR */
const hex_to_hsl = (H) => {
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

    return [h / 360, s / 100, l / 100]
}
const rgb_to_hsl = (r, g, b) => {

    // Find greatest and smallest channel values
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
    if (delta == 0)
        h = 0;
    // Red is max
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax == g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return [h / 360, s / 100, l / 100];
}
const hsl_to_rgb = (h, s, l) => {
    // Must be fractions of 1
    h *= 360

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
    r = Math.round((r + m) * 255) / 255;
    g = Math.round((g + m) * 255) / 255;
    b = Math.round((b + m) * 255) / 255;

    return [r, g, b]
}
const hex_to_rgb = (h) => {
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
const rgb_to_hex = (r, g, b) => {
    if (isArray(r)) {
        return rgb_to_hex(...r)
    }
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
let $color1 = new Color()
let $color2 = new Color()
let $color3 = new Color()
let $v3 = new Vector3()
const blend_colors = (mode, color_a, color_b, output_type = "rgb") => {
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

/**TYPE */
const is_none = (v) => {
    return v === undefined || v === null || v === NaN
}
const camel_to_snake = (key) => {
    var result = key.replace(/([A-Z])/g, " $1");
    result = result.split(' ').join('_').toLowerCase();
    if (result.startsWith("_")) {
        result = result.replace("_", "")
    }

    return result
}
const is_inline_dict = (data) => {
    return (isString(data)) && data.startsWith("??")
}
const parse_inline_dict = (d) => {
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
const makeid = (length = 24, lowercase = true, uppercase = true, digits = true) => {
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
const datetime = (template = "%H:%i:%s", date = new Date) => {
    return DateTime(date, template)
}
const get_most_suitable_dict_keys = (dict, test_string, single_key = false) => {
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
let console = _console

if (IS_DEV) {
    window.blend_colors = blend_colors
    window.hex_to_hsl = hex_to_hsl
    window.hsl_to_rgb = hsl_to_rgb
    window.hex_to_rgb = hex_to_rgb
    window.rgb_to_hex = rgb_to_hex
    window.rgb_to_hsl = rgb_to_hsl
}

const shuffle_array = (arr) => {
    return arr.sort(() => (Math.random() > .5) ? 1 : -1);
}
/**RANDOM */
const random_range = (min, max) => {
    return Math.random() * (max - min) + min;
}
const random_choice = (arr, excl) => {
    if (excl == undefined || arr.length < 2) {
        return arr[Math.floor(Math.random() * arr.length)]
    } else {
        let r = arr[Math.floor(Math.random() * arr.length)]
        if (excl.indexOf(r) > -1) return random_choice(arr, excl)
        return r
    }
}
const random_string = (length) => {
    let r = ""
    while (r.length < length) {
        r += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    }
    return r.substring(0, length)
}
/**TIME */
const wait = (d) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, d);
    });
}
/**MATH*/
const round = (x, n, greater = false) => {
    return greater ? Math.ceil(x / n) * n : Math.floor(x / n) * n;
}
const lerp = (start, end, amt) => {
    if (isNumber(start) && isNumber(end)) {
        return (1 - amt) * start + amt * end;
    } else if (isArray(start) && isArray(end)) {
        let r = []
        start.forEach((v, i) => {
            r[i] = lerp(start[i] ?? 0, end[i] ?? 0, amt)
        })
        return r
    } else if (isObject(start) && isObject(end)) {
        let r = []
        forEach((v, i) => {
            r[i] = lerp(start[i] ?? 0, end[i] ?? 0, amt)
        })
        return r
    } else {
        this.log(`cannot lerp: unknown type "${typeof start}"`, start, end)
    }
}

const multiply = (data_a, data_b) => {
    if (isNumber(data_a) && isNumber(data_b)) {
        return data_a * data_b
    } else if (isArray(data_a) && isArray(data_b)) {
        let r = []
        data_a.forEach((v, i) => {
            r[i] = (v ?? 0) * (data_b[i] ?? 0)
        })
        return r
    } else if (isArray(data_a) && isNumber(data_b)) {
        let r = []
        data_a.forEach((v, i) => {
            r[i] = (v ?? 0) * data_b
        })
        return r
    } else if (isNumber(data_a) && isArray(data_b)) {
        return multiply(data_b, data_a)
    } else if (isObject(data_a) && isObject(data_b)) {
        let r = []
        forEach((v, i) => {
            r[i] = (v ?? 0) * (data_b[i] ?? 0)
        })
        return r
    } else if (isObject(data_a) && isNumber(data_b)) {
        let r = []
        forEach((v, i) => {
            r[i] = (v ?? 0) * data_b
        })
        return r
    } else if (isNumber(data_a) && isObject(data_b)) {
        return multiply(data_b, data_a)
    } else {
        this.log(`cannot lerp: unknown type "${typeof data_a}"`, data_a, data_b)
    }
}

const clamp = (v, min, max) => {
    v = Math.max(min, v)
    v = Math.min(max, v)
    return v
}
const direction = (v_a, v_b) => {
    if (v_a.length === 3) {
        return normalize([
            v_b[0] - v_a[0],
            v_b[1] - v_a[1],
            v_b[2] - v_a[2],
        ])
    }
}
const normalize = (v_a) => {
    let r = [...v_a]
    let max = Math.max.apply(Math, map(r, mv => Math.abs(mv)))
    r = map(r, v => v /= max)
    return r
}
const distance = (v_a, v_b) => {
    if (Math.min(v_a.length, v_b.length) === 3) {
        return Math.sqrt(
            Math.pow(v_b[0] - v_a[0], 2) +
            Math.pow(v_b[1] - v_a[1], 2) +
            Math.pow(v_b[2] - v_a[2], 2)
        )
    }
}
const dot = (a, b) => {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2])
}
const magnitude = (a) => {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
}
const angle = (a, b) => {
    return Math.acos(dot(a, b) / (magnitude(a) * magnitude(b)))
}
const translate_range = (value, a_min, a_max, b_min, b_max) => {
    return lerp(b_min, b_max, (value - a_min) / (a_max - a_min))
}

/**loops */
const for_x = (x, cb) => {
    for (let a = 0; a < x; a++) {
        cb(x)
    }
}

const async_for_x = async (x, cb) => {
    for (let a = 0; a < x; a++) {
        await cb(x)
    }
}

const join_uris = (...args) => {
    return args.join("/")
}



const parse_numeric_float = (data) => {
    return data.toString().replace(/[^0-9\.]/g, '')
}


const define_getters = (target, options) => {
    forEach(options, (token, key) => {
        if (isFunction(token)) {
            Object.defineProperty(target, key, {
                get: token
            })
        } else {
            Object.defineProperty(target, key, {
                get: () => options[key]
            })
        }
    })

    return target
}

const recreate_reference_properties = (target, properties_excluded_from_recreation) => {
    let descriptors = Object.getOwnPropertyDescriptors(target)
    forEach(descriptors, (descriptor, key) => {
        let value = descriptor.value
        if (isObject(value) && value !== null) {
            if (value.__proto__ === window.Object.prototype || value.__proto__ === window.Array.prototype) {
                if (properties_excluded_from_recreation.indexOf(key) < 0) {
                    //target.log(`recreating reference prop: "${key}"`, value)
                    target[key] = ResourceManager.mixin_object(value)
                }
            }
        }
    })
}


const average_in_array = (arr) => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i] || 0
    }
    return sum / arr.length;
}


/**intl */
// Settings object that controls default parameters for library methods:
accounting.settings = {
    currency: {
        symbol: "$",   // default currency symbol is '$'
        format: "%v%s", // controls output: %s = symbol, %v = value/number (can be object: see below)
        decimal: ".",  // decimal point separator
        thousand: ",",  // thousands separator
        precision: 2   // decimal places
    },
    number: {
        precision: 0,  // default precision on numbers is 0
        thousand: ",",
        decimal: "."
    }
}

// These can be changed externally to edit the library's defaults:
accounting.settings.currency.format = "%s %v";

// Format can be an object, with `pos`, `neg` and `zero`:
accounting.settings.currency.format = {
    pos: "%v\xa0%s",   // for positive values, eg. "$ 1.00" (required)
    neg: "%v\xa0(%s)", // for negative values, eg. "$ (1.00)" [optional]
    zero: "%v\xa0\xa0--\xa0"  // for zero values, eg. "$  --" [optional]
};

// Example using underscore.js - extend default settings (also works with $.extend in jQuery):
accounting.settings.number = defaults({
    precision: 2,
    thousand: "\xa0"
}, accounting.settings.number);


let _format_currency_params = {
    default_currency: "USD",
    default_currency_precision: 2,
    default_number_precision: 2,
}

const set_format_currency_params = (params) => {
    _format_currency_params.default_currency = params.default_currency || _format_currency_params.default_currency;
}


const format_currency = (data = 0, currency = _format_currency_params.default_currency) => {
    data = data ?? 0

    if (data === 0) {
        data = 0.00001
    }

    data = accounting.unformat(data.toString())
    return accounting.formatMoney(data, getSymbolFromCurrency(currency), _format_currency_params.default_currency_precision)
}

const format_number = (data = 0, precision = _format_currency_params.default_number_precision) => {
    data = accounting.unformat(data.toString())
    return formatNumber(data, precision)
}

const parse_float = (data = "", precision = _format_currency_params.default_number_precision) => {
    data = accounting.unformat(data.toString())
    return parseFloat(data)
}

const parse_int = (...args) => {
    return Math.round(parse_float(...args));
}


const format_ms_to_s = (v) => {
    return `${(v / 1000).toFixed(2)}s`
}

/**html */
const find_relative_parent = (root) => {
    let p = root.parentElement
    let type = window.getComputedStyle(p).position

    while (type !== "absolute" && type !== "relative" && p !== null) {
        p = p.parentElement
        if (p === window) {

        }
        type = window.getComputedStyle(p).position
    }

    return p
}

const get_html_rect = (el) => {
    return el.getBoundingClientRect()
}

const add_html_class = (el, cls) => {
    if (isArray(cls)) {
        forEach(cls, c => add_html_class(el, c))
        return
    }
    el.classList.add(cls)
}

const remove_html_class = (el, cls) => {
    if (isArray(cls)) {
        forEach(cls, c => remove_html_class(el, c))
        return
    }
    el.classList.add(cls)
}


const set_html_class = (el, cls) => {
    if (isArray(cls)) {
        el.setAttribute("class", cls.join(" "))
    } else {
        el.setAttribute("class", cls)
    }
}


const set_html_style = (el, style) => {
    forEach(style, (token, key) => {
        if (isString(token) || isNumber(token)) {
            el.style[key] = token
        } else if (isFunction(token)) {
            el.style[key] = token(el, key)
        } else {
            error(`unknown html style token at "${key}"`, token)
        }
    })
}

const add_html_attributes = (el, attributes) => {
    forEach(attributes, (value, name) => {
        el.setAttribute(name, value);
    })
}

const parse_html = (html) => {
    let div = document.createElement("div")
    div.innerHTML = html
    return div.children[0]
}

const add_css = (css) => {
    let head = document.getElementsByTagName('head')[0];
    let s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    if (s.styleSheet) {   // IE
        s.styleSheet.cssText = css;
    } else {                // the world
        s.appendChild(document.createTextNode(css));
    }
    head.appendChild(s);
}

const create_dom = (options) => {
    let el = isString(options.layout) ? parse_html(options.layout) : document.createElement(options.tag || 'div')
    set_html_style(el, options.style || {})
    add_html_class(el, options.cls || [])
    return el
}

const is_html_descedant = (parent, child) => {
    let node = child.parentNode;
    while (node) {
        if (node === parent) {
            return true;
        }

        // Traverse up to the parent
        node = node.parentNode;
    }

    // Go up until the root but couldn't find the `parent`
    return false;
};

/** runtime */
const exec_code = (code, safe = false) => {
    let f_code = `
        (function () {
            function resolve(data){
                result = data;
            }
            /* … */
            ${code}
        })();
    `;
    let result = undefined
    if (safe) {
        try {
            eval(f_code)
        } catch (err) {
            console.warn(err)
        }
    } else {
        eval(f_code)
    }
    return result
}

const resolve_code = (code, safe = false) => {
    return new Promise((resolve, reject) => {
        let f_code = `
            (function () {
                /* … */
                ${code}
            })();
        `;
        if (safe) {
            try {
                eval(f_code)
            } catch (err) {
                console.warn(err)
                resolve(undefined)
            }
        } else {
            eval(f_code)
        }
    })
}

/**hotkeys */
const hotkeys_bind = (key, method) => {
    hotkeys(key, method)
}

const hotkeys_clear = () => {
    hotkeys.unbind()
}

const hotkeys_trigger = (key) => {
    hotkeys.trigger(key)
}

/**screen */
const get_screen_orientation = (arr) => {
    let r = 'portrait-primary';
    if (isObject(window.screen) && isObject(window.screen.orientation) && isString(window.screen.orientation.type)) {
        r = screen.orientation.type
    } else {
        r = window.innerWidth > window.innerHeight ? 'landscape-primary' : 'portrait-primary';
    }
    return r
}

const exit_fullscreen = () => {
    if (document.fullscreenElement !== null) {
        document.exitFullscreen()
    }
}

let osk_state_is_any_html_input_focused_now = false
let osk_state_active_html_input_element = undefined
let oks_fade_duration = 2000
let osk_blur_timestamp = 0

window.addEventListener('focus', (evt) => {
    osk_blur_timestamp = 0
    if (evt.target === window) {
        return
    }

    if (osk_state_active_html_input_element && osk_state_active_html_input_element !== evt.target) {
        osk_state_active_html_input_element.blur()
    }

    exit_fullscreen()

    if (!evt.target.retro_focus_is_setup) {
        console.dir(evt.target)
        evt.target.setAttribute('spellcheck', false)
        // autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        evt.target.retro_focus_is_setup = true
    }

    osk_state_active_html_input_element = evt.target
    osk_state_is_any_html_input_focused_now = true
    // evt.preventDefault()
    // evt.stopImmediatePropagation()
    // evt.target.focus({ preventScroll: true })
}, { capture: true, })

window.addEventListener('blur', (evt) => {
    osk_state_active_html_input_element = undefined
    osk_state_is_any_html_input_focused_now = false
    osk_blur_timestamp = +new Date()
}, { capture: true })

const is_onscreen_kb_active = () => {
    let is_hot = +new Date() - osk_blur_timestamp < oks_fade_duration;
    return device.is_mobile && (osk_state_is_any_html_input_focused_now || (is_hot))
}

const close_onscreen_kb = () => {
    if (!isNil(osk_state_active_html_input_element)) {
        osk_state_active_html_input_element.blur();
    }
}

let is_document_visible = true
document.addEventListener('visibilitychange', e => {
    is_document_visible = document.visibilityState === 'visible'
}, false);

/**sound */
// window.addEventListener('play', (evt)=>{
//     clearInterval(evt.target.retro_daemon_tmid)
//     let audio = evt.target;
//     evt.target.retro_daemon_tmid = setInterval(()=>{
//         console.log(audio)
//     }, 1000 / 15)
//     console.dir(evt.target) 
// }, { capture: true })

/** combine module */
const tools = {
    screen: {
        get_orientation: get_screen_orientation,
        is_onscreen_kb_active,
        close_onscreen_kb,
        exit_fullscreen,
        get is_document_visible() {
            return is_document_visible
        }
    },
    device: device,
    hotkeys: {
        bind: hotkeys_bind,
        clear: hotkeys_clear,
        trigger: hotkeys_trigger
    },
    parsers: {
        parse_float,
        parse_int,
        parse_html,
        parse_inline_dict,
        parse_numeric_float,
        get_query_string_params,
        get_query_string_params2
    },
    string: {
        parse_float,
        parse_int,
        get_query_string_params,
        get_query_string_params2
    },
    number: {
        parse_float,
        parse_int
    },
    array: {
        shuffle: shuffle_array,
    },
    type: {
        is_none: is_none,
        is_array: isArray,
        is_number: isNumber,
        is_object: (data) => { return isObject(data) && !isArray(data) && !isNull(data) },
        is_function: isFunction,
        is_undefined: isUndefined,
        is_string: isString,
        is_null: isNull,
        is_boolean: isBoolean,
        is_nan: isNaN,
        is_typed_array: isTypedArray,
    },
    loop: {
        for_x,
        async_for_x
    },
    color: {
        hsl_to_rgb,
        rgb_to_hex,
        rgb_to_hsl,
        hex_to_hsl,
        hex_to_rgb,
    },
    console: {
        log: log,
        log2,
        error: error,
    },
    easings,
    extra: {
        url_app_params: url_app_params,
        get_random_color_for_string,
        get_random_color_for_string2,
        get_query_string_params,
        get_query_string_params2,
        get_unique_props,
        get_app_name,
        join_uris,
        parse_html,
        add_css,
        parse_numeric_float,
        define_getters,
        recreate_reference_properties
    },
    intl: {
        format_currency,
        format_number,
        set_format_currency_params,
        format_ms_to_s
    },
    math: {
        average_in_array,
        round: round,
        lerp: lerp,
        clamp: clamp,
        direction: direction,
        distance: distance,
        normalize: normalize,
        dot: dot,
        magnitude: magnitude,
        angle: angle,
        translate_range,
        parse_float,
        multiply
    },
    net: {
        request_text_sync: request_text_sync,
    },
    random: {
        range: random_range,
        choice: random_choice,
        string: random_string,
    },
    time: {
        wait: wait,
        throttle,
        debounce
    },
    date: {
        format: dateformat
    },
    html: {
        find_relative_parent,
        get_rect: get_html_rect,
        set_style: set_html_style,
        add_class: add_html_class,
        remove_class: remove_html_class,
        set_class: set_html_class,
        parse_html,
        add_css,
        create_dom,
        is_descedant: is_html_descedant,
        add_attributes: add_html_attributes
    },
    runtime: {
        exec: exec_code,
        resolve: resolve_code
    }
}

get_query_string_params2(window.location.search, url_app_params)
if (url_app_params.verbose == 1) {
    VERBOSE = true
}

export {
    url_app_params,
    tools,
    log,
    log2,
    get_query_string_params,
    get_query_string_params2,
    get_app_name,
    request_text_sync,
    hex_to_hsl,
    hsl_to_rgb,
    hex_to_rgb,
    rgb_to_hex,
    rgb_to_hsl,
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
    blend_colors,
    console,
    easings,
    /**math */
    round,
    lerp,
    clamp,
    /**arrays */
    shuffle_array,
    /**random */
    random_range,
    random_choice,
    random_string,
    /**timing */
    wait,
    /*vector math*/
    direction,
    distance,
    dot,
    magnitude,
    angle,
    translate_range,
    recreate_reference_properties,
    spawn_retro_greetings
}
