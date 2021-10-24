
import { map, isObject, isArray, isRegExp, isString, isUndefined, isBoolean, isNumber, isNaN, isNull, isTypedArray, isFunction } from "lodash-es"

const lib = {}

function matches_types(data, allowed_types) {
    let type_name = get_type_name(data)
    if (allowed_types.indexOf("any") > -1) {
        return true
    } else {
        return allowed_types.indexOf(type_name) > -1
    }
}


function validate(data, schema, prop_path = "ROOT", safe_mode = false) {
    let valid_type = true
    let valid_props = true
    let allowed_types = ["any"]
    let invalid_props = []
    let valid_any_prop = true
    let valid_strict_props = true
    let non_strict_props = []
    let non_valid_any_props = []

    let scheme_type = get_type_name(schema)

    switch (scheme_type) {
        case "object": {
            if (isString(schema.type)) {
                allowed_types = schema.type.replace(/\s/g, '').split("|")
            }
            if (isArray(schema.type)) {
                allowed_types = [...schema.type]
            }

            valid_type = matches_types(data, allowed_types)

            if (isObject(schema.props)) {
                if (isObject(data) && !isArray(data)) {
                    for (let k in schema.props) {
                        let prop_schema = schema.props[k]
                        let is_valid = validate(data[k], prop_schema, `${prop_path}.${k}`, safe_mode);
                        if (!is_valid) {
                            invalid_props.push(k)
                            valid_props = false;
                        }
                    }

                    if (schema.strict_props === true) {
                        for (let kk in data) {
                            if (!schema.props[kk]) {
                                valid_strict_props = false
                                non_strict_props.push(kk)

                            }
                        }
                    }
                }
            }

            if (schema.any_prop) {
                if (isObject(data) && !isArray(data)) {
                    for (let jj in data) {

                        let is_valid = validate(data[jj], schema.any_prop, `${prop_path}.${jj}`, safe_mode)
                        console.log(is_valid, data[jj], schema, schema.any_prop)
                        if (!is_valid) {
                            valid_any_prop = false
                            non_valid_any_props.push(jj)
                        }
                    }
                }

                if (isArray(data)) {
                    data.forEach((item, index) => {
                        let is_valid = validate(item, schema.any_prop, `${prop_path}.${index}`, safe_mode)
                        if (!is_valid) {
                            valid_any_prop = false
                            non_valid_any_props.push(index)
                        }
                    })
                }
            }

            if (safe_mode !== true) {
                if (!valid_type) {
                    console.error(`[SHEMA] validation of TYPE for "${prop_path} failed. type is ${get_type_name(data)}; schema needs: ${allowed_types.join(', ')}"`)
                    console.dir(data)
                }

                if (!valid_props) {
                    console.error(`[SHEMA] validation of props for "${prop_path} failed. invalid props: ${invalid_props.join(', ')}"`)
                    console.dir(data)
                }

                if (!valid_strict_props) {
                    console.error(`[SHEMA] validation of props for "${prop_path} failed. props must be STRICT. restricted props: ${non_strict_props.join(', ')}"`)
                    console.dir(data)
                }


                if (!valid_any_prop) {
                    console.error(`[SHEMA] validation of props for "${prop_path} failed. invalid ANY props: ${non_valid_any_props.join(', ')}"`)
                    console.dir(data)
                }
            }

            return valid_props && valid_type && valid_strict_props && valid_any_prop
            break
        }
        case "string": {
            if (schema.startsWith(":")) {
                let schema_id = schema.replace(":", "")
                return validate(data, lib[schema_id], prop_path)
            } else {
                return validate(data, {
                    type: schema
                }, prop_path, safe_mode)
            }

            break
        }
        case "array": {
            let r = false
            schema.forEach(s => {
                let r2 = validate(data, s, prop_path, true)
                if (r2) {
                    r = true
                }
            })
            return r
            break
        }
    }
}

function get_type_name(d) {
    let r = "none"
    if (isObject(d) && !isNull(d) && !isArray(d)) r = "object"
    if (isArray(d)) r = "array"
    if (isNumber(d) && !isNaN(d)) r = "number"
    if (isString(d)) r = "string"
    if (isBoolean(d)) r = "bool"
    if (isFunction(d)) r = "function"

    return r
}


function register(id, data) {
    lib[id] = data
}

export default {
    lib,
    validate,
    get_type_name,
    matches_types,
    register
}