
import UAParser from "ua-parser-js";
import { forEach, set, get, isArray, isString, isUndefined } from "lodash-es"
const device_type_aliases = {
    "mobile": "smartphone",
    "tablet": "tablet",
    "undefined": "desktop"
}
function flatten(data) {
    let r = {}
    forEach(data, (cat_data, cat_name) => {
        if (isArray(cat_data) || isString(cat_data)) {
            r[cat_name] = cat_data
            return
        }
        forEach(cat_data, (token_value, token_name) => {
            if (isString(token_value)) {
                token_value = token_value.toLowerCase()
            }
            set(r, `${cat_name}_${token_name}`, token_value)
        })
    })
    return r
}
const ua_parser = new UAParser()
let parsed_result = flatten(ua_parser.getResult())
let device_data = {}
console.log(parsed_result)
function update_device_data() {
    device_data.os_name = parsed_result.os_name
    device_data.os_version = parsed_result.os_version
    device_data.os_platform = parsed_result.cpu_architecture
    device_data.device_model = parsed_result.device_model
    device_data.device_type = device_type_aliases[parsed_result.device_type]
    device_data.client_engine = parsed_result.engine_name
    device_data.client_name = parsed_result.browser_name
    device_data.client_type = "browser"
    device_data.client_version = parsed_result.browser_major
    device_data.is_mobile = parsed_result.device_type === "mobile" || parsed_result.device_data === "tablet"
    console.log(`device info:\n${JSON.stringify(device_data, null, "\t")}`)
}

Object.defineProperty(device_data, "update", {
    value: update_device_data
})

update_device_data()

export default device_data