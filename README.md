# DataTables Plugin - Live Ajax #

Monitor the AJAX data source every N seconds, comparing the current data structure and the data
structure just pulled. Instead of reloading the entire table, delete any deleted rows, add any
new rows, then delete/readd any updated rows. This should be helpful for any AJAX data sources
that are HUGE! All of the DataTables AJAX settings are compatible with this plugin (ajax.type,
ajax.data, ajax.dataSrc, ajax.url)

*([Demo Here](http://www.justinhyland.com/p/dt/datatables-live-ajax/examples/))*

**Directions**:

1. Setup table to use [ajax](http://datatables.net/reference/option/ajax) data source
1. Make sure your AJAX source is [structured with objects](http://datatables.net/examples/ajax/objects.html)
1. Make sure to specify a [rowId](http://datatables.net/reference/option/rowId)

### Example Usage ###

Basic Initialization - Enable *liveAjax* (Checks for updates every 5 seconds by default)
```javascript
$('#example').DataTable({
    ajax: 'dataSrc.php',
    columns: [
        {
            title: 'Name',
            name:  'name',
            data:  'name'
        },
        {
            data:  'extn',
            name:  'extn',
            title: 'Extension'
        }
    ],
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
    columns: [
        {
            title: 'Name',
            name:  'name',
            data:  'name'
        },
        {
            data:  'extn',
            name:  'extn',
            title: 'Extension'
        }
    ],
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