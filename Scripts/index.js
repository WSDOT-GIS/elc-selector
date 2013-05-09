/*global require*/
/*jslint browser:true, white:true*/
require(["require", "dojo/dom", "dojo/on", "esri/urlUtils", "esri/map", "esri/layers/GraphicsLayer",
	"esri/tasks/Locator", "esri/tasks/RouteTask", "esri/renderers/SimpleRenderer",
	"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/graphic", "esri/InfoTemplate",
	"esri/dijit/Basemap", "esri/dijit/BasemapLayer", "esri/layers/ArcGISDynamicMapServiceLayer",
	"dojo/_base/connect",
	"esri/dijit/Attribution"],
	function (require, dom, on, urlUtils, Map, GraphicsLayer, Locator, RouteTask, SimpleRenderer, SimpleMarkerSymbol,
		SimpleLineSymbol, Graphic, InfoTemplate, Basemap, BasemapLayer, ArcGISDynamicMapServiceLayer, connect) {
		"use strict";
		var map, locator, routeTask, stopsLayer, routesLayer, protocol, trafficLayer;

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
		urlUtils.addProxyRule({
			proxyUrl: "proxy.ashx",
			urlPrefix: protocol + "//traffic.arcgis.com"
		});

		// Create the map.
		map = new Map("map", {
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

		connect.connect(map, "onUpdateStart", function () {
			dom.byId("mapProgress").hidden = false;
		});

		connect.connect(map, "onUpdateEnd", function () {
			dom.byId("mapProgress").hidden = true;
		});

		// Create the event handler for when the map finishes loading...
		on(map, "load", function () {
			var symbol;

			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function (position) {
					require(["esri/geometry/Point"], function (Point) {
						var x, y;
						x = position.coords.longitude;
						y = position.coords.latitude;
						map.centerAndZoom(new Point(x, y), 15);
					});
				}, function (error) {
					window.console.error(error);
				});
			}


			on(dom.byId("trafficCheckbox"), "click", function (e) {
				if (this.checked) {
					if (!trafficLayer) {
						trafficLayer = new ArcGISDynamicMapServiceLayer(protocol + "//traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", {
							id: "traffic"
						});
						map.addLayer(trafficLayer);
					}
					trafficLayer.show();
				} else {
					if (trafficLayer) {
						trafficLayer.hide();
					}
				}
			});


			

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
								
								stopsLayer.clear();
								window.console.log(solveResults);
							}, routeParams, function (error) {
								window.console.error(error);
							});
						});
				}
			});
		});
	});