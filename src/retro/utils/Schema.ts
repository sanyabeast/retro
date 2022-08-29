
import { map, isObject, isArray, isRegExp, isString, isUndefined, isBoolean, isNumber, isNaN, isNull, isTypedArray, isFunction, forEach, forEachRight, filter } from "lodash-es"
import { log, error, console } from "retro/utils/Tools"

type SchemaArrayIteratee = (s: ISchema) => any;
export declare interface ISchema {
    type: string
    strict_props?: boolean
    any_prop?: string
    props?: {
        [x: string]: ISchema
    }
}
export declare interface ISchemaValidationTraceResult {
    passed: boolean
    path: string
    schema_invalid?: boolean
    schema_id?: string
    type: {
        passed: boolean
        has?: string
        need?: string[]
    }
    root?: {
        value: any
        schema: ISchema
    }
    props: {
        passed: boolean,
        invalid?: string[]
    }
    any_prop: {
        passed: boolean,
        invalid?: string[]
    }
    strict_props: {
        passed: boolean,
        invalid?: string[]
    }
}
export declare interface ISchemaLib {
    [x: string]: ISchema
}
export const lib: ISchemaLib = {}
export function matches_types(data: any, allowed_types: string[]): boolean {
    let type_name: string = get_type_name(data)
    if (allowed_types.indexOf("any") > -1) {
        return true
    } else {
        return allowed_types.indexOf(type_name) > -1
    }
}
export function validate_value(data: any, schema: ISchema | ISchema[] | string, prop_path: string, trace: Array<ISchemaValidationTraceResult>, root_object, root_schema): boolean {
    // console.log(`START VALIDATING VALUE`, data, schema)
    let schema_format: string = get_type_name(schema);
    switch (schema_format) {
        case "string": {
            schema = schema as unknown as string
            if (schema.startsWith(":")) {
                let schema_id: string = schema.replace(":", "")
                if (lib[schema_id] === undefined) {
                    trace.unshift({
                        passed: false,
                        path: prop_path,
                        schema_invalid: true,
                        schema_id: schema_id,
                        type: { passed: true },
                        props: { passed: true },
                        any_prop: { passed: true },
                        strict_props: { passed: true }
                    })
                    return false
                }
                return validate_value(
                    data,
                    lib[schema_id],
                    prop_path,
                    trace,
                    root_object,
                    root_schema
                )
            } else {
                let schema_type = schema as unknown
                return validate_value(
                    data,
                    {
                        type: schema_type as string
                    },
                    prop_path,
                    trace,
                    root_object,
                    root_schema
                )
            }
        }
        case "array": {
            schema = schema as undefined as Array<ISchema>
            let validation_result: ISchemaValidationTraceResult
            let valid_schema: ISchema
            let valid_schema_trace: ISchemaValidationTraceResult[] = []
            let invalid_schema_trace: ISchemaValidationTraceResult[] = []
            let invalid_schemas: ISchema[] = []
            schema.forEach((s: ISchema) => {
                let sub_trace: Array<ISchemaValidationTraceResult> = []
                let r: boolean = validate_value(data, s, prop_path, sub_trace, root_object, root_schema)
                if (r) {
                    valid_schema = s
                    valid_schema_trace = sub_trace
                } else {
                    invalid_schema_trace = sub_trace.concat(invalid_schema_trace)
                    invalid_schemas.push(s)
                }
            })
            if (valid_schema) {
                validation_result = valid_schema_trace[0]
                forEachRight(valid_schema_trace, (trace_data: ISchemaValidationTraceResult) => {
                    trace.unshift(trace_data)
                })
            } else {
                validation_result = invalid_schema_trace[0]
                forEachRight(invalid_schema_trace, (trace_data: ISchemaValidationTraceResult) => {
                    trace.unshift(trace_data)
                })
            }
            return validation_result.passed
        }
        case "object": {
            schema = (schema as unknown) as ISchema
            let validation_result = {
                path: prop_path,
                passed: true,
                root: {
                    value: root_object,
                    schema: root_schema
                },
                type: {
                    passed: true,
                    has: "any",
                    need: ["any"]
                },
                props: {
                    passed: true,
                    invalid: [],
                },
                strict_props: {
                    passed: true,
                    invalid: []
                },
                any_prop: {
                    passed: true,
                    invalid: []
                }

            }
            let actual_type: string = get_type_name(data)
            let allowed_types: string[] = ["any"]
            if (isString(schema.type)) allowed_types = schema.type.replace(/\s/g, '').split("|")
            if (isArray(schema.type)) allowed_types = [...schema.type]
            let is_valid_type: boolean = matches_types(data, allowed_types)
            validation_result.type.passed = is_valid_type
            validation_result.type.has = actual_type
            validation_result.type.need = allowed_types
            if (isObject(schema.props)) {
                switch (actual_type) {
                    case "object": {
                        let invalid_props: string[] = []
                        let odd_props: string[] = []
                        forEach(schema.props, (prop_schema: ISchema, prop_name: string) => {
                            let r: boolean = validate_value(data[prop_name], prop_schema, `${prop_path}.${prop_name}`, trace, root_object, root_schema)
                            if (!r) invalid_props.push(prop_name)
                        })
                        validation_result.props.invalid = invalid_props
                        validation_result.props.passed = invalid_props.length === 0
                        if (schema.strict_props === true) {
                            forEach(data, (prop_value: any, prop_name: string) => {
                                schema = schema as undefined as ISchema
                                if (schema.props[prop_name] === undefined) {
                                    odd_props.push(prop_name)
                                }
                            })
                        }
                        validation_result.strict_props.passed = odd_props.length === 0
                        validation_result.strict_props.invalid = odd_props
                        break
                    }
                    case "array": {
                        break
                    }
                    default: { }
                }
            }
            if (!isUndefined(schema.any_prop)) {
                let invalid_any_props: string[] = []
                switch (actual_type) {
                    case "object": {
                        forEach(data, (prop_value: any, prop_name: string) => {
                            schema = schema as undefined as ISchema
                            let r: boolean = validate_value(prop_value, schema.any_prop as unknown as ISchema, `${prop_path}.${prop_name}`, trace, root_object, root_schema)
                            if (!r) {
                                invalid_any_props.push(prop_name)
                            }
                        })
                        break
                    }
                    case "array": {
                        let invalid_any_props: string[] = []
                        forEach(data, (prop_value: any, prop_name: string) => {
                            schema = schema as undefined as ISchema
                            let r: boolean = validate_value(prop_value, schema.any_prop as unknown as ISchema, `${prop_path}.${prop_name}`, trace, root_object, root_schema)
                            if (!r) {
                                invalid_any_props.push(prop_name)
                            }
                        })
                        break
                    }
                    default: { }
                }

                validation_result.any_prop.passed = invalid_any_props.length === 0
                validation_result.any_prop.invalid = invalid_any_props
            }

            validation_result.passed =
                validation_result.props.passed &&
                validation_result.any_prop.passed &&
                validation_result.strict_props.passed &&
                validation_result.type.passed;
            trace.unshift(validation_result)
            return validation_result.passed
        }
        default: {
            log('Schema', `unknowm schema format: ${schema_format}`, data, schema)
            return false
        }
    }
}

export function validate(data: any, schema: ISchema | ISchema[] | string, prop_path: string = "ROOT", silent_mode: boolean = false): boolean {
    let trace: ISchemaValidationTraceResult[] = []
    let result: boolean = true

    validate_value(data, schema, prop_path, trace, data, schema)
    let problems: ISchemaValidationTraceResult[] = filter(trace, (data: ISchemaValidationTraceResult) => {
        return !data.passed
    })

    if (problems.length > 0) {

        if (silent_mode !== true) {
            let total_message: string = ``

            forEach(problems, (data: ISchemaValidationTraceResult, index: number) => {
                let message: string = `
^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^
PROBLEM #${index + 1}
VALIDATION of ${data.path} FAILED`

                if (data.schema_invalid) {
                    message += `
# INVALID SCHEMA:
schema: ${data.schema_id}
                `
                }
                if (!data.type.passed) {
                    message += `
# INCORRECT TYPE:
has: ${data.type.has.toUpperCase()}
need: ${data.type.need.join(", ").toUpperCase()}
                `
                }

                if (!data.props.passed) {
                    message += `
# INCORRECT PROPS:
invalid: ${data.props.invalid.join(", ")}
                `
                }

                if (!data.strict_props.passed) {
                    message += `
# PROPS MUST BE STRICT:
invalid: ${data.strict_props.invalid.join(", ")}
                `
                }

                total_message += message
            })

            error('Schema Validation', total_message)
            error('Schema Validation', "[DATA]", data)
            error('Schema Validation', "[SCHEMA]", schema)
            error("Schema Validation", "[TRACE]", trace)
            error('Schema Validation', ". . . . . . . . . . . . . . . . . . . ")
        }

    }

    return problems.length === 0
}


export function get_type_name(d: any): string {
    let r: string = "none"
    if (isObject(d) && !isNull(d) && !isArray(d)) r = "object"
    if (isArray(d)) r = "array"
    if (isNumber(d) && !isNaN(d)) r = "number"
    if (isString(d)) r = "string"
    if (isBoolean(d)) r = "bool"
    if (isFunction(d)) r = "function"

    return r
}


export function register(id: string, data: any): void {
    lib[id] = data
}


export default {
    lib: lib,
    validate: validate,
    get_type_name: get_type_name,
    matches_types: matches_types,
    register: register,
}