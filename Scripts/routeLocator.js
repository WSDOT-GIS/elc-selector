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
	"elc-arcgis-utils",
	"dojo/_base/connect"
], function (urlUtils, Map, GraphicsLayer, RouteTask, SimpleRenderer, SimpleMarkerSymbol,
		SimpleLineSymbol, Graphic, SpatialReference, jsonUtils, Extent, Polyline,
		InfoTemplate, Basemap, BasemapLayer,
		RouteParameters, FeatureSet, Units, elc, elcArcGisUtils, connect
) {
	"use strict";
	var map, pointsLayer, segmentsLayer, protocol, routeLocator;

	function compareRouteLocationsByArm(a, b) {
		return (a.Arm < b.Arm) ? -1 : (a.Arm > b.Arm) ? 1 : 0;
	}

	function RouteCollectionGroup() {
		this.increase = null;
		this.decrease = null;
	}

	/** Adds a RouteLocation to the array if it is an endpoint of the route segement.
	 * @param {RouteLocation[]} routeLocations - An array of RouteLocations. Can contain up to two objects. All elements must be from the same route and same direction.
	 * @param {RouteLocation} newRL - A route location to add to the routeLocations array. If this value is null or "falsey" then the "routeLocations" array will not be modified.
	 * @exception {TypeError} Thrown if "routeLocations" is null or undefined.
	 */
	function addToArrayIfAnEndpoint(routeLocations, newRL) {
		if (!routeLocations) {
			throw new TypeError("The routeLocations parameter was not provided.");
		} else if (routeLocations.length > 2) {
			// If there are more than two objects, the array will be sorted by ARM and 
			// then all but the first and last object will be removed from the array.
			routeLocations.sort(compareRouteLocationsByArm);
			routeLocations.splice(1, routeLocations.length - 2);
		}
		if (newRL) {
			if (routeLocations.length === 0) {
				// If the array is currently empty then the route location is simply added to it.
				routeLocations.push(newRL);
			} else if (routeLocations.length === 1) {
				// If the array has only one element the new element is added to either the 
				// beginning or ending of the array, depending on its ARM value.
				if (newRL.Arm > routeLocations[0].Arm) {
					routeLocations.push(newRL);
				} else {
					routeLocations.splice(0, 0, newRL);
				}
			} else {
				// If there are more than two elements already in the array the new element will
				// only be added if its ARM value is not between the ARM values of the elements
				// already in the array.
				if (newRL.Arm < routeLocations[0].Arm) {
					routeLocations.splice(0, 1, newRL);
				} else if (newRL.Arm > routeLocations[1].Arm) {
					routeLocations.splice(1, 1, newRL);
				}
			}
		}
	}

	/**
	 * Adds the route location to the appropriate array (either increase or decrease)
	 * if its ARM value is outside of the start and end points already in the array.
	 * @param {RouteLocation} routeLocation
	 */
	RouteCollectionGroup.prototype.add = function (routeLocation) {
		if (!routeLocation) {
			throw new TypeError();
		}

		if (routeLocation.decrease) {
			if (!this.decrease) {
				this.decrease = [];
			}
			addToArrayIfAnEndpoint(this.decrease, routeLocation);
		} else {
			if (!this.increase) {
				this.increase = [];
			}
			addToArrayIfAnEndpoint(this.increase, routeLocation);
		}
	};

	/**
	 * @returns {RouteLocation[]}
	 */
	RouteCollectionGroup.prototype.toRouteLocations = function () {
		var output = [], rl;

		function addToOutputArray(arr) {
			rl = new elc.RouteLocation();
			if (arr && arr.length) {
				rl.Route = arr[0].Route;
				rl.Arm = arr[0].Arm;
				rl.Decrease = arr[0].Decrease;
				if (arr.length > 1) {
					rl.EndArm = arr[1].Arm;
				}
				output.push(rl);
			}
		}

		addToOutputArray(this.increase);
		addToOutputArray(this.decrease);

		return output;
	};

	////RouteCollectionGroup.prototype.sort = function () {
	////	if (this.increase) {
	////		this.increase.sort(compareRouteLocationsByArm);
	////	}

	////	if (this.decrease) {
	////		this.decrease.sort(compareRouteLocationsByArm);
	////	}
	////};

	/**
	 * @param {RouteLocation[]} routeLocations
	 * @returns {Object.<string, RouteCollectionGroup>}
	 */
	function groupRouteLocations(routeLocations) {
		var output = {};

		routeLocations.forEach(function (rl) {
			// Create a property
			if (!output.hasOwnProperty(rl.Route)) {
				output[rl.Route] = new RouteCollectionGroup();
			}
			output[rl.Route].add(rl);
		});

		return output;
	}

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
		deleteButton.disabled = clearButton.disabled = !(pointsLayer.graphics.length > 0 || segmentsLayer.graphics.length > 0);
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
		if (pointsLayer.graphics.length > 0) {
			if (buttonId === "clearButton") {
				pointsLayer.clear();
			} else {
				removeLastGraphic(pointsLayer);
			}
		} else if (segmentsLayer.graphics.length > 0) {
			if (buttonId === "clearButton") {
				segmentsLayer.clear();
			} else {
				removeLastGraphic(segmentsLayer);
			}
		}
	}

	document.getElementById("deleteButton").addEventListener("click", deleteStopOrRoute);
	document.getElementById("clearButton").addEventListener("click", deleteStopOrRoute);

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
		pointsLayer = new GraphicsLayer({
			id: "stops"
		});
		pointsLayer.setInfoTemplate(new InfoTemplate("Route Point", toHtmlTable));
		symbol = new SimpleMarkerSymbol();
		symbol.setColor("00ccff");
		pointsLayer.setRenderer(new SimpleRenderer(symbol));
		map.addLayer(pointsLayer);

		// Create the routes graphics layer.
		segmentsLayer = new GraphicsLayer({
			id: "routes"
		});
		segmentsLayer.setInfoTemplate(new InfoTemplate("Route", "${*}"));
		symbol = new SimpleLineSymbol();
		symbol.setColor("00ccff");
		symbol.setWidth(10);
		segmentsLayer.setRenderer(new SimpleRenderer(symbol));
		map.addLayer(segmentsLayer);

		// Assign event handlers to layers.
		[pointsLayer, segmentsLayer].forEach(function (layer) {
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
								pointsLayer.add(g);
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

		map.on("dbl-click", function (/*evt*/) {
			var routeCollectionGroups = groupRouteLocations(pointsLayer.graphics.map(function (g) {
				return new elc.RouteLocation(g.attributes);
			}));

			var routeLocations = [], rc, arr;

			function addToRLArray(r) {
				routeLocations.push(r);
			}

			for (var routeName in routeCollectionGroups) {
				if (routeCollectionGroups.hasOwnProperty(routeName)) {
					rc = routeCollectionGroups[routeName];
					arr = rc.toRouteLocations();
					arr.forEach(addToRLArray);
				}
			}

			// Give each element a unique ID.
			routeLocations.forEach(function (v, i) {
				v.Id = i;
			});

			var params = {
				locations: routeLocations,
				referenceDate: Date.now(),
				outSR: map.spatialReference.wkid,
				successHandler: function (/**{RouteLocation[]}*/ routeLocations) {
					pointsLayer.clear();
					// Loop through each of the route locations. Convert to a graphic and add to the appropriate graphics layer.
					routeLocations.forEach(function (rl) {
						var graphic = elcArcGisUtils.routeLocationToGraphic(rl);
						var layer;
						if (graphic && graphic.geometry && graphic.geometry.type) {
							layer = /point/i.test(graphic.geometry.type) ? pointsLayer : segmentsLayer;
							layer.add(graphic);
						}
					});
					console.log("route segments", routeLocations);
				},
				errorHandler: function (error) {
					error.input = params;
					console.error("error retrieving route segments.", error);
				}
			};

			routeLocator.findRouteLocations(params);

		});
	});
});