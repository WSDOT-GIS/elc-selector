Notes
=====

## regular expressions ##

### Match intersection address ###
	/([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+)/i


#### Example ####
Broadway Ave & Broadway, Everett, Washington 98201

### Match name of route between interections ###
	/(([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+))\s-\s(([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+))/i

Broadway Ave & Broadway, Everett, Washington 98201 - Walnut St & 19th St, Everett, Washington 98201

#### Both points have same state ###

	/(([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+))\s-\s(([^&]+)\s&\s+([^,]+),\s([^,]+),\s\5\s(\d+))/i

#### Both points have same state and ZIP ####
	/(([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+))\s-\s(([^&]+)\s&\s+([^,]+),\s([^,]+),\s\5\s\6)/i

#### Same city, state, and ZIP ####

	/(([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+))\s-\s(([^&]+)\s&\s+([^,]+),\s\4,\s\5\s\6)/i

### Route between intersections: Street and cross streets (same city, state, and ZIP) ###

	/(?:([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+))\s-\s(?:(?:([^&]+)\s&\s+\1,\s\3,\s\4\s\5)|(?:\1\s&\s+([^,]+),\s\3,\s\4\s\5)|(?:([^&]+)\s&\s+\2,\s\3,\s\4\s\5)|(?:\2\s&\s+([^,]+),\s\3,\s\4\s\5))/i

or

	/^(?:([^&]+)\s&\s+([^,]+),\s([^,]+),\s([a-z]+)\s(\d+))\s-\s(?:(?:([^&]+)\s&\s+\1,\s\3,\s\4\s\5)|(?:\1\s&\s+([^,]+),\s\3,\s\4\s\5)|(?:([^&]+)\s&\s+\2,\s\3,\s\4\s\5)|(?:\2\s&\s+([^,]+),\s\3,\s\4\s\5))$/img

#### Captures ####

1. Street 1
2. Street 2
3. City
4. State
5. ZIP
6. Either Street 3 or 4, whichever is the cross street of either *Street 1* or *Street 2*.

#### Examples ####
Matches *any* of the following:

* **Walnut St** & 19th St, Everett, Washington 98201 - 18th St & **Walnut St**, Everett, Washington 98201
* 19th St & **Walnut St**, Everett, Washington 98201 - 18th St & **Walnut St**, Everett, Washington 98201
* 19th St & **Walnut St**, Everett, Washington 98201 - **Walnut St** & 18th St, Everett, Washington 98201
* **Walnut St** & 19th St, Everett, Washington 98201 - **Walnut St** & 18th St, Everett, Washington 98201