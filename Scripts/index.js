/*global require*/
require(["dojo/on", "esri/map", "esri/tasks/Locator", "esri/dijit/Attribution"], function (on, Map, Locator) {
	"use strict";
	var map, locator;

	map = new Map("map", {
		basemap: "streets",
		center: [-120.80566406246835, 47.41322033015946],
		zoom: 7,
		showAttribution: true
	});


	on(map, "load", function () {
		locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
		locator.setOutSpatialReference(map.spatialReference);
		on(map, "click", function (evt) {
			if (evt.mapPoint) {
				// console.log(evt.mapPoint);
				locator.locationToAddress(evt.mapPoint, 100, function (addressCandidates) {
					console.log(addressCandidates);
				}, function (error) {
					console.error(error);
				});
			}
		});
	});
});