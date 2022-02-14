'use strict';

import Core from '../app-framework/tools/core.js';
import Dom from '../app-framework/tools/dom.js';
import Net from '../app-framework/tools/net.js';
import Style from '../app-framework/tools/style.js'
import Templated from '../app-framework/components/templated.js';
import Content from '../app-framework/widgets/gis/popup.js';
import Simulator from './simulator.js';

import Map from '../app-framework/components/ol/map.js'

export default Core.Templatable("Application", class Application extends Templated { 

	constructor(node) {		
		super(node);
		
		this.simulator = this.Widget("simulator");
		this.map = new Map(this.Elem("map"), [Map.BasemapOSM(true)]);
		
		this.map.SetView([-75.7, 45.3], 10);
		
		this.popup_content = new Content(this.map.popup.content, { 
			get_title: f => `CSD: ${f.getProperties()["UID"]}`,
			get_content: f => {		
				return `<ul>` +
						  `<li>Name: ${f.getProperties()["Name"]}</li>` +
						  `<li>Province: ${f.getProperties()["Province"]}</li>` +
					   `</ul>`;				
			}
		});
				
		this.init();
	}
	
	async init() {
		this.config = await Net.JSON("./config.json");
		
		this.simulator.selected = {};
		this.simulator.visualization = await Net.File("./assets/visualization.json");
		
		this.styles = {
			csd: Style.FromJson("polygon", this.config.csd.style).Symbol(),
			hospitals: Style.FromJson("point", this.config.hospitals.style).Symbol(),
			highlight: Style.FromJson("polygon", this.config.highlight).Symbol()
		}
		
		this.map_data = await Promise.all([
			Net.JSON(this.config.csd.url), 
			Net.JSON(this.config.hospitals.url)
		])
		
		this.load_layer(this.config.csd, this.map_data[0], this.styles.csd);
		this.load_layer(this.config.hospitals, this.map_data[1], this.styles.hospitals);
				
		this.map.On("click", this.OnMap_Click.bind(this));
	}
	
	async load_layer(cfg, data, style) {		
		var layer = this.map.AddGeoJsonLayer(cfg.id, data);
		
		layer.setZIndex(cfg.z);
		layer.setStyle(style);
	}
	
	OnMap_Click(ev) {
		this.map.ShowPopup(null);
		
		var features = ev.features.filter(f => f.layer == "csd").map(f => f.feature);
		
		features.forEach(f => {
			var id = f.getProperties()[this.config.csd.key];
			
			if (this.simulator.selected[id]) {
				f.setStyle(this.styles.csd);
				
				delete this.simulator.selected[id];
			}
			
			else {
				this.simulator.selected[id] = f;
				
				f.setStyle(this.styles.highlight);
			}
		});
		
		this.popup_content.fill(features);
				
		this.map.popup.setPosition(ev.coordinates);
	}
		
	Template() {
		return	"<main handle='main' class='map-container'>" +
					"<div handle='map' class='map'></div>" +
					"<div handle='simulator' class='overmap simulator ol-control' widget='App.Widgets.Simulator'></div>" +
				"</main>";
	}
});