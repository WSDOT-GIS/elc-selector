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
		SimpleLineSymbol, Graphic, SpatialReference, Extent, Polyline, InfoTemplate, Basemap, BasemapLayer,
		RouteParameters, FeatureSet, Units, elc, connect) {
	"use strict";
	var map, stopsLayer, routesLayer, protocol;

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

	// Store the protocol (e.g., "https:")
	protocol = window.location.protocol;

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

	map.on("extent-change", function (e) { console.log(e); });

	// Setup events to show a progress bar when the map is updating.
	connect.connect(map, "onUpdateStart", function () {
		document.getElementById("mapProgress").style.visibility = "";
	});

	connect.connect(map, "onUpdateEnd", function () {
		document.getElementById("mapProgress").style.visibility = "hidden";
	});

	/////** Performs an action based on a message passed to the window from a parent.
	//// * @param {MessageEvent} e
	//// * @param {Object} e.data
	//// * @param {string} e.data.action - The action name. E.g., "delete"
	//// * @param {string} e.data.name - The name of the route. E.g., "Hewitt Ave & 20th St SE, Lake Stevens, Washington  98258 - Hewitt Ave & 20th St SE, Lake Stevens, Washington  98258"
	//// * @param {string} [e.data.wkt] - The 2927 Simple Geometry WKT of the route. This property will only be present if action is "add".
	//// */
	////function handleRouteMessage(e) {
	////	var data = e.data, graphic, extent;
	////	if (data.action === "delete") {
	////		deleteGraphicWithMatchingName(data.name);
	////	} else if (data.action === "add") {
	////		try {
	////			graphic = ciaRouteToFeature(e.data);
	////			routesLayer.add(graphic);
	////			// Zoom the map to the graphic
	////			extent = graphic.geometry.getExtent();
	////			map.setExtent(extent);
	////		} catch (err) {
	////			window.parent.postMessage({
	////				error: err.message,
	////				sourceMessage: e.data
	////			}, [location.protocol, location.host].join("//"));
	////		}
	////	}
	////}

	////// Add an event handler for messages passed to this window while hosted in an iframe from the parent window.
	////window.addEventListener("message", handleRouteMessage);

	// Create the event handler for when the map finishes loading...
	map.on("load", function () {
		var symbol;

		// Disable zooming on map double-click.  Double click will be used to create a route.
		map.disableDoubleClickZoom();

		// Create the graphics layer that will be used to show the stop graphics.
		stopsLayer = new GraphicsLayer({
			id: "stops"
		});
		stopsLayer.setInfoTemplate(new InfoTemplate("Address", "${Name}"));
		symbol = new SimpleMarkerSymbol();
		symbol.setColor("00ccff");
		stopsLayer.setRenderer(new SimpleRenderer(symbol));
		map.addLayer(stopsLayer);

		// Create the routes graphics layer.
		routesLayer = new GraphicsLayer({
			id: "routes"
		});
		routesLayer.setInfoTemplate(new InfoTemplate("Route", "${Name}"));
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
			if (evt.mapPoint) {
				////locator.locationToIntersection(evt.mapPoint, 10, function (/*esri.tasks.AddressCandidate*/ addressCandidate) {
				////	var graphic = new Graphic();
				////	graphic.setGeometry(addressCandidate.location);
				////	graphic.setAttributes({
				////		Name: addressCandidateToSingleLine(addressCandidate)
				////	});
				////	stopsLayer.add(graphic);
				////}, function (error) {
				////	window.console.error(error);
				////});
			}
		});

		// Setup the map double-click event to call the route service when two or more geocoded points are displayed on the map.
		map.on("dbl-click", function (event) {
			if (event.mapPoint && stopsLayer.graphics.length >= 2) {
				////var routeParams, features;

				////features = new FeatureSet();
				////features.features = stopsLayer.graphics;
				////routeParams = new RouteParameters();
				////routeParams.stops = features;
				////routeParams.returnRoutes = true;
				////routeParams.returnDirections = false;
				////routeParams.directionsLengthUnits = Units.MILES;
				////routeParams.outSpatialReference = map.spatialReference;
				////routeParams.restrictionAttributes = ["none"];

				////routeTask.solve(routeParams, solveHandler, function (error) {
				////	window.console.error(error);
				////});
			}
		});
	});
});