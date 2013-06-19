/*global define*/
/*jslint nomen:true,white:true*/
define(["dojo/_base/declare", "esri/tasks/locator"], function (declare, Locator) {
	"use strict";
	return declare([Locator], {

		constructor: function (/**{String*/ url) {
			// TODO: Call base constructor, passing in the "url" parameter.
		},
		/** Locations an intersection based on a given point.
		 * @param {esri/geometry/Point} location The point at which to search for the closest address. The location should be in the same spatial reference as that of the geocode service.
		 * @param {Number} distance The distance in meters from the given location within which a matching address should be searched. If this parameter is not provided or an invalid value is provided, a default value of 0 meters is used.
		 * @param {Function} callback The function to call when the method has completed. The arguments in the function are the same as the onLocationToAddressComplete event.
		 * @param {Function} errback An error object is returned if an error occurs on the Server during task execution.
		 * @returns {dojo/Deferred}
		*/
		locationToIntersection: function (location, distance, callback, errback) {
			// TODO: Implement this function.
			throw new Error("Not implemented.");
		}
	});
});