
import UAParser from "ua-parser-js";
import { forEach, set, get, isArray, isString, isUndefined } from "lodash-es"

const ua_parser: UAParser = new UAParser()
let urlParams = new URLSearchParams(window.location.search);
let FORCE_MOBILE = !!urlParams.get('retro.device.force_mobile');
let FORCE_DESKTOP = !!urlParams.get('retro.device.force_desktop');

function flatten(data: object): object {
    let r: object = {}
    forEach(data, (cat_data: any, cat_name: string) => {
        if (isArray(cat_data) || isString(cat_data)) {
            r[cat_name] = cat_data
            return
        }
        forEach(cat_data, (token_value: any, token_name: string) => {
            if (isString(token_value)) {
                token_value = token_value.toLowerCase()
            }
            set(r, `${cat_name}_${token_name}`, token_value)
        })
    })
    return r
}

const device_type_aliases: { [x: string]: string } = {
    "mobile": "smartphone",
    "tablet": "tablet",
    "undefined": "desktop"
}

export default class DeviceData {
    static os_name: string
    static os_version: string
    static os_platform: string
    static device_model: string
    static device_type: string
    static client_engine: string
    static client_name: string
    static client_type: string
    static client_version: string
    static is_mobile: boolean
    static update(parsed_result: { [x: string]: any }): void {
        DeviceData.os_name = parsed_result.os_name
        DeviceData.os_version = parsed_result.os_version
        DeviceData.os_platform = parsed_result.cpu_architecture
        DeviceData.device_model = parsed_result.device_model
        DeviceData.device_type = device_type_aliases[parsed_result.device_type]
        DeviceData.client_engine = parsed_result.engine_name
        DeviceData.client_name = parsed_result.browser_name
        DeviceData.client_type = "browser"
        DeviceData.client_version = parsed_result.browser_major
        DeviceData.is_mobile = parsed_result.device_type === "mobile" || parsed_result.device_data === "tablet"

        if (DeviceData.is_mobile && FORCE_DESKTOP) DeviceData.is_mobile = false
        if (!DeviceData.is_mobile && FORCE_MOBILE) DeviceData.is_mobile = true
    }
}

let parsed_result: object = flatten(ua_parser.getResult())
DeviceData.update(parsed_result)
