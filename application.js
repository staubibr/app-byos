'use strict';

import Core from '../app-framework/tools/core.js';
import Dom from '../app-framework/tools/dom.js';
import Net from '../app-framework/tools/net.js';
import Style from '../app-framework/tools/style.js'
import Application from '../app-framework/base/application.js';
import Content from '../app-framework/widgets/gis/popup-content.js';
import Simulator from './simulator.js';

import Map from '../app-framework/components/ol/map.js'

export default class AppByos extends Application { 

	get hospitals() { return this.simulator.params.hospitals; }
	get csd() { return this.simulator.params.csd; }

	constructor(node) {		
		super(node);
		
		this.simulator = this.elems.simulator;
		this.map = new Map(this.elems.map, [Map.basemap_osm(true)]);
		
		this.map.set_view([-75.7, 45.3], 10);
		
		this.popup_content = new Content(this.map.popup.content, { 
			get_title: f => {
				if (f.layer == "csd") return `CSD: ${f.feature.getProperties()["UID"]}`;
				
				if (f.layer == "hospitals") return `Hospital: ${f.feature.getProperties()["index"]}`;
			},
			get_content: f => {
				if (f.layer == "csd") return this.get_content_csd(f.feature);
				
				if (f.layer == "hospitals") return this.get_content_hospital(f.feature);
			}
		});
				
		this.init();
	}
	
	get_content_csd(f) {
		var p = f.getProperties();
		var ul = Dom.create('ul');
		var id = f.getProperties()["UID"];
		
		Dom.create('li', { innerHTML:`<span>Name: ${p["Name"]}</span>` }, ul);
		Dom.create('li', { innerHTML:`<span>Province: ${p["Province"]}</span>` }, ul);
				
		return ul;
	}
	
	get_content_hospital(f) {
		var p = f.getProperties();
		var ul = Dom.create('ul');
		var id = f.getProperties()["index"];
		
		var li_1 = Dom.create('li', { innerHTML:`<span>Name: ${p["facility_name"]}</span>` }, ul);
		var li_2 = Dom.create('li', { innerHTML:`<span>Capacity: </span>` }, ul);
		var li_3 = Dom.create('li', { innerHTML:`<span>Rate: </span>` }, ul);
		var li_4 = Dom.create('li', { innerHTML:`<span>Type: ${p["source_facility_type"]}</span>` }, ul);
		
		var v_capacity = this.hospitals[id] && this.hospitals[id].capacity || p["capacity"];
		var v_rate = this.hospitals[id] && this.hospitals[id].rate || p["rate"];
		
		var capacity = Dom.create("input", { type:"number", value:v_capacity }, li_2);
		var rate = Dom.create("input", { type:"number", value:v_rate }, li_3);
		
		var handler = (ev) => this.hospitals[id] = { capacity: capacity.value, rate: rate.value }
		
		capacity.addEventListener("change", handler);
		rate.addEventListener("change", handler);
		
		return ul;
	}
	
	async init() {
		this.config = await Net.json("./config.json");
		
		this.simulator.visualization = await Net.file("./assets/visualization.json");
		
		this.config.csd.style = Style.from_json("polygon", this.config.csd.style).symbol();
		this.config.csd.highlight = Style.from_json("polygon", this.config.csd.highlight).symbol();
		this.config.hospitals.style = Style.from_json("point", this.config.hospitals.style).symbol();
		this.config.hospitals.highlight = Style.from_json("point", this.config.hospitals.highlight).symbol();
		
		this.map_data = await Promise.all([
			Net.json(this.config.csd.url), 
			Net.json(this.config.hospitals.url)
		])
		
		this.load_layer(this.config.csd, this.map_data[0], this.config.csd.style);
		this.load_layer(this.config.hospitals, this.map_data[1], this.config.hospitals.style);
				
		this.map.on("click", this.on_map_click.bind(this));
	}
	
	async load_layer(cfg, data, style) {		
		var layer = this.map.add_geojson_layer(cfg.id, data);
		
		layer.setZIndex(cfg.z);
		layer.setStyle(style);
	}
	
	on_map_click(ev) {
		this.map.show_popup(null);
		
		ev.features.forEach(f => {
			var l = this.config[f.layer];
			var id = f.feature.getProperties()[l.key];

			if (f.layer != "csd") return;

			if (this.csd[id]) {
				f.feature.setStyle(this.config[f.layer].style);
				
				delete this.csd[id];
			}
			else {
				this.csd[id] = f.feature;
				
				f.feature.setStyle(this.config[f.layer].highlight);
			}
		});
		
		this.popup_content.fill(ev.features);
				
		this.map.popup.setPosition(ev.coordinates);
	}
		
	html() {
		return	"<main handle='main' class='map-container'>" +
					"<div handle='map' class='map'></div>" +
					"<div handle='simulator' widget='App.Widget.Simulator'></div>" +
				"</main>";
	}
}