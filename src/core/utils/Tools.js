import map from "lodash-es/map"


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


export {
    log,
    get_query_string_params,
    get_app_name,
    request_text_sync
}
