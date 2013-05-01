/*global require*/
/*jslint browser:true*/
require(["require", "dojo/on", "esri/urlUtils", "esri/map", "esri/layers/GraphicsLayer",
	"esri/tasks/Locator", "esri/tasks/RouteTask", "esri/renderers/SimpleRenderer",
	"esri/symbols/SimpleMarkerSymbol", "esri/graphic", "esri/InfoTemplate",
	"esri/dijit/Attribution"],
	function (require, on, urlUtils, Map, GraphicsLayer, Locator, RouteTask, SimpleRenderer, SimpleMarkerSymbol, Graphic,
		InfoTemplate) {
		"use strict";
		var map, locator, routeTask, stopsLayer, protocol = window.location.protocol;

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

		urlUtils.addProxyRule({
			proxyUrl: "proxy.ashx",
			urlPrefix: protocol + "//route.arcgis.com"
		});

		map = new Map("map", {
			basemap: "streets",
			center: [-120.80566406246835, 47.41322033015946],
			zoom: 7,
			showAttribution: true
		});



		on(map, "load", function () {

			map.disableDoubleClickZoom();

			var symbol = new SimpleMarkerSymbol();


			stopsLayer = new GraphicsLayer();
			stopsLayer.setInfoTemplate(new InfoTemplate("Address", "${Name}"));
			stopsLayer.setRenderer(new SimpleRenderer(symbol));
			map.addLayer(stopsLayer);

			locator = new Locator(protocol + "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
			locator.setOutSpatialReference(map.spatialReference);

			routeTask = new RouteTask(protocol + "//route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");

			on(map, "click", function (evt) {
				if (evt.mapPoint) {
					locator.locationToAddress(evt.mapPoint, 100, function (/*esri.tasks.AddressCandidate*/ addressCandidate) {
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
								window.console.log(solveResults);
							}, routeParams, function (error) {
								window.console.error(error);
							});
						});
				}
			});
		});
	});