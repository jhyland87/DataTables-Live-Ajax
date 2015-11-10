/**
 * @summary     liveAjax
 * @description Keep an AJAX sourced DT table up to date (optionally reload only necessary rows)
 * @version     1.0.0
 * @file        dataTables.liveAjax.js
 * @author      Justin Hyland (http://www.justinhyland.com)
 * @contact     j@linux.com
 * @copyright   Copyright 2015 Justin Hyland
 * @url         https://github.com/jhyland87/DataTables-Live-Ajax
 *
 * License      MIT - http://datatables.net/license/mit
 *
 Monitor the AJAX data source every N seconds, comparing the current data structure and the data structure just pulled. If the DataTables setting rowId is _not_ specified, then the entire table will be reloaded whenever any changes are detected. If rowId _is_ specified, then liveAjax will update only the necessary rows, this is more resourceful than the former option, especially on massively large data structures, where serverSide should be used, but isn't.
 LiveAjax also has 2 optional parameters, one to specify the update interval (in milliseconds), and another to pause updates, which is useful for when there are certain actions being executed, which would be hindered if the table was updated.
All of the DataTables AJAX settings are compatible with this plugin (ajax.type, ajax.data, ajax.dataSrc, ajax.url)
 *
 *
 * Parameters:
 *
 * -------------
 * liveAjax
 *      Required:			true
 *      Type:				boolean|object
 *      Description:		Basically just enable live updates for the DataTables (every 5 seconds)
 *
 * liveAjax.interval
 *      Required:           false
 *      Type:               number|integer
 *      Description:        Milleseconds for update interval
 *      Default:            5000
 *      Example:            liveAjax: { interval: 3000 }
 *
 * liveAjax.pause
 *      Required:           false
 *      Type:               function
 *      Description:        Function/Closure to determine if AJAX requests should be paused
 *      Example:            liveAjax: { pause: function(){ return isPaused; } }
 *
 * liveAjax.xhrDt
 *      Required:           false
 *      Type:               boolean
 *      Description:        Execute the xhr.dt event when the table is successfully updated
 *      Default:            false
 *
 * liveAjax.callback
 *      Required:           false
 *      Type:               function
 *      Description:        Callback to fire when table is successfully updated
 *      Example:            liveAjax: { callback: function( json ){ console.log('Table reloaded with:', json) } }
 *
 * liveAjax.resetPaging
 *      Required:           false
 *      Type:               boolean
 *      Description:        Enable/Disable the ResetPaging when table is redrawn
 *      Default:            false
 *
 * @example
 *    // Basic setup - Update the necessary rows every 5 seconds (default)
 *    $('#example').DataTable({
 *        ajax: 'json.php',
 *        rowId: 'ssid',
 *        liveAjax: true
 *    });
 *
 * @example
 *    // Update the necessary rows every 3.5 seconds, except when somethingIsHappening()
 *    $('#example').DataTable({
 *        ajax: 'json.php',
 *        rowId: 'ssid',
 *        liveAjax: {
 *              interval: 3500,
 *              pause: function(){
 *                  if(somethingIsHappening()) return true;
 *              }
 *        }
 *    });
 *
 * @example
 *    // Update the entire table when any changes are detected (Less optimal than when rowId is used)
 *    $('#example').DataTable({
 *        ajax: 'json.php',
 *        liveAjax: true
 *    });
 *
 * @example
 *    // Shosing all the other option examples
 *    $('#example').DataTable({
 *        ajax: 'json.php',
 *        liveAjax: true
 *        rowId: 'userId',
 *        xhrDt: true,      // Trigger the xhr.dt event
 *        callback: function( json ){ // Trigger another custom event
 *              alert('# Rows Found: ' + json.data.length );
 *        }
 *
 *    });
 */

// Restructure an object, by returning an object with the value of 'key' as the object keys
function keyStructData(key, data){
    var result = {};

    // Ensure values exist (Not important enough to warn
    if(data.length === 0) return {};

    // Make sure the top level is an array...
    if( ! $.isArray(data))
        throw new Error('Unable to parse data set, not in array format');

    // .. that contains objects
    if( ! $.isPlainObject(data[0]))
        throw new Error('Unable to parse data set, structure needs to be an array of objects');

    // Ensure the objects has the necessary key
    if( typeof data[ 0 ][key] === 'undefined' )
        throw new Error('Unable to parse data set, key "'+key+'" not found');

    $.each(data, function(k,v){
        if(typeof v[ key ] === 'undefined')
            throw new Error('Unable to parse data set, key "'+key+'" not found at instance # ' + k);

        result[ v[ key ] ] = v;
    });

    return result;
}

// Compare two data sets, return any Created rows and Deleted rows
function getChanges(dataA, dataB){
    var updates = {
        create: [], // Array of Objects
        delete: []  // Array of rowIds (Strings)
    };

    // Diff the two data sets
    $.each(dataA, function(k, v){
        // 1) If this value _doesn't exist_ in the 2nd data set, then that means it was DELETED
        if(typeof dataB[k] === 'undefined')
            updates.delete.push(k.toString()); // Convert to string (rowId needs string)

        // 2) If the stringified version _doesn't match_, then it needs to be updated
        // (Since DT doesn't do updates, we need to delete the row and readd it)
        else if(JSON.stringify(v) !== JSON.stringify(dataB[k]))
            updates.create.push( dataB[ k ] ) && updates.delete.push( k.toString() );

        // 3) Only option now should be if its the same.. which means nothing needs to be done

        // Delete this from the 2nd data set, since its been parsed
        delete(dataB[k]);
    });

    // Now, dataB should consist of just the new assets
    $.each(dataB, function(k, v){
        updates.create.push(v);
    });

    return updates.create.length || updates.delete.length
        ? updates
        : null;
}


var updateLoop,
    initReload,
    apiPause    = false,
    apiInt      = null;

( function( window, document, $, undefined ) {
    // On DT Initialization
    $(document).on('init.dt', function(e, dtSettings) {
        if ( e.namespace !== 'dt' )
            return;

        // LiveAjax options
        var options = dtSettings.oInit.liveAjax;

        // True if 'true' or any type of object, and is an ajax table
        if (options === true || $.isPlainObject(options) ) {
            // Ensure the table is ajax
            if ( dtSettings.oInit.ajax === undefined )
                throw new Error('Can not initiate LiveAjax plugin on a non-ajax table');

                var api         = new $.fn.dataTable.Api( dtSettings ),
                    rowId       = dtSettings.oInit.rowId,
                    ajaxUrl     = api.ajax.url(),
                    minInt      = 1000,
                    intFunc, changesFound,
                    xhrDt       = $.isPlainObject( options ) && options.xhrDt === true,
                    dataSrc     = api.init().ajax.dataSrc || 'data',
                    ajaxData    = api.init().ajax.data,
                    ajaxMethod  = api.init().ajax.type || 'GET',
                    dtData      = api.ajax.json(), // Current DT data (Gets changed on each update)
                    ajax        = false, // Status of ajax request
                    i           = 0,     // # of ajax requests
                    resetPaging = ( $.isPlainObject( options ) && options.resetPaging !== undefined )
                        ? options.resetPaging
                        : false, // Disable resetPaging on draw() by default
                    isPaused    = ( $.isPlainObject( options ) && typeof options.pause === 'function' )
                        ? options.pause
                        : function(){ return false;},
                    xhrCallback = ( $.isPlainObject( options ) && options.callback !== undefined )
                        ? options.callback
                        : false;

            // Determine if the interval in the settings is a closure or a number
            // Ensure that the interval is _greater_ than minInt, if not, change it to minInt
            if ( $.isPlainObject( options ) && options.interval !== undefined ) {
                if ( typeof options.interval === 'function' ) {
                    var tmpInt = options.interval();
                    if ( tmpInt < minInt ){
                        console.warning('Interval of ' + tmpInt + 'ms is too quick, needs to be ' + minInt + 'ms or higher; Setting interval to ' + minInt);

                        intFunc = function(){
                            return minInt;
                        };
                    }
                    else {
                        intFunc = options.interval;
                    }
                }
                // If the interval is a number, then generate a function returning that
                else {
                    if ( options.interval < minInt ) {
                        console.warning('Interval of ' + options.interval + 'ms is too quick, needs to be ' + minInt + 'ms or higher; Setting interval to ' + minInt);

                        intFunc = function () {
                            return minInt;
                        };
                    }
                    else {
                        intFunc = function () {
                            return  parseInt(options.interval);
                        };
                    }
                }
            }

            // Do the XHR request and compare/update
            initReload = function( apiCallback, apiResetPaging, apiForce ){
                // If theres no ajax request running, and not paused, then check
                if( apiForce || ( ! ajax && ! isPaused() && ! apiPause )) {
                    $.ajax( {
                        url: ajaxUrl,
                        type: ajaxMethod,
                        data: ajaxData,
                        cache: false,
                        dataType: 'json',
                        beforeSend: function( xhr ){
                            // Set the ajax request to true before the request is event sent
                            ajax = true;
                        },
                        success: function ( response, textStatus, xhr ) {
                            // If no rowId is specified, then compare the entire contents,
                            // if any differences are found, reload the entire table
                            if(rowId === undefined){
                                //console.log('No Row ID');
                                if(JSON.stringify(dtData[ dataSrc ]) !== JSON.stringify(response[ dataSrc ])) {
                                    changesFound = true;

                                    // Clear and repopulate the table
                                    api.clear().rows.add( response[ dataSrc ] );
                                }
                                else {
                                    changesFound = false;
                                }
                            }
                            // If rowId IS specified, then take the more optimal route of
                            // updating only the rows that need it
                            else {
                                var updates = getChanges( keyStructData( rowId, dtData[ dataSrc ] ), keyStructData( rowId, response[ dataSrc ] ) );

                                if ( updates !== null ) {
                                    changesFound = true;
                                    // Deleted Rows
                                    if ( updates.delete.length !== 0 )
                                        api.rows( $.map( updates.delete, function ( v, i ) {
                                            return '#' + v;
                                        } ) ).remove();

                                    // New rows
                                    if ( updates.create.length !== 0 )
                                        api.rows.add( updates.create );
                                }
                                else {
                                    changesFound = false;
                                }
                            }

                            // If changes were found, then execute the commands that would be the same in either
                            // condition of the above conditional statement (If rowId is set)
                            if ( changesFound === true ){
                                // Redraw the table with updates
                                api.draw( apiResetPaging !== undefined
                                    ? apiResetPaging
                                    : resetPaging );

                                // If were supposed to trigger the xhr.dt callback, do it
                                if ( xhrDt )
                                    $( api.table().node() ).trigger( "xhr.dt", [ dtSettings, response, xhr ] );

                                // Trigger the xhr.liveAjax event
                                $( api.table().node() ).trigger( "xhr.liveAjax", [ dtSettings, response, xhr ] );

                                // Update the existing data set to match what the table is seeing
                                dtData = response;

                                // Fire the callback if it was provided
                                if( typeof apiCallback === 'function' )
                                    apiCallback( response );

                                // Fire the callback given in the init settings
                                if( typeof xhrCallback === 'function' )
                                    xhrCallback( response );
                            }
                        },
                        error: function ( xhr, ajaxOptions, thrownError ) {
                            clearTimeout( updateLoop );
                            throw new Error( 'Error on '+i+': ' + thrownError );
                        }
                    } ).done( function () {
                        ajax = false;
                    } );
                }
            }

            // Fire off the first timeout (With interval of API if set, if not use API of config)
            _doTimeout( apiInt || intFunc() );

            function _doTimeout(int){
                updateLoop = setTimeout(function(){
                    i++;

                    initReload( false );

                    // Fire off the next event
                    _doTimeout( apiInt || intFunc() );
                }, int);
            }

            // Function to check if the table being destroyed is the correct table ID
            var destroyCallback = function (e, ctx) {
                // Due to a bug of "bubbling" effects, make sure its the correct table being destroyed.
                if ( $( api.table().node() ).attr('id') === ctx.nTable.id ){
                    // Kill the timeout loop
                    clearTimeout( updateLoop );

                    // Remove this function from the destroy.dt for this table
                    api.off( 'destroy.dt', destroyCallback );
                }
            };

            // If the DT instance was terminated, end the loop
            api.on('destroy.dt', destroyCallback );
        }
    });

    // LiveAjax API Methods

    /**
     * Clear Update Loop
     *
     * @description: Kill the update loop - permanently
     * @example: table.liveAjax.clear();
     */
    $.fn.dataTable.Api.register( 'liveAjax.clear()', function (  ) {
        clearTimeout(updateLoop);
    } );

    /**
     * Pause Updates
     *
     * @description: Pause the table, disabling checking for updates
     * @example: table.liveAjax.pause();
     */
    $.fn.dataTable.Api.register( 'liveAjax.pause()', function (  ) {
        apiPause = true;
    } );

    /**
     * Resume Updates
     *
     * @description: Unpause the table, checking for updates
     * @example: table.liveAjax.resume();
     */
    $.fn.dataTable.Api.register( 'liveAjax.resume()', function (  ) {
        apiPause = false;
    } );

    /**
     * Toggle Status
     *
     * @description: Toggle the pause status of the table
     * @example: table.liveAjax.toggle();
     */
    $.fn.dataTable.Api.register( 'liveAjax.toggle()', function (  ) {
        apiPause = !apiPause;
    } );

    /**
     * Reload/Update Table
     *
     * @description: Check for updates and reload the table
     * @param   {function}  callback        Callback to fire on reload
     * @param   (boolean}   resetPaging     Reset paging via draw()
     * @param   {boolean}   force           Force update, even if updates are paused
     * @example: Reload table forcefully: table.liveAjax.reload(null, false, true );
     */
    $.fn.dataTable.Api.register( 'liveAjax.reload()', function ( callback, resetPaging, force ) {
        initReload( callback, resetPaging, force );
    } );

    /**
     * Update Interval
     *
     * @description:    Update the interval
     * @param {int} int New Interval
     * @example: Set to value of #int: table.liveAjax.interval( $('#int' ).val() );
     * @example: Reset to init value:  table.liveAjax.interval( null);
     */
    $.fn.dataTable.Api.register( 'liveAjax.interval()', function ( int ) {
        return this.iterator( 'table', function ( settings ) {
            apiInt = int;
        } );
    } );

})( window, document, jQuery );