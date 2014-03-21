/*global define*/
define(["elc", "esri/geometry/jsonUtils", "esri/graphic"], function (elc, jsonUtils, Graphic) {
	"use strict";

	return {
		/** 
		 * Gets the RouteLocation's RouteGeometry as an Esri Geometry.
		 * @param {elc.RouteLocation} routeLocation
		 * @returns {esri/geometry/Geometry}
		 */
		getRouteGeometryFromRouteLocation: function (routeLocation) {
			var output = null;
			if (routeLocation && routeLocation.RouteGeometry) {
				output = jsonUtils.fromJson(routeLocation.RouteGeometry);
			}
			return output;
		},

		/**
		 * Converts a RouteLocation into an Esri Graphic object.
		 * @param {RouteLocation} routeLocation
		 * @returns {esri/Graphic}
		 */
		routeLocationToGraphic: function (routeLocation) {
			var attributes = {};
			for (var propName in routeLocation) {
				if (routeLocation.hasOwnProperty(propName)) {
					attributes[propName] = routeLocation[propName];
				}
			}
			return new Graphic({
				geometry: this.getRouteGeometryFromRouteLocation(routeLocation),
				attributes: attributes
			});
		}
	};
});