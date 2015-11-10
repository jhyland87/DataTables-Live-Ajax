# DataTables Plugin - Live Ajax #

Monitor the AJAX data source every 5 seconds (default), comparing the current data structure and the data structure just pulled. If the DataTables setting [rowid](http://datatables.net/reference/option/rowId) is _not_ specified, then the entire table will be reloaded (via [ajax.reload()](http://datatables.net/reference/api/ajax.reload())) whenever any changes are detected. If [rowid](http://datatables.net/reference/option/rowId) _is_ specified, then liveAjax will update only the necessary rows, this is more resourceful than the former option, especially on massively large data structures, where serverSide should be used, but isn't.
 LiveAjax also has 2 optional parameters, one to specify the update interval (in milliseconds), and another to pause updates, which is useful for when there are certain actions being executed, which would be hindered if the table was updated.
All of the DataTables AJAX settings are compatible with this plugin ([ajax.type](http://datatables.net/reference/option/ajax), [ajax.data](http://datatables.net/reference/option/ajax.data), [ajax.dataSrc](http://datatables.net/reference/option/ajax.dataSrc), [ajax.url](http://datatables.net/reference/option/ajax))

*([Demo Here](http://www.justinhyland.com/p/dt/datatables-live-ajax/examples/))*

### Directions ###

1. Setup table to use [ajax](http://datatables.net/reference/option/ajax) data source
1. Make sure your AJAX source is [structured with objects](http://datatables.net/examples/ajax/objects.html)
1. _(Recommended, not required)_ Specify a [rowId](http://datatables.net/reference/option/rowId) attribute

### Parameters ###
Parameter 			  | Type 	 | Default | Description
--------------------- | -------- | ------- | ------------
`liveAjax`  		  | boolean	 | true	   | Enable/Disable liveAjax plugin
`liveAjax.interval`   | number	 | 5000	   | Interval to check for updates (in milliseconds)
`liveAjax.pause`	  | function | *N/A*   | Function used to determine when/if updates should be paused
`liveAjax.xhrDt`	  | boolean	 | false   | Fire off the [xhr.dt](http://datatables.net/reference/event/xhr) event (on successful updates)
`liveAjax.callback`	  | function | *N/A*   | Callback to fire on successful updates
`liveAjax.resetPaging | boolean	 | false   | Enable/Disable page resets on updates

### Events ###
Event			| Description		| Parameters
--------------- | ----------------- | -------------
`xhr.liveAjax`  | Event fired when table is successfully updated

### API Methods ###
Method					| Description				| Parameters
----------------------- | ------------------------- | -------------
`iveAjax.clear()`		| Clear update loop			| *None*
`liveAjax.pause()`		| Pause Updates				| *None*
`liveAjax.resume()`		| Resume Updates			| *None*
`liveAjax.toggle()`		| Toggle Pause Status		| *None*
`liveAjax.reload()`		| Reload table				| *function* callback, *boolean* resetPaging, *boolean* force
`liveAjax.interval()`	| Change update interval	| *integer* interval *(use **null** to reset to default or config value)*


### Example Usage ###

Basic Initialization - Enable *liveAjax* (Checks for updates every 5 seconds by default)
```javascript
$('#example').DataTable({
    ajax: 'dataSrc.php',
    rowId: 'emp_id',
    liveAjax: true
});
```

Shows full compatibility with all [ajax](http://datatables.net/reference/option/ajax) options, changes update interval and adds a function to pause ajax requests randomly
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
        pause: function(){
            // Randomly return TRUE to pause
            return Math.random()<.5;
        }
    }
});
```

Dynamic update interval (new interval will take affect after next reload, can use API to force: `table.liveAjax.reload()`)
```javascript
$('#example').DataTable({
    ajax: 'dataSrc.php',
    rowId: 'emp_id',
    liveAjax: {
        interval: function(){
        	return $('new-interval').val();
        }
    }
});
```

Utilize the liveAjax callback, **and** enable DataTables [xhr.dt](http://datatables.net/reference/event/xhr) event
```javascript
$('#example').DataTable({
    ajax: 'dataSrc.php',
    rowId: 'emp_id',
    liveAjax: {
        callback: function( json ){
        	alert('Records Found: #'+json.data.length);
        },
        xhrDt: true
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
table.liveAjax.reload(null, false, true );
```

Change interval update to 3 seconds
```javascript
table.liveAjax.interval( 3000 );
```

Clear the API interval status, resetting it to default (5000) or value set by `liveAjax.interval` setting
```javascript
table.liveAjax.interval( null );
```
