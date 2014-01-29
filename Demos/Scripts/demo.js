/*jslint white:true,browser:true*/
(function () {
	"use strict";

	/** Sends a "delete" message to the window inside of the iframe.
	 * @param {MouseEvent}
	 * @this {HTMLButtonElement}
	 */
	function sendRouteDeleteMessage(e) {
		var button, routeName;
		// Get the button that was clicked.
		button = e.target || e.srcElement || e.toElement;
		// The name of the associated route is stored in the button's "value" attribute.
		routeName = button.value;
		// Since there is only one iframe on this page, we know that window.frames[0]
		// will return the window inside of that iframe.
		//
		// Post a "delete" message to the window in the iframe.
		window.frames[0].postMessage({
			action: "delete",
			name: routeName
		}, [location.protocol, location.host].join("//"));
	}

	window.addEventListener("message", function (/** {MessageEvent} */ e) {
		var table, row, cell, deleteButton;
		if (e.data.layerId === "routes") {
			table = document.getElementById("routeTable");
			if (e.data.action === "added") {
				// Add a row to the table for the added route.
				row = table.insertRow(-1);
				row.dataset.routeName = e.data.name;

				cell = row.insertCell(-1);
				cell.textContent = e.data.name;
				cell = row.insertCell(-1);
				// Create a button that, when clicked, will delete the corresponding route in the map.
				deleteButton = document.createElement("button");
				deleteButton.type = "button";
				deleteButton.value = e.data.name;
				deleteButton.textContent = "Delete";
				deleteButton.addEventListener("click", sendRouteDeleteMessage, true);
				cell.appendChild(deleteButton);
			} else if (e.data.action === "removed") {
				// Remove the row from the table corresponding to the removed route.
				row = document.querySelector("tr[data-route-name='" + e.data.name + "']");
				table.querySelector("tbody").removeChild(row);
			}
		}
	});
}());