
# created by @sanyabeast 9/6/2021 
# 
# 
# 

import Component from 'retro/Component';
import ResourceManager from 'retro/ResourceManager';
import { log, error, is_none, console } from 'retro/utils/Tools'
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from 'lodash-es'
import Schema from 'retro/utils/Schema'

class UserSnakeController extends Component
	on_create: ->
		@log 'created'
		snake_controller = @snake_controller = @get_component 'SnakeController'
	on_tick: (time_data)->
		input = @find_component_of_type 'InputComponent'
		if input.is_keypress 'space'
			@snake_controller.grow()
		if input.is_keypress 'd'
			@snake_controller.steer_right time_data.delta
		else if input.is_keypress 'a'
			@snake_controller.steer_left time_data.delta

        

export default UserSnakeController
