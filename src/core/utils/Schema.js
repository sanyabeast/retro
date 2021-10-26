
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


function validate(data, schema, prop_path = "ROOT", silent_mode = false, trace = []) {
    // console.log(prop_path, data, schema)
    let valid_type = true
    let valid_props = true
    let allowed_types = ["any"]
    let invalid_props = []
    let valid_any_prop = true
    let valid_strict_props = true
    let non_strict_props = []
    let non_valid_any_props = []
    let validation_result = {
        props: {},
        prop_path,
        schema,
        value: data,
        trace
    }


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
            let prop_results = []

            if (isObject(schema.props)) {
                if (isObject(data) && !isArray(data)) {
                    for (let k in schema.props) {
                        let prop_schema = schema.props[k]
                        let v_data = validate(data[k], prop_schema, `${prop_path}.${k}`, true, trace);
                        if (!v_data.is_valid) {
                            invalid_props.push(k)
                            prop_results.push(v_data)
                            validation_result.props[k] = v_data
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
                        let v_data = validate(data[jj], schema.any_prop, `${prop_path}.${jj}`, true, trace)
                        if (!v_data.is_valid) {
                            valid_any_prop = false
                            prop_results.push(v_data)
                            validation_result.props[jj] = v_data
                            non_valid_any_props.push(jj)
                        }
                    }
                }

                if (isArray(data)) {
                    data.forEach((item, index) => {
                        let v_data = validate(item, schema.any_prop, `${prop_path}.${index}`, true, trace)
                        if (!v_data.is_valid) {
                            valid_any_prop = false
                            prop_results.push(v_data)
                            validation_result.props[index] = v_data
                            non_valid_any_props.push(index)
                        }
                    })
                }
            }

            // if (silent_mode !== true) {
            //     if (!valid_type) {
            //         console.error(`[SHEMA] validation of TYPE for "${prop_path} failed. type is ${get_type_name(data)}; schema needs: ${allowed_types.join(', ')}"`)
            //         console.dir(data)
            //     }

            //     if (!valid_props) {
            //         console.error(`[SHEMA] validation of props for "${prop_path} failed. invalid props: ${invalid_props.join(', ')}"`)
            //         console.dir(data)
            //     }

            //     if (!valid_strict_props) {
            //         console.error(`[SHEMA] validation of props for "${prop_path} failed. props must be STRICT. restricted props: ${non_strict_props.join(', ')}"`)
            //         console.dir(data)
            //     }


            //     if (!valid_any_prop) {
            //         console.error(`[SHEMA] validation of props for "${prop_path} failed. invalid ANY props: ${non_valid_any_props.join(', ')}"`)
            //         console.dir(data)
            //     }
            // }

            validation_result = {
                ...validation_result,
                prop_results,
                is_valid: valid_props && valid_type && valid_strict_props && valid_any_prop,
                check_props: valid_props,
                check_type: valid_type,
                check_strict_props: valid_strict_props,
                check_any_prop: valid_any_prop,
                actual_type: get_type_name(data),
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
                validation_result = validate(data, lib[schema_id], prop_path, true, trace)
            } else {
                validation_result = validate(data, {
                    type: schema
                }, prop_path, true, trace)
            }

            break
        }
        case "array": {
            let r = false
            let invalid_schemas = []
            let results = {}
            schema.forEach(s => {
                let r2 = validate(data, s, prop_path, true, trace)
                results[s] = r2
                if (r2.is_valid) {
                    r = true
                } else {
                    invalid_schemas.push(s)
                }

            })

            validation_result.is_valid = r
            validation_result.invalid_schemas = invalid_schemas
            validation_result.results = results
            break
        }
    }

    if (!validation_result.is_valid && silent_mode !== true) {
        log_validation_results(validation_result)
    }

    trace.push(validation_result)
    return validation_result
}

function log_validation_results(results) {


    if (isArray(results.invalid_schemas) && results.invalid_schemas.length > 0) {
        results.invalid_schemas.forEach(r => log_validation_results(results.results[r]))
    } else {
        if (isArray(results.prop_results) && results.prop_results.length > 0) {
            results.prop_results.forEach(r => log_validation_results(r))
        } else {
            console.log(results)
            let schema = results.schema
            let prop_path = results.prop_path
            let value = results.value
            let s = `
VALIDATION FOR "${prop_path} FAILED" \n
`


            if (results.check_type === false) {
                if (schema.type !== "none") {
                    s += `
TYPE INVALID: 
    actual type: ${results.actual_type}
    allowed types: ${results.extra.allowed_types.join(",")}
`
                }
            }


            if (results.check_any_prop === false) {
                s += `
ANY PROP INVALID: 
    ${results.extra.non_valid_any_props.join(",")}
`
            }

            if (results.check_props === false) {
                s += `
PROPS INVALID: 
    ${results.extra.invalid_props.join(",")}
`
            }

            if (results.check_strict_props === false) {
                s += `
PROPS MUST BE STRICT: 
    non-strict props: ${results.extra.non_strict_props.join(",")}
`
            }

            if (schema.type !== "none") {
                s += `
SCHEMA:
${JSON.stringify(schema, null, "\t")}
    `
                
                console.error(s)
                console.dir(value)
            }
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