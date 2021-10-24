
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
            let result_v_data = {
                props: {}
            }

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
                        let v_data = validate(data[k], prop_schema, `${prop_path}.${k}`, safe_mode);
                        if (!v_data.is_valid) {
                            invalid_props.push(k)
                            result_v_data.props[k] = v_data
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

                        let v_data = validate(data[jj], schema.any_prop, `${prop_path}.${jj}`, safe_mode)
                        if (!v_data.is_valid) {
                            valid_any_prop = false
                            result_v_data.props[k] = v_data
                            non_valid_any_props.push(jj)
                        }
                    }
                }

                if (isArray(data)) {
                    data.forEach((item, index) => {
                        let v_data = validate(item, schema.any_prop, `${prop_path}.${index}`, safe_mode)
                        if (!v_data.is_valid) {
                            valid_any_prop = false
                            result_v_data.props[k] = v_data
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

            return {
                ...result_v_data,
                is_valid: valid_props && valid_type && valid_strict_props && valid_any_prop,
                check_props: valid_props,
                check_type: valid_type,
                check_strict_props: valid_strict_props,
                check_any_prop: valid_any_prop,
                extra: {
                    allowed_types,
                    non_strict_props,
                    invalid_props,
                    non_valid_any_props
                }
            }
            break
        }
        case "string": {
            if (schema.startsWith(":")) {
                let schema_id = schema.replace(":", "")
                return validate(data, lib[schema_id], prop_path, safe_mode)
            } else {
                return validate(data, {
                    type: schema
                }, prop_path, safe_mode)
            }

            break
        }
        case "array": {
            let r = false
            let invalid_schemas = []
            schema.forEach(s => {
                let r2 = validate(data, s, prop_path, true)
                if (r2.is_valid) {
                    r = true
                } else {
                    invalid_schemas.push(s)
                }

            })

            if (!r) {
                console.error(`[SHEMA] validation for property "${prop_path} failed. any of given SCHEMAS are valid: ${s.join(', ')}"`)
            }
            return {
                is_valid: r,
                invalid_schemas
            }
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