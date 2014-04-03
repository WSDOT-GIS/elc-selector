/*jslint white:true,browser:true*/
(function () {
	"use strict";

	/////** Sends a "delete" message to the window inside of the iframe.
	//// * @param {MouseEvent}
	//// * @this {HTMLButtonElement}
	//// */
	////function sendRouteDeleteMessage(e) {
	////	var button, routeName;
	////	// Get the button that was clicked.
	////	button = e.target || e.srcElement || e.toElement;
	////	// The name of the associated route is stored in the button's "value" attribute.
	////	routeName = button.value;
	////	// Since there is only one iframe on this page, we know that window.frames[0]
	////	// will return the window inside of that iframe.
	////	//
	////	// Post a "delete" message to the window in the iframe.
	////	window.frames[0].postMessage({
	////		action: "delete",
	////		name: routeName
	////	}, [location.protocol, location.host].join("//"));
	////}

	////function addRoute(/**{Event}*/ e) {
	////	// Get the values from the text boxes.
	////	var form = e.srcElement || e.target, name = form[0].value, wkt = form[1].value;

	////	if (!name) {
	////		alert("Route name was not provided.");
	////	} else if (!wkt) {
	////		alert("Route geometry WKT was not provided.");
	////	} else {
	////		window.frames[0].postMessage({
	////			action: "add",
	////			name: name,
	////			wkt: wkt
	////		}, [location.protocol, location.host].join("//"));
	////	}

	////	// Return false to prevent form submission (i.e., reload of page with query string).
	////	return false;
	////}

	//// Using addEventListener on the form does not prevent submission event if returning false. 
	//// Must assign to onsubmit.
	//window.document.forms.addRouteForm.onsubmit = addRoute;

	window.addEventListener("message", function (/** {MessageEvent} */ e) {
		////var table, row, cell, deleteButton;
		////if (e.data.layerId === "routes") {
		////	table = document.getElementById("routeTable");
		////	if (e.data.action === "added") {
		////		// Add a row to the table for the added route.
		////		row = document.createElement("tr");
		////		//row.dataset.routeName = e.data.name;
		////		row.setAttribute("data-route-name", e.data.name);

		////		cell = row.insertCell(-1);
		////		cell.textContent = e.data.name;
		////		cell = row.insertCell(-1);
		////		// Create a button that, when clicked, will delete the corresponding route in the map.
		////		deleteButton = document.createElement("button");
		////		deleteButton.type = "button";
		////		deleteButton.value = e.data.name;
		////		deleteButton.textContent = "Delete";
		////		deleteButton.addEventListener("click", sendRouteDeleteMessage, true);
		////		cell.appendChild(deleteButton);

		////		cell = row.insertCell(-1);
		////		cell.textContent = e.data.wkt;

		////		table.querySelector("tbody").appendChild(row);
		////	} else if (e.data.action === "removed") {
		////		// Remove the row from the table corresponding to the removed route.
		////		row = document.querySelector("tr[data-route-name='" + e.data.name + "']");
		////		row.parentNode.removeChild(row);
		////	}
		////}
	});
}());