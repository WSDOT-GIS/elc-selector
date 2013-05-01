/*global require*/
/*jslint browser:true, white:true*/
require(["require", "dojo/on", "dojo/_base/Color","esri/urlUtils", "esri/map", "esri/layers/GraphicsLayer",
	"esri/tasks/Locator", "esri/tasks/RouteTask", "esri/renderers/SimpleRenderer",
	"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/graphic", "esri/InfoTemplate",
	"esri/dijit/Basemap", "esri/dijit/BasemapLayer",
	"esri/dijit/Attribution"],
	function (require, on, Color, urlUtils, Map, GraphicsLayer, Locator, RouteTask, SimpleRenderer, SimpleMarkerSymbol,
		SimpleLineSymbol, Graphic, InfoTemplate, Basemap, BasemapLayer) {
		"use strict";
		var map, locator, routeTask, stopsLayer, routesLayer, protocol;

		// Store the protocol (e.g., "https:")
		protocol = window.location.protocol;

		/**Converts an AddressCandidate into a string with the entire address on a single line.
		* (e.g., "742 Evergreen Terrace, Springfield, NT  58008")
		* @returns {string} An address on a single line.
		*/
		function /*string*/ addressCandidateToSingleLine(/*esri.tasks.AddressCandidate*/ addressCandidate) {
			var output = [], address;
			if (addressCandidate && addressCandidate.address) {
				address = addressCandidate.address;
				output.push(address.Address, ", ");
				output.push(address.City, ", ", address.Region, "  ", address.Postal);
			}
			return output.join("");
		}

		// Set the routing URL to use a proxy.  The proxy will handle getting tokens.
		urlUtils.addProxyRule({
			proxyUrl: "proxy.ashx",
			urlPrefix: protocol + "//route.arcgis.com"
		});

		// Create the map.
		map = new Map("map", {
			//basemap: "streets",
			basemap: new Basemap({
				id: "Hybrid",
				layers: [
					new BasemapLayer({ url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" }),
					new BasemapLayer({ url: "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer" }),
					new BasemapLayer({ url: "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer" })
				]
			}),
			center: [-120.80566406246835, 47.41322033015946],
			zoom: 7,
			showAttribution: true
		});

		// Create the event handler for when the map finishes loading...
		on(map, "load", function () {
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
			symbol = new SimpleLineSymbol();
			symbol.setColor("00ccff");
			routesLayer.setRenderer(new SimpleRenderer(symbol));
			map.addLayer(routesLayer);

			// Setup the locator.
			locator = new Locator(protocol + "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
			locator.setOutSpatialReference(map.spatialReference);

			// Setup the route task.
			routeTask = new RouteTask(protocol + "//route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");

			// Setup the map click event that will call the geocoder service.
			on(map, "click", function (evt) {
				if (evt.mapPoint) {
					locator.locationToAddress(evt.mapPoint, 10, function (/*esri.tasks.AddressCandidate*/ addressCandidate) {
						var graphic = new Graphic();
						graphic.setGeometry(addressCandidate.location);
						graphic.setAttributes({
							Name: addressCandidateToSingleLine(addressCandidate)
						});
						stopsLayer.add(graphic);
					}, function (error) {
						window.console.error(error);
					});
				}
			});

			// Setup the map double-click event to call the route service when two or more geocoded points are displayed on the map.
			on(map, "DblClick", function (event) {
				if (event.mapPoint && stopsLayer.graphics.length >= 2) {
					require(["esri/tasks/RouteParameters", "esri/tasks/FeatureSet", "esri/units"],
						function (RouteParameters, FeatureSet, Units) {
							var routeParams, features;

							features = new FeatureSet();
							features.features = stopsLayer.graphics;
							routeParams = new RouteParameters();
							routeParams.stops = features;
							routeParams.returnRoutes = true;
							routeParams.returnDirections = false;
							routeParams.directionsLengthUnits = Units.MILES;
							routeParams.outSpatialReference = map.spatialReference;

							routeTask.solve(routeParams, function (solveResults) {
								/* 
								@param {Array} solveResults.barriers
								@param {Array} solveResults.messages
								@param {Array} solveResults.polygonBarriers
								@param {Array} solveResults.polylineBarriers
								@param {esri.tasks.RouteResult[]} solveResults.routeResults

								{Graphic} routeResult.route
								{string} routeResult.routeName
								*/
								var i, l;
								if (solveResults && solveResults.routeResults && solveResults.routeResults.length) {
									for (i = 0, l = solveResults.routeResults.length; i < l; i += 1) {
										routesLayer.add(solveResults.routeResults[i].route);
									}
								}
								
								
								window.console.log(solveResults);
							}, routeParams, function (error) {
								window.console.error(error);
							});
						});
				}
			});
		});
	});