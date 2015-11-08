/**
 * @summary     liveAjax
 * @description Keep an AJAX sourced DT table up to date (without reloading the entire data source)
 * @version     1.0.0
 * @file        dataTables.liveAjax.js
 * @author      Justin Hyland (http://www.justinhyland.com)
 * @contact     j@linux.com
 * @copyright   Copyright 2015 Justin Hyland
 * @url         https://github.com/jhyland87/DataTables-Live-Ajax
 *
 * License      MIT - http://datatables.net/license/mit
 *
 * Monitor the AJAX data source every N seconds, comparing the current data structure and the data
 * structure just pulled. Instead of reloading the entire table, delete any deleted rows, add any
 * new rows, then delete/readd any updated rows.
 * This should be helpful for any AJAX data sources that are HUGE!
 * All of the DataTables AJAX settings are compatible with this plugin (ajax.type, ajax.data,
 * ajax.dataSrc, ajax.url)
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
 *      Description:        Milleseconds for update interval (Default 5000)
 *      Example:            liveAjax: { interval: 3000 }
 *
 * liveAjax.pause
 *      Required:           false
 *      Type:               function
 *      Description:        Function/Closure to determine if AJAX requests should be paused
 *      Example:            liveAjax: { pause: function(){ return isPaused; }; }
 *
 *
 * @example
 *    // Target all columns - Hide any columns that contain all null/empty values
 *    $('#example').DataTable({
 *        liveAjax: true
 *    });
 *
 * @example
 *    // Target the column indexes 0 & 2
 *    $('#example').DataTable({
 *        liveAjax: {
 *              interval: 3500,
 *              pause: function(){
 *                  if(somethingIsHappening()) return true;
 *              }
 *        }
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

( function( window, document, $, undefined ) {
    // On DT Initialization
    $(document).on('init.dt', function(e, dtSettings) {
        if ( e.namespace !== 'dt' )
            return;

        if ( dtSettings.oInit.ajax === undefined )
            throw new Error('Can not initiate DataTables plugin liveAjax on a non-ajax table');

        if (dtSettings.oInit.rowId === undefined )
            throw new Error('To use liveAjax, you need to specify the DataTables option "rowId"');

        // LiveAjax options
        var options = dtSettings.oInit.liveAjax;


        // True if 'true' or any type of object
        if ( options === true || $.isPlainObject(options) ) {
                var api         = new $.fn.dataTable.Api( dtSettings ),
                    rowId       = dtSettings.oInit.rowId,
                    ajaxUrl     = api.ajax.url(),
                    dataSrc     = api.init().ajax.dataSrc || 'data',
                    ajaxData    = api.init().ajax.data,
                    ajaxMethod  = api.init().ajax.type || 'GET',
                    dtData      = api.ajax.json(), // Current DT data (Gets changed on each update)
                    ajax        = false, // Status of ajax request
                    i           = 0,     // # of ajax requests
                    pause       = ($.isPlainObject(options) && typeof options.pause === 'function' )
                        ? options.pause
                        : function(){ return false; },
                    interval    = ($.isPlainObject(options) && typeof options.interval === 'number' )
                        ? options.interval
                        : 5000;

            // Check for updates ever N seconds
            var updates_loop = setInterval(function(){
                i++;

                // If theres no ajax request running, and not paused, then check
                if( ! ajax && ! pause()) {
                    ajax = true;
                    $.ajax( {
                        type: ajaxMethod,
                        data: ajaxData,
                        dataType: 'json',
                        url: ajaxUrl,
                        cache: false,
                        success: function ( response ) {
                            var updates = getChanges( keyStructData(rowId, dtData[ dataSrc ]), keyStructData(rowId, response[ dataSrc ]) );

                            if(updates !== null){

                                // Deleted Rows
                                if(updates.delete.length !== 0)
                                    api.rows( $.map(updates.delete, function(v,i){ return '#'+v; }) ).remove();

                                // New rows
                                if(updates.create.length !== 0)
                                    api.rows.add( updates.create );

                                // Redraw the table, dont change pages
                                api.draw(false);

                                // Update the existing data set to match what the table is seeing
                                dtData = response;
                            }
                        },
                        error: function ( xhr, ajaxOptions, thrownError ) {
                            clearInterval(updates_loop);
                            throw new Error( 'Error on '+i+': ' + thrownError );
                        }
                    } ).done( function () {
                        ajax = false;
                    } );
                }
            }, interval);

            // If the DT instance was terminated, end the loop
            api.one('destroy.dt', function () {
                clearInterval(updates_loop);
            } );
        }
    });
})( window, document, jQuery );