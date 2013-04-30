require(["dojo/on", "esri/map", "esri/dijit/Attribution"], function (on, Map) {
	var map;

	map = new Map("map", {
		basemap: "hybrid",
		center: [-120.80566406246835, 47.41322033015946],
		zoom: 7,
		showAttribution: true
	});

	on(map, "load", function () {
		on(map, "click", function (evt) {
			if (evt.mapPoint) {
				console.log(evt.mapPoint);
			}
		});
	});
});