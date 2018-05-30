## :exclamation: Note: This plugin is not actively maintained :exclamation: 
###### This plugin/library was created by me out of necessity, and released to help others that may need it. I don't have time to actively maintain the code to keep up with DataTables updates or bugs in my code. If you run into an issue, feel free to attribute your own changes. :thumbsup:
---


# DataTables Plugin - Live Ajax #

Monitor the AJAX data source every 5 seconds (default), comparing the current data structure and the data structure just pulled. If the DataTables setting [rowid](http://datatables.net/reference/option/rowId) is _not_ specified, then the entire table will be reloaded (via [ajax.reload()](http://datatables.net/reference/api/ajax.reload())) whenever any changes are detected. If [rowid](http://datatables.net/reference/option/rowId) _is_ specified, then liveAjax will update only the necessary rows, this is more resourceful than the former option, especially on massively large data structures, where serverSide should be used, but isn't.
 LiveAjax also has 2 optional parameters, one to specify the update interval (in milliseconds), and another to pause updates, which is useful for when there are certain actions being executed, which would be hindered if the table was updated.
All of the DataTables AJAX settings are compatible with this plugin ([ajax.type](http://datatables.net/reference/option/ajax), [ajax.data](http://datatables.net/reference/option/ajax.data), [ajax.dataSrc](http://datatables.net/reference/option/ajax.dataSrc), [ajax.url](http://datatables.net/reference/option/ajax))

#### Links ####
* *[Live Demo](http://demo.jsdigest.com/DataTables-Live-Ajax/examples/)*
* *[Blog Post](http://www.jsdigest.com/datatables-live-ajax-plugin-keep-ajax-sourced-tables-date/)*

### Directions ###

1. Setup table to use [ajax](http://datatables.net/reference/option/ajax) data source
1. Make sure your AJAX source is [structured with objects](http://datatables.net/examples/ajax/objects.html)
1. _(Recommended, not required)_ Specify a [rowId](http://datatables.net/reference/option/rowId) attribute

### Parameters ###
Parameter 			   	| Type		| Default						| Description
----------------------- | --------- | ----------------------------- | ------------
`liveAjax`  		   	| boolean	| true	   						| Enable/Disable liveAjax plugin
`liveAjax.interval`    	| number	| 5000	   						| Interval to check for updates (in milliseconds)
`liveAjax.dtCallbacks` 	| boolean 	| false   						| This will determine if the DataTables xhr callbacks should be executed for *every* AJAX Request
`liveAjax.abortOn`	   	| array		| error, timeout, parsererror	| Cease all future AJAX calls if one of these statuses were encountered
`liveAjax.noUpdate`		| function 	| *N/A*   						| Callback executed when *no* discrepancies were found in the new JSON data; (Parameters: *[object]* DataTables Settings, *[object]* JSON Data for table; *[object]* XHR Object)
`liveAjax.onUpdate`		| function	| *N/A*    						| Callback executed when discrepancies were found in the new JSON data, and the table was updated; (Parameters: *[object]* DataTables Settings, *[object]* Updated/Deleted/Created row data, *[object]* New JSON Data for table; *[object]* XHR Object)


### Events ###
Event						| Description											| Parameters
--------------------------- | ----------------------------------------------------- | -------------
`init.liveAjax`				| Triggered when liveAjax was initiated on a new table	| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object
`xhrErr.liveAjax`			| Triggered for all XHR Errors							| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object, *[string]* Error Thrown
`xhrErrTimeout.liveAjax`	| Triggered when an XHR *timeout* was encountered		| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object, *[string]* Error Thrown
`xhrErrError.liveAjax`		| Triggered when an XHR *error* was encountered			| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object, *[string]* Error Thrown
`xhrErrParseerror.liveAjax`	| Triggered when an XHR *parsererror* was encountered	| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object, *[string]* Error Thrown
`xhrErrAbort.liveAjax`		| Triggered when an xhr *abort* was encountered			| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object, *[string]* Error Thrown
`xhrErrUnknown.liveAjax`	| Triggered when an unknown XHR error was encountered	| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object, *[string]* Error Thrown
`xhrSkipped.liveAjax`		| Triggered when an XHR call was skipped				| *[object]* Event, *[object]* DataTables Settings, *[string]* Reason for skip (`paused` or `processing`)
`setInterval.liveAjax`		| Triggered when the polling interval was changed		| *[object]* Event, *[object]* DataTables Settings, *[number]* New interval
`clearTimeout.liveAjax`		| Triggered when the loop timeout has been cleared		| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object
`abortXhr.liveAjax`			| Triggered when an XHR request is aborted 				| *[object]* Event, *[object]* DataTables Settings, *[object]* XHR Object
`setPause.liveAjax`			| Triggered when the polling was paused or unpaused		| *[object]* Event, *[object]* DataTables Settings, *[boolean]* Pause Status
`onUpdate.liveAjax`			| Triggered when the new JSON changes were implemented	| *[object]* Event, *[object]* DataTables Settings, *[object]* Created/Deleted/Updated row data, *[object]* DataTable JSON data, *[object]* XHR Object
`noUpdate.liveAjax`			| Triggered when the the table did not need updating	| *[object]* Event, *[object]* DataTables Settings, *[object]* DataTable JSON, *[object]* XHR Object



### API Methods ###
Method						| Description					| Return												| Parameters
--------------------------- | ----------------------------- | ----------------------------------------------------- | -------------
`iveAjax.initiate()`		| Start XHR Polling				| *[object]* DataTables API								| *None*
`iveAjax.abortXhr()`		| Abort Current XHR request 	| *[object]* DataTables API								| *None*
`liveAjax.clearTimeout()`	| Clear the polling loop		| *[object]* DataTables API								| *[boolean]* Abort current XHR request
`liveAjax.xhrStatus()`		| Retrieve latest XHR Status	| *[object]* DataTables API, *[string]* XHR Text status	| *None*
`liveAjax.resume()`			| Resume Updates				| *[object]* DataTables API								| *None*
`liveAjax.togglePause()`	| Toggle Pause Status			| *[object]* DataTables API								| *None*
`liveAjax.pause()`			| Pause XHR Polling				| *[object]* DataTables API								| *None*
`liveAjax.isPaused()`		| Pause XHR Polling				| *[object]* DataTables API, *[boolean] Pause Status	| *None*
`liveAjax.reload()`			| Reload table					| DataTables API Object									| *[function]* Callback, *[boolean]* Reset pagination (default *false*), *[boolean]* Force through paused status
`liveAjax.setInterval()`	| Change update interval		| DataTables API Object									| *[integer]* New interval *(use **null** to reset to default or config value)*


### Example Usage ###

Basic Initialization - Enable *liveAjax* (Checks for updates every 5 seconds by default)
```javascript
$('#example').DataTable({
    ajax: 'dataSrc.php',
    rowId: 'emp_id',
    liveAjax: true
});
```

Shows full compatibility with all [ajax](http://datatables.net/reference/option/ajax) options, and implement some custom settings
```javascript
$('#example').DataTable({
    ajax: {
        url: 'dataSrc.php',
        type: 'POST',
        data: { dataSrc: 'something'},
        dataSrc: 'something'
    },
    rowId: 'emp_id',
    liveAjax: {
        // Update every 4.5 seconds
        interval: 4500,
        // Enable DT XHR Callbacks for all AJAX requests
        dtCallbacks: true,
        abortOn: ['error', 'timeout', 'parsererror', 'abort']
    }
});
```


Update the entire table when any changes are detected (Less optimal than when [rowid](http://datatables.net/reference/option/rowId) is used)
```javascript
$('#example').DataTable({
    ajax: 'json.php',
    liveAjax: true
});
```

### Example API Usage ###
Stop updates entirely (Can not be restarted)
```javascript
table.liveAjax.clear();
```

Pause updates (Updates can only be ran if forced)
```javascript
table.liveAjax.pause();
```

Resume updates
```javascript
table.liveAjax.resume();
```

Initialize immediate reload the table (Does not wait for interval)
```javascript
table.liveAjax.reload();
```

Force reload of table (Executes regardless if paused or not)
```javascript
table.liveAjax.reload( null, false, true );
```

Change interval update to 3 seconds
```javascript
table.liveAjax.setInterval( 3000 );
```

Clear the API interval status, resetting it to default (5000) or value set by `liveAjax.interval` setting
```javascript
table.liveAjax.setInterval( null );
```
