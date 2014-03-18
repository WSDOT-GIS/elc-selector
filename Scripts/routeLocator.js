/*global require*/
/*jslint browser:true, white:true,vars:true*/
require([
	"esri/urlUtils",
	"esri/map",
	"esri/layers/GraphicsLayer",
	"esri/tasks/RouteTask",
	"esri/renderers/SimpleRenderer",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/graphic",
	"esri/SpatialReference",
	"esri/geometry/jsonUtils",
	"esri/geometry/Extent",
	"esri/geometry/Polyline",
	"esri/InfoTemplate",
	"esri/dijit/Basemap",
	"esri/dijit/BasemapLayer",
	"esri/tasks/RouteParameters",
	"esri/tasks/FeatureSet",
	"esri/units",
	"elc",
	"dojo/_base/connect"
], function (urlUtils, Map, GraphicsLayer, RouteTask, SimpleRenderer, SimpleMarkerSymbol,
		SimpleLineSymbol, Graphic, SpatialReference, jsonUtils, Extent, Polyline,
		InfoTemplate, Basemap, BasemapLayer,
		RouteParameters, FeatureSet, Units, elc, connect
) {
	"use strict";
	var map, stopsLayer, routesLayer, protocol, routeLocator;

	/** Splits a camel-case or Pascal-case variable name into individual words.
	 * @param {string} s
	 * @returns {string[]}
	 */
	function splitWords(s) {
		var re, match, output = [];
		// re = /[A-Z]?[a-z]+/g
		re = /([A-Za-z]?)([a-z]+)/g;

		/*
		matches example: "oneTwoThree"
		["one", "o", "ne"]
		["Two", "T", "wo"]
		["Three", "T", "hree"]
		*/

		match = re.exec(s);
		while (match) {
			// output.push(match.join(""));
			output.push([match[1].toUpperCase(), match[2]].join(""));
			match = re.exec(s);
		}

		return output;

	}

	/**
	 * Formats the date object into month/day/year format.
	 * @param {Date} date
	 * @returns {string}
	 */
	function formatDate(date) {
		return [date.getMonth() + 1, date.getDay(), date.getFullYear()].join("/");
	}

	/**
	 * Formats a graphic's attributes into an HTML table.
	 * @param {esri/Graphic} graphic
	 * @returns {HTMLTableElement}
	 */
	function toHtmlTable(graphic) {
		var attributes, table, row, cell, value, omitNamesRe;
		attributes = graphic.attributes;
		table = document.createElement("table");
		omitNamesRe = /(?:(?:Id)|(?:EventPoint)|(?:RouteGeometry))/i;
		for (var name in attributes) {
			if (attributes.hasOwnProperty(name)) {
				value = attributes[name];
				if (value !== null && value !== "" && !omitNamesRe.test(name) && !(name === "Back" && !value)) {
					row = table.insertRow(-1);
					cell = row.insertCell(-1);
					cell.textContent = splitWords(name).join(" ");
					cell = row.insertCell(-1);
					if (value instanceof Date) {
						value = formatDate(value);
					}
					cell.textContent = value;
				}
			}
		}
		return table;
	}

	/**
	 * Gets the extent from the iframe's data-extent attribute (if it exists).
	 * @returns {(Extent|null)} Return the extent if one exists, null otherwise.
	 */
	function getExtentFromDataAttribute() {
		var extent;
		if (window.frameElement) {
			if (window.frameElement.dataset) {
				extent = window.frameElement.dataset.extent;
			} else {
				extent = window.frameElement.getAttribute("data-extent");
			}
		}
		if (extent) {
			// Split at commas into separate numbers.
			extent = extent.split(",").map(function (v) { return Number(v); });
			extent = new Extent(extent[0], extent[1], extent[2], extent[3], new SpatialReference({ wkid: 3857 }));
		}
		return extent;
	}

	function routeLocationToGraphic(routeLocation) {
		var geometry = jsonUtils.fromJson(routeLocation.RouteGeometry);
		var attributes = {};
		for (var propName in routeLocation) {
			if (routeLocation.hasOwnProperty(propName)) {
				attributes[propName] = routeLocation[propName];
			}
		}
		var graphic = new Graphic(geometry, null, attributes);
		return graphic;
	}

	// Store the protocol (e.g., "https:")
	protocol = window.location.protocol;

	routeLocator = new elc.RouteLocator();

	/** Disables the clear and delete buttons of there are no graphics in the map.
	 */
	function setDisabledStatusOfButtons() {
		var deleteButton = document.getElementById("deleteButton"), clearButton = document.getElementById("clearButton");
		deleteButton.disabled = clearButton.disabled = !(stopsLayer.graphics.length > 0 || routesLayer.graphics.length > 0);
	}

	/** @callback {LayerGraphicEvent}
	 * @property {Graphic} graphic
	 * @property {GraphicsLayer} target
	 */

	/** Posts a message to the parent window
	 * @param {LayerGraphicEvent} e
	 * @param {string} action
	 */
	function postGraphicMessage(e, action) {
		var message = {
			layerId: e.target.id,
			action: action,
			graphic: e.graphic.toJson()
		};
		message.name = e.graphic.attributes.Name;
		window.parent.postMessage(message, [location.protocol, location.host].join("//"));
	}

	/** Posts a message to the parent window
	 * @param {LayerGraphicEvent} e
	 */
	function postGraphicAddMessage(e) {
		postGraphicMessage(e, "added");
	}

	/** Posts a message to the parent window
	 * @param {LayerGraphicEvent} e
	 */
	function postGraphicRemoveMessage(e) {
		postGraphicMessage(e, "removed");
	}

	/** Removes the last graphic from a layer list.
	 * @returns {Graphic} Returns the graphic that was removed.
	 */
	function removeLastGraphic(/**{GraphicsLayer}*/ layer) {
		var graphic = null;
		if (layer.graphics.length > 0) {
			graphic = layer.graphics[layer.graphics.length - 1];
			layer.remove(graphic);
		}
		return graphic;
	}

	/** Event handler for delete button.
	 * If the clicked button is the "clearButton", all graphics from a layer will be cleared.
	 * @param {MouseEvent} e
	 * @param {HTMLButtonElement} e.target
	 */
	function deleteStopOrRoute(e) {
		var buttonId = e.target.id;
		if (stopsLayer.graphics.length > 0) {
			if (buttonId === "clearButton") {
				stopsLayer.clear();
			} else {
				removeLastGraphic(stopsLayer);
			}
		} else if (routesLayer.graphics.length > 0) {
			if (buttonId === "clearButton") {
				routesLayer.clear();
			} else {
				removeLastGraphic(routesLayer);
			}
		}
	}

	document.getElementById("deleteButton").addEventListener("click", deleteStopOrRoute);
	document.getElementById("clearButton").addEventListener("click", deleteStopOrRoute);

	// Set the routing URL to use a proxy.  The proxy will handle getting tokens.
	urlUtils.addProxyRule({
		proxyUrl: "proxy.ashx",
		urlPrefix: protocol + "//route.arcgis.com"
	});

	/**
	 * Creates the map options object for the Map constructor.
	 * @returns {Object}
	 */
	function createMapOptions() {
		var options = {
			basemap: new Basemap({
				id: "Hybrid",
				layers: [
					new BasemapLayer({ url: protocol + "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" }),
					new BasemapLayer({ url: protocol + "//services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer" }),
					new BasemapLayer({ url: protocol + "//services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer" })
				]
			}),
			showAttribution: true

		};
		var extent = getExtentFromDataAttribute();
		if (extent) {
			options.extent = extent;
		} else {
			options.center = [-120.80566406246835, 47.41322033015946];
			options.zoom = 7;
		}

		return options;
	}

	// Create the map.
	map = new Map("map", createMapOptions());

	// Setup events to show a progress bar when the map is updating.
	connect.connect(map, "onUpdateStart", function () {
		document.getElementById("mapProgress").style.visibility = "";
	});

	connect.connect(map, "onUpdateEnd", function () {
		document.getElementById("mapProgress").style.visibility = "hidden";
	});

	// Create the event handler for when the map finishes loading...
	map.on("load", function () {
		var symbol;

		// Disable zooming on map double-click.  Double click will be used to create a route.
		map.disableDoubleClickZoom();

		// Create the graphics layer that will be used to show the stop graphics.
		stopsLayer = new GraphicsLayer({
			id: "stops"
		});
		stopsLayer.setInfoTemplate(new InfoTemplate("Route Point", toHtmlTable));
		symbol = new SimpleMarkerSymbol();
		symbol.setColor("00ccff");
		stopsLayer.setRenderer(new SimpleRenderer(symbol));
		map.addLayer(stopsLayer);

		// Create the routes graphics layer.
		routesLayer = new GraphicsLayer({
			id: "routes"
		});
		routesLayer.setInfoTemplate(new InfoTemplate("Route", "${*}"));
		symbol = new SimpleLineSymbol();
		symbol.setColor("00ccff");
		symbol.setWidth(10);
		routesLayer.setRenderer(new SimpleRenderer(symbol));
		map.addLayer(routesLayer);

		// Assign event handlers to layers.
		[stopsLayer, routesLayer].forEach(function (layer) {
			layer.on("graphic-add", setDisabledStatusOfButtons);
			layer.on("graphic-remove", setDisabledStatusOfButtons);

			layer.on("graphic-add", postGraphicAddMessage);
			layer.on("graphic-remove", postGraphicRemoveMessage);
		});

		// Setup the map click event that will call the geocoder service.
		map.on("click", function (evt) {
			var graphics;
			if (evt.mapPoint) {
				routeLocator.findNearestRouteLocations({
					coordinates: [evt.mapPoint.x, evt.mapPoint.y],
					referenceDate: new Date(),
					searchRadius: 50,
					inSR: map.spatialReference.wkid,
					outSR: map.spatialReference.wkid,
					successHandler: function (data) {
						if (data.length === 0) {
							alert("No route locations found near where you clicked.");
						} else {
							graphics = data.map(routeLocationToGraphic);
							graphics.forEach(function (g) {
								stopsLayer.add(g);
							});
						}
					},
					errorHandler: function (err) {
						if (console) {
							if (console.error) {
								console.error(err);
							}
						}
					}
				});
			}
		});
	});
});