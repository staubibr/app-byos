'use strict';

import Core from '../app-framework/tools/core.js';
import Dom from '../app-framework/tools/dom.js';
import Net from '../app-framework/tools/net.js';
import Widget from '../app-framework/base/widget.js';
import AppConfig from '../app-framework/components/config.js';

export default Core.templatable("App.Widget.Simulator", class Simulator extends Widget { 

	set params(value) { this._params = value }
	
	get params() { return this._params; }
	
	set visualization(value) { this._visualization = value; }
	
	get visualization() { return this._visualization; }

	constructor(node) {		
		super(node);
		
		this.params = {
			csd: {},
			hospitals: {}
		};
		
		this.elems.btn_simulate.addEventListener("click", this.on_simulate_click.bind(this));
		this.elems.btn_cancel.addEventListener("click", this.on_cancel_click.bind(this));
	}
		
	async on_simulate_click(ev) {
		this.show("busy");
		
		var ids = Object.keys(this.params.csd);
		
		if (ids.length == 0) {
			this.show("idle");
		
			return alert("You must select areas on the map to define a simulation area before launching a simulation.");
		}
		
		var params = {
			"workflow_uuid": "4d6a5f35-d346-4414-b9d8-81521a21f96a",
			"workflow_params": {
				"area": `"csduid" IN (${ids.join(",")})`
			},
			"simulation_duration": 100,
			"visualization_description": "Simulation generated through BYOS.",
			"visualization_name": "BYOS Auto Simulation"
		}
		
		if (Object.keys(this.params.hospitals).length > 0) params.workflow_params.hospitals = this.params.hospitals;
		
		const data = new FormData();
		
		data.append("params", JSON.stringify(params));
		data.append("visualization_config", this.visualization);
		
		try {
			var json = await Net.json(AppConfig.URLs.simulate, { method: 'post', body: data });
		
			this.elems.link_ready.setAttribute("href", AppConfig.URLs.viewer + json.uuid);
						
			this.show("ready");
		}
		catch (error) {
			alert(error.toString());
			
			this.show("idle");
		}
	}
	
	on_cancel_click(ev) {
		this.show("idle");
	}
	
	show(type) {
		Dom.toggle_css(this.elems.idle, "hidden", type != "idle");
		Dom.toggle_css(this.elems.busy, "hidden", type != "busy");
		Dom.toggle_css(this.elems.ready, "hidden", type != "ready");
	}
	
	html() {
		return	"<div class='simulator-inner ol-control'>" + 
					"<div handle='idle' class='idle'>" + 
						"<div>Please select geometries on the map then, click on the <br>\"Simulate\" to generate and simulate the model.</div>" +
						"<button handle='btn_simulate' class='button'>Simulate</button>" +
					"</div>" +
					
					"<div handle='busy' class='busy hidden'>" + 
						"<div>Running simulation...</div>" +
						"<img src='./assets/spinner.gif' />" +
					"</div>" +
					
					"<div handle='ready' class='ready hidden'>" + 
						"<a handle='link_ready' target='_blank'>Your simulation is ready.</a>"+
						"<button handle='btn_cancel' class='button'>Cancel</button>" +
					"</div>" +
				"</div>";
	}
});