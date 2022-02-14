'use strict';

import Core from '../app-framework/tools/core.js';
import Dom from '../app-framework/tools/dom.js';
import Net from '../app-framework/tools/net.js';
import Templated from '../app-framework/components/templated.js';

export default Core.Templatable("App.Widgets.Simulator", class Simulator extends Templated { 

	set selected(value) { this._selected = value; }
	
	get selected() { return this._selected; }
	
	set visualization(value) { this._visualization = value; }
	
	get visualization() { return this._visualization; }

	constructor(node) {		
		super(node);
		
		this.selected = null;
		
		this.Elem("btn-simulate").addEventListener("click", this.OnSimulate_Click.bind(this));
		this.Elem("btn-cancel").addEventListener("click", this.OnCancel_Click.bind(this));
	}
		
	async OnSimulate_Click(ev) {
		this.Show("busy");
		
		var ids = Object.keys(this.selected);
		
		if (ids.length == 0) {
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
		
		const data = new FormData();
		
		data.append("params", JSON.stringify(params));
		data.append("visualization_config", this.visualization);
		
		try {
			var json = await Net.JSON("http://localhost:8080/api/complete/execute", { method: 'post', body: data });
		
			this.Elem('link-ready').setAttribute("href", "http://localhost:81/app-embed/index.html?uuid=" + json.uuid);
						
			this.Show("ready");
		}
		catch (error) {
			alert(error.toString());
			
			this.Show("idle");
		}
	}
	
	OnCancel_Click(ev) {
		this.Show("idle");
	}
	
	Show(type) {
		Dom.ToggleCss(this.Elem("idle"), "hidden", type != "idle");
		Dom.ToggleCss(this.Elem("busy"), "hidden", type != "busy");
		Dom.ToggleCss(this.Elem("ready"), "hidden", type != "ready");
	}
	
	Template() {
		return	"<div class='simulator-inner'>" + 
					"<div handle='idle' class='idle'>" + 
						"<div>Please select geometries on the map then, click on the <br>\"Simulate\" to generate and simulate the model.</div>" +
						"<button handle='btn-simulate' class='button'>Simulate</button>" +
					"</div>" +
					
					"<div handle='busy' class='busy hidden'>" + 
						"<div>Running simulation...</div>" +
						"<img src='./assets/spinner.gif' />" +
					"</div>" +
					
					"<div handle='ready' class='ready hidden'>" + 
						"<a handle='link-ready' target='_blank'>Your simulation is ready.</a>"+
						"<button handle='btn-cancel' class='button'>Cancel</button>" +
					"</div>" +
				"</div>";
	}
});