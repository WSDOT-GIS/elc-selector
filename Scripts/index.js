/*global require*/
/*jslint browser:true*/
require(["dojo/on", "esri/urlUtils", "esri/map", "esri/layers/GraphicsLayer",
	"esri/tasks/Locator", "esri/tasks/RouteTask", "esri/renderers/SimpleRenderer",
	"esri/symbols/SimpleMarkerSymbol", "esri/graphic", "esri/InfoTemplate",
	"esri/dijit/Attribution"],
	function (on, urlUtils, Map, GraphicsLayer, Locator, RouteTask, SimpleRenderer, SimpleMarkerSymbol, Graphic,
		InfoTemplate) {
		"use strict";
		var map, locator, routeTask, stopsLayer, protocol = window.location.protocol;

		function addressCandidateToSingleLine(/*esri.tasks.AddressCandidate*/ addressCandidate) {
			var output = [], address;
			if (addressCandidate && addressCandidate.address) {
				address = addressCandidate.address;
				output.push(address.Address, "</br>");
				output.push(address.City, ", ", address.Region, "  ", address.Postal);
			}
			return output.join("");
		}

		/** Converts an graphic with an addressCandidate graphic
		*/
		function addressCandidateGraphicToDL(/*Graphic*/ graphic) {
			return addressCandidateToSingleLine(graphic.attributes.addressCandidate);
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


			var symbol = new SimpleMarkerSymbol();


			stopsLayer = new GraphicsLayer();
			stopsLayer.setInfoTemplate(new InfoTemplate("Address", addressCandidateGraphicToDL));
			stopsLayer.setRenderer(new SimpleRenderer(symbol));
			map.addLayer(stopsLayer);

			locator = new Locator(protocol + "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
			locator.setOutSpatialReference(map.spatialReference);

			routeTask = new RouteTask(protocol + "//route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");

			on(map, "click", function (evt) {
				if (evt.mapPoint) {
					// console.log(evt.mapPoint);
					locator.locationToAddress(evt.mapPoint, 100, function (/*esri.tasks.AddressCandidate*/ addressCandidate) {
						// window.console.log(addressCandidate);
						var graphic = new Graphic();
						graphic.setGeometry(addressCandidate.location);
						graphic.setAttributes({
							addressCandidate: addressCandidate
						});
						stopsLayer.add(graphic);
					}, function (error) {
						window.console.error(error);
					});
				}
			});
		});
	});