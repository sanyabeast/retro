import map from "lodash-es/map"
import isObject from "lodash-es/isObject"


function log(tag, ...data) {
    console.log(`%c[${tag}]`, "color: magenta", ...data);
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

function is_none(v) {
    return v === undefined || v === null || v === NaN
}

export {
    log,
    get_query_string_params,
    get_app_name,
    request_text_sync,
    hex_to_hsl,
    hsl_to_rgb,
    hex_to_rgb,
    get_unique_props,
    is_none
}
