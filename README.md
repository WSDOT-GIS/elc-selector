# CIA Local Roads Selector #

Developed for the WSDOT Construction Impact Analysis (CIA) application, this control that can be used to select a road segment between two intersections.

## Getting started ##

In order to run this application you will need to [create OAuth Credentials] to access Esri's secure services. Once you have done this, perform the following steps.

1. Create a copy of `Sample.Web.Config` and call it `Web.Config`.
2. Provide values for the `agolClientId` and `agolClientSecret` settings in `Web.Config`.

The `Web.Config` file is ignored by the repository to avoid sensitive information being commited to this publicly-accessible repository.

## Components ##

### routeLocator.html ###

This is the route locator control. You place it into another page using an `iframe` element.

#### `data-` attributes ####

The route locator can be controlled and restricted by applying certain `data-` attributes to its `iframe` container element.

* `data-extent`: Allows an initial extent for the map to be specified using a comma-separated list of four numbers: xmin, ymin, xmax, ymax.
* `data-routes`: A list of routes that will be shown in the map when it is created.
* `data-route-limit`: Setting this value to a number will make it so that no more than this number of routes can be added to the map.

##### Example ####
```html
<iframe id="defaultFunctionality" src="../routeLocator.html"
	data-route-limit="1"
	data-extent='-13603483.591966238,6105001.562563945,-13601954.851400495,6106148.117988253'
	data-routes='[{"name":"Broadway Ave & Broadway, Everett, Washington 98201 - Walnut St & 19th St, Everett, Washington 98201","wkt":"MULTILINESTRING ((1223777.0363041605 974286.4877257114, 1223938.2201941456 974283.0113976741, 1224134.034042777 974275.140388624, 1224479.1379762676 974260.4061769943, 1224824.3207971738 974249.3260509287, 1225166.9767772476 974234.6568145567, 1225355.4455387671 974226.9561179036, 1225678.5910221795 974216.3648643482, 1226026.1452692528 974201.6057042377, 1226363.9833899096 974190.7107014619, 1226613.66964021 974181.7100350896, 1226711.538362319 974175.9640899752, 1226712.4934973922 974175.9041382241))"}]'></iframe>
```


### ReverseGeocodeIntersection.ashx ###

This provides a REST endpoint for finding an intersection using reverse geocode. This feature is lacking from the ArcGIS REST API, so the ArcGIS SOAP API is called by this handler.

#### proxy.ashx ####

This proxy is used to get ArcGIS REST resources. This handles the retrieval of tokens so that none of this information is revealed client-side.

## Development environment ##

This project was created in Visual Studio 2013.

## License ##
Licensed under [The MIT License]. See the [LICENSE] file for details.

[create OAuth Credentials]:http://resources.arcgis.com/en/help/arcgis-rest-api/#/Accessing_services_provided_by_Esri/02r300000268000000/
[The MIT License]:http://opensource.org/licenses/MIT
[LICENSE]:LICENSE
