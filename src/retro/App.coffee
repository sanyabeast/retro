# created by @sanyabeast 8/14/2021 1:31:45 AM

import ResourceManager from 'retro/ResourceManager'
import GameObject from 'retro/GameObject'
import { log, console } from 'retro/utils/Tools'

class RetroApp extends GameObject
	# private
	dom: undefined
	stage: undefined
	stage_prefab: undefined

	constructor: (params) ->
		super params
		@setup_app()
		@define_global_var 'app', =>
			this
		@load_prefab ResourceManager.load_prefab(PRESET.PERSISTENT_SCENE_PREFAB, 'components.renderer.params.pixel_ratio': Math.min(window.devicePixelRatio, 2))
		return
	reload_stage: () ->
		@unload_stage()
		@load_stage @stage_prefab
		return
	unload_stage: () ->
		stage = @stage
		stage.destroy()
		@remove stage
		return
	load_stage: (prefab, prefab_options) ->
		@stage_prefab = prefab
		stage = @stage = new GameObject(ResourceManager.load_prefab(prefab, prefab_options))
		@define_global_var 'stage', =>
			stage
		@add stage
		@start()
		stage
	setup_app: () ->
		dom = @dom = document.createElement('div')
		@dom.style.width = '100%'
		@dom.style.height = '100%'
		@dom.style.position = 'relative'
		@dom.style.userSelect = 'none'
		@dom.classList.add 'root-dom'
		@define_global_var 'dom', ->
			dom
		return
	get_background_color: () ->
		'linear-gradient(#131638, #69003a)'
	start: () ->
		clock = @find_component_of_type('ClockComponent')
		@start_game()
		if clock
			log 'App', 'starting clock...'
			clock.begin_tick()
		else
			log 'App', 'cant find clock component. application did not started'
		return


export default RetroApp
