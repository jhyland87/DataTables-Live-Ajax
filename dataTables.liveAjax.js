/**
 * @summary     liveAjax
 * @description Keep an AJAX sourced DT table up to date (optionally reload only necessary rows)
 * @version     1.1.0
 * @file        dataTables.liveAjax.js
 * @author      Justin Hyland (http://www.justinhyland.com)
 * @contact     j@linux.com
 * @copyright   Copyright 2015 Justin Hyland
 * @url         https://github.com/jhyland87/DataTables-Live-Ajax
 *
 * License      MIT - http://datatables.net/license/mit
 *
 * Monitor the AJAX data source every N seconds, comparing the current data structure and the data structure just pulled. If the DataTables setting rowId is _not_ specified and there is no DT_RowId key, then the entire table will be reloaded whenever any changes are detected. If rowId _is_ specified or a DT_RowId key exists, then liveAjax will update only the necessary rows, this is more resourceful than the former option, especially on massively large data structures, where serverSide should be used, but isn't.
 * All of the DataTables AJAX settings are compatible with this plugin (ajax.type, ajax.data, ajax.dataSrc, ajax.url)
 * Some of the functions used below are taken directly from the jquery.dataTables.js file, to ensure compatability.
 *
 * -------------
 *
 * Parameters:
 *
 * -------------
 *
 * liveAjax
 *      Required:			true
 *      Type:				boolean|object
 *      Description:		Basically just enable live updates for the DataTables (every 5 seconds)
 *
 * liveAjax.interval
 *      Required:           false
 *      Type:               number|integer
 *      Parameters:         Interval (Number/Int)
 *      Default:            4000
 *      Description:        Milleseconds for update interval
 *      Example:            liveAjax: { interval: 3000 }
 *
 * liveAjax.dtCallbacks
 *      Required:           false
 *      Type:               boolean
 *      Default:            false
 *      Description:        Execute the normal DataTables XHR events for each AJAX call made by liveAjax,
 *                          enabling this may fire off more dt events than you want. I recommend using the
 *                          onUpdate.liveAjax and noUpdate.liveAjax events instead, since they fire off
 *                          based on if the table was updated or not, which is much more manageable
 *
 * liveAjax.resetPaging
 *      Required:           false
 *      Type:               boolean
 *      Default:            false
 *      Description:        Enable/Disable the ResetPaging when table is redrawn
 *
 * liveAjax.onUpdate
 *      Required:           false
 *      Type:               function
 *      Parameters:         dtSettings (Object), data|jqXHR (Object), textStatus (String), jqXHR|errorThrown (Object|String)
 *      Description:        Callback fired after XHR is completed and the table has been updated with new data
 *
 * liveAjax.noUpdate
 *      Required:           false
 *      Type:               function
 *      Parameters:         dtSettings (Object), response (JSON), xhr (Object)
 *      Description:        Callback fired after XHR is completed and no data was updated
 *
 * liveAjax.abortOn
 *      Required:           false
 *      Type:               array
 *      Default:            ['error', 'timeout', 'parsererror']
 *      Description:        Array of XHR statuses to abort the loop when encountered. Possible statuses are
 *                          success, notmodified, nocontent, error, timeout, abort, parsererror
 *
 *
 * @example
 *    // Basic setup - Update the whole table when any descrepencies are found
 *    // (because rowId is not specified, and assuming there's no 'DT_RowId' key)
 *    // This is much less optimal than when specifying the rowId setting for DT
 *    $('#example').DataTable({
 *        ajax: 'json.php',
 *        liveAjax: true
 *    });
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
 *    // Update the necessary rows every 3.5 seconds
 *    // Abort on the status results: 'error','timeout','parsererror' and 'abort'
 *    // Fire callback onUpdate showing how many records were created/deleted
 *    // Fire callback noUpdate saying nothing was updated
 *    $('#example').DataTable({
 *        ajax: 'json.php',
 *        rowId: 'ssid',
 *        liveAjax: {
 *              interval: 3500,
 *              abortOn: ['error','timeout','parsererror','abort'],
 *              onUpdate: function( updates, json, xhr ){
 *                  if ( typeof updates.create !== 'undefined' )
 *                      console.log('Rows Created:', updates.create.length);
 *                  if ( typeof updates.delete !== 'undefined' )
 *                      console.log('Rows Deleted:', updates.delete.length);
 *                  if ( typeof updates.delete !== 'undefined' )
 *                      console.log('Rows Updated:', Object.keys(updates.delete).length);
 *              },
 *              noUpdate: function( json, xhr ){
 *                  console.log('Nothing was updated');
 *              }
 *        }
 *    });
 *
 *
 * -------------
 *
 * API Methods:
 *
 * -------------
 *
 * liveAjax.initiate()
 *      Description:        Start the liveAjax update polling (Only starts if not currently running)
 *      Parameters:         None
 *      Return:             None
 *      Example:            table.liveAjax.initiate()
 *
 * liveAjax.abortXhr()
 *      Description:        Abort the current XHR request, (Not the same as liveAjax.destroy()). If
 *                          'abort' is not in the liveAjax.abortOn array, then this will _not_ stop
 *                          the polling
 *      Parameters:         None
 *      Return:             None
 *      Example:            table.liveAjax.abortXhr()
 *
 * liveAjax.destroy()
 *      Description:        Abort the current XHR request (if running), and stop the update polling
 *      Parameters:         None
 *      Return:             None
 *      Example:            table.liveAjax.destroy()
 *
 * liveAjax.pause()
 *      Description:        Prevent any XHR requests from being executed, unless forced
 *      Parameters:         None
 *      Return:             None
 *      Example:            table.liveAjax.pause()
 *
 * liveAjax.resume()
 *      Description:        Un-pause polling, allowing XHR requests to be executed
 *      Parameters:         None
 *      Return:             None
 *      Example:            table.liveAjax.resume()
 *
 * liveAjax.xhrStatus()
 *      Description:        Get the textStatus of the last XHR request made by liveAjax
 *      Parameters:         None
 *      Return:             [String] One of: success, notmodified, nocontent, error, timeout, abort, parsererror
 *      Example:            table.liveAjax.xhrStatus()
 *
 * liveAjax.isPaused()
 *      Description:        Start the liveAjax update polling (Only starts if not currently running)
 *      Parameters:         None
 *      Return:             [Boolean] True if XHR polling is paused, false if not
 *      Example:            table.liveAjax.isPaused()
 *
 * liveAjax.togglePause()
 *      Description:        Toggle the pause status of XHR polling
 *      Parameters:         None
 *      Return:             None
 *      Example:            table.liveAjax.togglePause()
 *
 * liveAjax.setInterval()
 *      Description:        Update the timeout interval between each XHR request
 *      Parameters:         [Integer|Number|Null] Timeout in milliseconds, or Null to set back to
 *                          the initialized value of liveAjax.interval
 *      Return:             None
 *      Example:            table.liveAjax.setInterval( 4000 ) // 4 seconds
 *
 * liveAjax.reload()
 *      Description:        Execute an XHR request and update table, if any descrepencies are found. The callbacks executed
 *                          are jqXHR.done(), jqXHR.fail() and jqXHR.always(), this the parameters handed to them are standard.
 *                          See http://api.jquery.com/jquery.ajax/ for more info
 *      Parameters:         [Boolean] Force; [Function] Done/Success Callback; [Function] Fail Callback; [Function] Always Callback
 *      Return:             None
 *      Example:            table.liveAjax.reload(true, function(data, textStatus, jqXHR){
 *                              console.log('Success! Data:',data);
 *                          }, function ( jqXHR, textStatus, errorThrown ) {
 *                              console.log('Failed!', textStatus);
 *                          }, function ( data_jqXHR, textStatus, jqXHR_errorThrown ) {
 *                              console.log('I always get executed...');
 *                          });
 */

( function( window, document, $, undefined ) {
    /**
     * XHR States for the $.ajax().readyState values, just making them easier to use.
     */
    var XHR_STATE_NOT_INIT   = 0;
    var XHR_STATE_SETUP      = 1;
    var XHR_STATE_SENT       = 2;
    var XHR_STATE_PROCESSING = 3;
    var XHR_STATE_COMPLETE   = 4;

    // Private Functions

    /**
     * Uppercase the first letter of a string
     * @param   {string}    str     String to parse and return
     * @returns {string}    result of 'str', just with first letter uppercased
     */
    function _ucfirst( str ) {
        str += '';
        return str.charAt(0).toUpperCase() + str.substr(1);
    }

    /**
     * Restructure an array of objects into an object of objects that has the value of
     * the 'key' parameter within each initial object as the object key, making it more
     * compatible with the DataTables API.
     *
     * @param   {string}    key     The property within the objects that is to be set
     *                              as the index in the resulting object
     * @param   {array}    data    Data to restructure
     * @return  {object} An object with the value of 'key' as the index for each record
     */
    function _fnKeyStructData( key, data ){
        var result = {};

        // Ensure values exist (Not important enough to warn
        if( data.length === 0 ) return {};

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

    /**
     * Compare two objects of the same structure, getting any "rows" that have been
     * created/updated/deleted in the 2nd array. Returns an object with two arrays,
     * one with just the DataTabeles rowId of the rows that need to be deleted (the
     * 'delete' element), then another array with the complete JSON Data needed for
     * creating new DataTables rows (The 'create' element).
     *
     * @param   {object}    dataA   The _current_ DataTables JSON Table data
     * @param   {object}    dataB   The _new_ JSON Table data to be compared to
     * @return  {object}            An object with three elements (delete (array);
     *                              create (array of objects); update (object of
     *                              objects))
     */
    function _fnGetChanges(dataA, dataB){
        var updates = {
            create: [], // Array of Objects
            delete: [], // Array of rowIds (Strings)
            update: {}  // Objects of rows updated
        };

        // Diff the two data sets
        $.each( dataA, function( k, v ){
            // 1) [DELETED ROWS] If this value _doesn't exist_ in the 2nd data set, then
            // that means it was deleted
            if ( typeof dataB[k] === 'undefined' )
                updates.delete.push( k.toString() ); // Convert to string (rowId needs string)

            // 2) [UPDATED ROWS] If the stringified versions _don't match_, then it needs to be updated
            else if ( JSON.stringify( v ) !== JSON.stringify( dataB[k] ) )
                updates.update[ k ] = dataB[ k ];

            // Only option now should be if the JSON data the same, which means nothing needs to be done

            // Delete this from the 2nd data set, since its been processed
            delete( dataB[ k ] );
        });

        // [CREATED ROWS] Now, dataB should consist of just the new rows to be created, so move them over
        // to the updates.create array
        $.each( dataB, function( k, v ){
            updates.create.push( v );
        });

        return updates.create.length || updates.delete.length || Object.keys(updates.update).length
            ? updates
            : null;
    }

    /**
     * Fire callback functions and trigger events. Note that the loop over the
     * callback array store is done backwards! Further note that you do not want to
     * fire off triggers in time sensitive applications (for example cell creation)
     * as its slow.
     *  @param {object} dtSettings dataTables settings object
     *  @param {string} callbackArr Name of the array storage for the callbacks in
     *      dtSettings
     *  @param {string} eventName Name of the jQuery custom event to trigger. If
     *      null no trigger is fired
     *  @param {array} args Array of arguments to pass to the callback function /
     *      trigger
     *  @param {string} namespace Namespace of event, such as xhrAbort.namespace,
     *      defaults to 'dt'
     *  @memberof DataTable#oApi
     */
    function _fnCallbackFire( dtSettings, callbackArr, eventName, args, namespace ) {
        var ret = [];

        if ( callbackArr ) {
            ret = $.map( dtSettings[callbackArr].slice().reverse(), function (val, i) {
                return val.fn.apply( dtSettings.oInstance, args );
            } );
        }

        if ( eventName !== null ) {
            var e = $.Event( eventName+'.'+ (namespace || 'dt') );

            $(dtSettings.nTable).trigger( e, args );

            ret.push( e.result );
        }

        return ret;
    }

    /**
     * Log an error message
     *  @param {object}     dtSettings  DataTables settings object
     *  @param {integer}    level       log error messages, or display them to the user
     *  @param {string}     msg         error message
     *  @param {integer}    tn          Technical note id to get more information about the error.
     *  @memberof DataTable#oApi
     */
    function _fnLog( dtSettings, level, msg, tn ) {
        msg = '[LiveAjax] DataTables warning: '+
        ( dtSettings ? 'table id='+dtSettings.sTableId+' - ' : '' )+msg;

        if ( tn ) {
            msg += '. For more information about this error, please see '+
            'http://datatables.net/tn/'+tn;
        }

        if ( ! level  ) {
            // Backwards compatibility pre 1.10
            var ext = $.fn.dataTableExt;
            var type = ext.sErrMode || ext.errMode;

            if ( dtSettings ) {
                _fnCallbackFire( dtSettings, null, 'error', [ dtSettings, tn, msg ] );
            }

            if ( type == 'alert' ) {
                alert( msg );
            }
            else if ( type == 'throw' ) {
                throw new Error(msg);
            }
            else if ( typeof type == 'function' ) {
                type( dtSettings, tn, msg );
            }
        }
        else if ( window.console && console.log ) {
            console.log( msg );
        }
    }

    /**
     * Check if a DT callback is enabled to run or not
     * @param   {object}    dtSettings  DataTables settings object
     * @param   {function}  callback    Function to execute
     * @returns {boolean|*}
     * @private
     */
    function _fnDtCallbackEnabled( dtSettings, callback ) {
        return ( dtSettings.liveAjax.dtCallbacks === true
        || ($.isArray( dtSettings.liveAjax.dtCallbacks )
        && $.inArray(callback, dtSettings.liveAjax.dtCallbacks) !== -1
        )
        );
    }

    /**
     * Display or hide the processing indicator
     *  @param  {object} dtSettings     DataTables settings object
     *  @param  {bool}   show           Show the processing indicator (true) or not (false)
     */
    function _fnProcessingDisplay ( dtSettings, show ) {
        if ( dtSettings.oFeatures.bProcessing ) {
            $( dtSettings.aanFeatures.r ).css( 'display', show ? 'block' : 'none' );
        }

        _fnCallbackFire( dtSettings, null, 'processing', [ dtSettings, show ] );
    }

    /**
     * Create an Ajax call based on the table's settings, taking into account that
     * parameters can have multiple forms, and backwards compatibility.
     *
     * @param {object} dtSettings dataTables settings object
     * @param {array} data Data to send to the server, required by
     *     DataTables - may be augmented by developer callbacks
     * @param {function} fn Callback function to run when data is obtained
     */
    function _fnBuildAjax( dtSettings, data, fn ) {
        // Fire the serverParams callback if dtCallbacks is enabled
        if ( _fnDtCallbackEnabled( dtSettings, 'serverParams' ) )
        // Compatibility with 1.9-, allow fnServerData and event to manipulate
            _fnCallbackFire( dtSettings, 'aoServerParams', 'serverParams', [data] );

        // Convert to object based for 1.10+ if using the old array scheme which can
        // come from server-side processing or serverParams
        if ( data && $.isArray(data) ) {
            var tmp = {};
            var rbracket = /(.*?)\[\]$/;

            $.each( data, function (key, val) {
                var match = val.name.match(rbracket);

                if ( match ) {
                    // Support for arrays
                    var name = match[0];

                    if ( ! tmp[ name ] ) {
                        tmp[ name ] = [];
                    }
                    tmp[ name ].push( val.value );
                }
                else {
                    tmp[val.name] = val.value;
                }
            } );
            data = tmp;
        }

        var xhrStart;
        var ajaxData;
        var ajax = dtSettings.ajax;
        var instance = dtSettings.oInstance;
        var callback = function ( json ) {
            // Fire the xhr callback if dtCallbacks is enabled
            if ( _fnDtCallbackEnabled( dtSettings, 'xhr' ) )
                _fnCallbackFire( dtSettings, null, 'xhr', [dtSettings, json, dtSettings.jqXHR] );

            fn( json );
        };

        // Get the AJAX data from the DT Init setting ajax.data
        if ( $.isPlainObject( ajax ) && ajax.data ) {
            ajaxData = ajax.data;

            var newData = $.isFunction( ajaxData ) ?
                ajaxData( data, dtSettings ) :  // fn can manipulate data or return
                ajaxData;                      // an object object or array to merge

            // If the function returned something, use that alone
            data = $.isFunction( ajaxData ) && newData ?
                newData :
                $.extend( true, data, newData );

            // Remove the data property as we've resolved it already and don't want
            // jQuery to do it again (it is restored at the end of the function)
            delete ajax.data;
        }

        var baseAjax = {
            data: data,
            dataType: "json",
            cache: false,
            type: dtSettings.ajax.type || 'GET',
            success: function (json) {
                var error = json.error || json.sError;

                if ( error )
                    _fnLog( dtSettings, 0, error );

                dtSettings.json = json;

                callback( json );
            },
            error: function (xhr, error, thrown) {
                // Fire the xhr callback if dtCallbacks is enabled
                if ( _fnDtCallbackEnabled( dtSettings, 'xhr' ) )
                    var ret = _fnCallbackFire( dtSettings, null, 'xhr', [dtSettings, null, dtSettings.jqXHR] );

                if ( $.inArray( true, ret ) === -1 ) {
                    if ( error == "parsererror" ) {
                        _fnLog( dtSettings, 0, 'Invalid JSON response', 1 );
                    }
                    else if ( xhr.readyState === 4 ) {
                        _fnLog( dtSettings, 0, 'Ajax error', 7 );
                    }
                }

                _fnProcessingDisplay( dtSettings, false );
            }
        };

        // Store the data submitted for the API
        dtSettings.oAjaxData = data;


        // Fire the xhr callback if dtCallbacks is enabled
        if ( _fnDtCallbackEnabled( dtSettings, 'preXhr' ) )
            _fnCallbackFire( dtSettings, null, 'preXhr', [dtSettings, data] );

        // Start timestamp for duration
        xhrStart = new Date();

        if ( dtSettings.fnServerData ) {
            // DataTables 1.9- compatibility
            dtSettings.fnServerData.call( instance,
                dtSettings.sAjaxSource,
                $.map( data, function (val, key) { // Need to convert back to 1.9 trad format
                    return { name: key, value: val };
                } ),
                callback,
                dtSettings
            );
        }
        else if ( dtSettings.sAjaxSource || typeof ajax === 'string' ) {
            // DataTables 1.9- compatibility
            dtSettings.jqXHR = $.ajax( $.extend( baseAjax, {
                url: ajax || dtSettings.sAjaxSource
            } ) );
        }
        else if ( $.isFunction( ajax ) ) {
            // Is a function - let the caller define what needs to be done
            dtSettings.jqXHR = ajax.call( instance, data, callback, dtSettings );
        }
        else {
            // Object to extend the base settings
            dtSettings.jqXHR = $.ajax( $.extend( baseAjax, ajax ) );

            // Restore for next time around
            ajax.data = ajaxData;
        }

        // LiveAjax Events..
        dtSettings.jqXHR
            // Success
            .done( function ( json, textStatus, jqXHR ) {
                dtSettings.liveAjax.previousJson = json;
            } )
            // Fail
            .fail( function ( jqXHR, textStatus, errorThrown ) {
                // Fire the xhr error-specific event
                _fnCallbackFire( dtSettings, null, 'xhrErr' + _ucfirst( textStatus || 'unknown' ), [ dtSettings, dtSettings.jqXHR, errorThrown ], 'liveAjax' );

                // Fire the general xhr error event
                _fnCallbackFire( dtSettings, null, 'xhrErr', [ dtSettings, dtSettings.jqXHR, errorThrown ], 'liveAjax' );
            } )
            // Success & Fail
            .always( function ( data_jqXHR, textStatus, jqXHR_errorThrown ) {
                // Update the last result
                dtSettings.liveAjax.lastResult = textStatus;

                // Store the last iteration date
                dtSettings.liveAjax.lastIteration = new Date();

                // Increment the total iterations
                dtSettings.liveAjax.totalIterations++;

                // Update the duration to however long this took
                dtSettings.liveAjax.lastDuration = new Date() - xhrStart;
            } );
    }

    /**
     * Check if an XHR request is ok to execute, based on the status of the XHR readyState
     *
     * @param {object} dtSettings dataTables settings object
     */
    function _isXhrClear( dtSettings ){
        return (dtSettings.jqXHR === undefined || $.inArray(dtSettings.jqXHR.readyState, [ XHR_STATE_COMPLETE, XHR_STATE_NOT_INIT ]) !== -1 )
    }

    /**
     * Initialize the setTimeout loop for a DT instance, using the settings stored in the
     * liveAjax namespace for said table
     *
     * @param {object} dtSettings dataTables settings object
     */
    function _initUpdates( dtSettings ){
        // Prevent any duplicating of the loop
        if ( ! _isXhrClear( dtSettings ) ){
            console.warn('liveAjax already initiated for table #' + dtSettings.nTable.id);
            return;
        }

        // The self-invoking _doTimeout function executes itself when the timeout is reached
        (function _doTimeout() {
            dtSettings.liveAjax.updateLoop = setTimeout(function(){
                // Fire off the reload method...
                dtSettings.liveAjax.initReload(
                    // Execute the next loop iteration function on the xhr.always() callback
                    function( polledDtSettings ){
                        // On success, fire off the next setTimeout interval
                        if ( $.inArray( polledDtSettings.liveAjax.lastResult, polledDtSettings.liveAjax.abortOn ) === -1 )
                            _doTimeout( polledDtSettings.liveAjax.interval );
                        else
                            _fnLog( polledDtSettings, 0, '[liveAjax] Abortable status retrieved from last XHR request (' + polledDtSettings.liveAjax.lastResult + ') - aborting updates', false );
                    });
            }, dtSettings.liveAjax.interval)
        })();

        _fnCallbackFire( dtSettings, null, 'init', [ dtSettings, dtSettings.jqXHR ], 'liveAjax' );
    }

    /**
     * Kill the existing setTimeout, if exists
     *
     * @param {object} dtSettings dataTables settings object
     */
    function _clearTimeout( dtSettings ){
        clearTimeout( dtSettings.liveAjax.updateLoop );

        _fnCallbackFire( dtSettings, null, 'clearTimeout', [ dtSettings, dtSettings.jqXHR ], 'liveAjax' );
    }

    /**
     * Abort the current XHR Event tied to the table settings
     *
     * @param {object} dtSettings dataTables settings object
     */
    function _abortXhr( dtSettings ){
        // Attempt to abort the XHR event
        try {
            dtSettings.jqXHR.abort();
        }
        // Catch any errors that may happen
        catch( err ) {
            dtSettings.liveAjax.latestError = err.message;
        }
        // Execute the abortXhr.liveAjax event
        finally {
            _fnCallbackFire( dtSettings, null, 'abortXhr', [ dtSettings, dtSettings.jqXHR ], 'liveAjax' );
        }
    }

    /**
     * Set the status of XHR Polling, pausing or resuming updates
     *
     * @param {object}  dtSettings  DataTables settings object
     * @param {boolean} status      Status to implement (true = unpaused; false = paused)
     */
    function _setPauseStatus( dtSettings, status ){
        dtSettings.liveAjax.paused = status;

        _fnCallbackFire( dtSettings, null, 'setPause', [ dtSettings, status ], 'liveAjax' );
    }

    // Default values for any liveAjax init settings, this is pretty
    // much only called by _getOpt
    var _defaults = {
            // 4 seconds interval
            interval: 4000,
            // Don't reset the DT paging when any updates are implemented
            resetPaging: false,
            // Don't enable callbacks for every XHR request made by liveAjax
            dtCallbacks: false,
            // XHR Status's that should end the liveAjax loop if encountered. This is based off
            // the 'textStatus' value from the $.ajax().always(data,textStatus,jqXHR) callback.
            // @see http://api.jquery.com/jquery.ajax/
            // Possible Statuses: success, notmodified, nocontent, error, timeout, abort, parsererror
            abortOn: ['error', 'timeout', 'parsererror'],
            // Callback for when the table is updated
            onUpdate: function( updates, json, xhr ){},
            // Callback for when no data has been updated
            noUpdate: function( json, xhr ){}
        },
        // Minimum setTimeout interval (in MS)
        _minInterval = 1500; // 1.5 sec

    // Plugin Initialization on DT Init

    $( document ).on('init.dt', function(e, dtSettings) {
        if ( e.namespace !== 'dt' )
            return;

        // LiveAjax _options
        var _options = dtSettings.oInit.liveAjax;

        // If liveAjax isnt true, and not an object of settings, just quit here
        if ( _options !== true && ! $.isPlainObject( _options ) )
            return;

        // Ensure the table is ajax
        if ( dtSettings.oInit.ajax === undefined )
            throw new Error('Can not initiate LiveAjax plugin on a non-ajax sourced table');

        var _api        = new $.fn.dataTable.Api( dtSettings ),
        // Return the value of specified item from the init settings
            _getOpt   = function( item, isType ) {
                // Set the default value of the defVal to null
                var defaultVal = _defaults[ item ] === undefined
                    ? null
                    : _defaults[ item ];

                // Return the value found in the liveAjax settings, or the defaultVal
                return (
                $.isPlainObject( _options )
                && _options[ item ] !== undefined
                && ( isType === undefined || typeof _options[ item ] === isType ))
                    ? _options[ item ]
                    : defaultVal;
            },
            _processNewJson = function( json ) {
                // If somehow the dtSettings.liveAjax.previousJson got wiped out, define it and quit processing
                if ( dtSettings.liveAjax.previousJson === undefined ) {
                    dtSettings.liveAjax.previousJson = json;
                    return;
                }

                // Update to true if any changes were made - to redraw the table
                var doDraw = false;

                // If the rowId _does NOT exist_, then update the table based on an diff of the entire JSON content
                if ( json[ dtSettings.liveAjax.dataSrc ][0][ dtSettings.liveAjax.rowId ] === undefined ){
                    // Compare two dataSources, and just quit if they are the same
                    if ( JSON.stringify( dtSettings.liveAjax.previousJson[ dtSettings.liveAjax.dataSrc ] ) !== JSON.stringify( json[ dtSettings.liveAjax.dataSrc ] ) ) {
                        // Clear the table and re-add all rows
                        _api.clear().rows.add( json[ dtSettings.liveAjax.dataSrc ] );

                        doDraw = true;
                    }
                }
                // If the rowId _does exist_, then just delete/add the correct rows
                else {
                    // @todo make sure that the new JSON has the correct columns, but don't compare it with the old JSON, since the structure can be different, as long as the columns.name values all exist as keys

                    // Updates array, will be null if no updates
                    var updates = _fnGetChanges(
                        _fnKeyStructData( dtSettings.liveAjax.rowId, dtSettings.liveAjax.previousJson[ dtSettings.liveAjax.dataSrc ] ),
                        _fnKeyStructData( dtSettings.liveAjax.rowId, json[ dtSettings.liveAjax.dataSrc ] )
                    );

                    // If any discrepancies were _not_ found, then dont go any further.
                    if( updates !== null ) {
                        // Updated rows
                        if ( updates.update !== undefined && Object.keys( updates.update ).length !== 0 )
                            $.each( updates.update, function ( id, data ) {
                                _api.row('#'+id).data( data );
                            });

                        // Deleted rows
                        if ( updates.delete !== undefined && updates.delete.length !== 0 )
                            _api.rows( $.map( updates.delete, function ( v, i ) {
                                return '#' + v;
                            } ) ).remove();

                        // Created rows
                        if ( updates.create !== undefined && updates.create.length !== 0 )
                            _api.rows.add( updates.create );

                        // Update the DataTables JSON content
                        dtSettings.json = json;

                        // Update the object with any changes between the two JSON data sources
                        dtSettings.liveAjax.lastUpdates = updates;

                        // Update the last update date
                        dtSettings.liveAjax.lastUpdate = new Date();

                        // Increment the total updates #
                        dtSettings.liveAjax.totalUpdates ++;

                        doDraw = true;
                    }
                }

                // Redraw the table if needed
                if ( doDraw === true ) {
                    _api.draw( dtSettings.liveAjax.resetPaging );

                    // Fire the onUpdate.liveAjax event
                    _fnCallbackFire( dtSettings, null, 'onUpdate', [ dtSettings, updates, json, dtSettings.jqXHR ], 'liveAjax' );

                    // Fire off the onUpdate callback from the liveAjax settings, if specified
                    if ( dtSettings.liveAjax.callbacks.onUpdate !== undefined )
                        dtSettings.liveAjax.callbacks.onUpdate( updates, json, dtSettings.jqXHR );
                }
                else {
                    // Fire the noUpdate.liveAjax event
                    _fnCallbackFire( dtSettings, null, 'noUpdate', [ dtSettings, json, dtSettings.jqXHR ], 'liveAjax' );

                    // Fire off the noUpdate callback from the liveAjax settings, if specified
                    if ( dtSettings.liveAjax.callbacks.noUpdate !== undefined )
                        dtSettings.liveAjax.callbacks.noUpdate( json, dtSettings.jqXHR );
                }

            };

        // Populate the dtSettings.liveAjax namespace from the init settings
        dtSettings.liveAjax = {
            // Settings possibly specified in the liveAjax object of the DT initialization values
            interval: ( _minInterval > parseInt( _getOpt('interval') )
                ? _minInterval
                : parseInt( _getOpt('interval'))),
            initInterval: ( _minInterval > parseInt( _getOpt('interval') )
                ? _minInterval
                : parseInt( _getOpt('interval'))),
            dtCallbacks: _getOpt('dtCallbacks'),
            resetPaging: _getOpt('resetPaging'),
            abortOn: _getOpt('abortOn', 'array'),
            callbacks: {
                onUpdate: _getOpt('onUpdate', 'function'),
                noUpdate:  _getOpt('noUpdate', 'function')
            },
            // Settings pulled from the DataTable core settings object
            rowId: dtSettings.rowId,
            dataSrc: dtSettings.ajax.dataSrc || 'data',
            previousJson: dtSettings.json,
            // Settings used internally by Live Ajax, or for the API Calls
            paused: false,
            latestError: null,
            updateLoop: null,
            totalUpdates: 0,
            totalIterations: 0,
            lastCheck: null,
            lastUpdate: null,
            lastIteration: null,
            // Method to initialize the XHR request to get the current JSON, then compare
            // it with the old JSON by attaching _processNewJson as the callback
            initReload: function( pollingFn, overridePause, doneCallback, failCallback, alwaysCallback ) {
                // Only execute if there's not already an update in progress, and its not paused (can override pause)
                if( _isXhrClear( dtSettings) && ( dtSettings.liveAjax.paused === false || overridePause === true ) ) {
                    // Process settings and init XHR req
                    _fnBuildAjax(
                        dtSettings,
                        // @todo Is the below important for this usage?..
                        [], //_fnAjaxParameters( dtSettings ),
                        _processNewJson
                    );

                    // XHR Callbacks..
                    dtSettings.jqXHR
                        .done( function ( data, textStatus, jqXHR ) {
                            if ( typeof doneCallback === 'function')
                                doneCallback( data, textStatus, jqXHR );
                        } )
                        .fail( function ( jqXHR, textStatus, errorThrown ) {
                            if ( typeof failCallback === 'function')
                                failCallback( jqXHR, textStatus, errorThrown );
                        } )
                        .always( function ( data_jqXHR, textStatus, jqXHR_errorThrown ) {
                            if ( typeof alwaysCallback === 'function')
                                alwaysCallback( data_jqXHR, textStatus, jqXHR_errorThrown );
                        } );
                }
                else {
                    // If an iteration was skipped, fire the Skipped event and log why
                    _fnCallbackFire( dtSettings, null, 'xhrSkipped', [ dtSettings, ( dtSettings.jqXHR.readyState < XHR_STATE_COMPLETE ? 'processing' : 'paused') ], 'liveAjax' );

                    // Execute the always callback, since
                    if ( typeof alwaysCallback === 'function') {
                        alwaysCallback( data_jqXHR, textStatus, jqXHR_errorThrown );
                    }
                }

                // Execute the polling function, if it was specified
                if ( typeof pollingFn === 'function') {
                    pollingFn( dtSettings );
                }
            }
        };

        // Initialize the updates - Starting timeout that calls timeout, etc
        _initUpdates(dtSettings);

        // Function to check if the table being destroyed is the correct table ID
        var _destroyCallback = function ( e, ctx ) {
            // Due to a bug of "bubbling" effects, make sure its the correct table being destroyed.
            if ( $( _api.table().node() ).attr('id') === ctx.nTable.id ){
                // Abort the current XHR Event
                _abortXhr( dtSettings );

                // Kill the timeout loop
                clearTimeout( dtSettings.liveAjax.updateLoop );

                // Remove this function from the destroy.dt for this table
                _api.off( 'destroy.dt', _destroyCallback );
            }
        };

        // Attach the _destroyCallback function to all destroy.dt events. This needs
        // to be attached using .on() instead of .one(), because due to a DT bug caused
        // by events "bubbling up" through the dom, this gets fired off for _every_
        // destroy.dt event. So execute it for every event. This bug should be resolved
        // soon
        _api.on('destroy.dt', _destroyCallback );
    });

    // LiveAjax API Methods

    /**
     * Start liveAjax XHR Request Polling
     *
     * @description: Start the XHR request loop (If its not already initiated)
     * @example: table.liveAjax.initiate();
     * @return  DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.initiate()', function () {
        return this.iterator( 'table', function ( dtSettings ) {
            _initUpdates( dtSettings );
        } );
    } );

    /**
     * Abort Current XHR Request
     *
     * @description: Abort the current XHR Request
     * @example: table.liveAjax.abort();
     * @return  DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.abortXhr()', function () {
        return this.iterator( 'table', function ( dtSettings ) {
            _abortXhr( dtSettings );
        } );
    } );

    /**
     * Clear the timeout for the XHR polling
     *
     * @description: Clear the timeout for the existing setTimeout
     * @example: table.liveAjax.clearTimeout();
     * @return  DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.clearTimeout()', function ( abortXhr ) {
        return this.iterator( 'table', function ( dtSettings ) {
            // Abort the current XHR, if one exists
            if ( abortXhr === true )
                _abortXhr( dtSettings );

            // Clear the timeout
            _clearTimeout( dtSettings );
        } );
    } );

    /**
     * Pause Updates
     *
     * @description: Pause the table, disabling checking for updates
     * @example: table.liveAjax.pause();
     * @return  DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.pause()', function () {
        return this.iterator( 'table', function ( dtSettings ) {
            _setPauseStatus(dtSettings, true);
        } );
    } );

    /**
     * Resume Updates
     *
     * @description: Unpause the table, checking for updates
     * @example: table.liveAjax.resume();
     * @return  DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.resume()', function () {
        return this.iterator( 'table', function ( dtSettings ) {
            _setPauseStatus(dtSettings, false);
        } );
    } );

    /**
     * Is Loop Paused
     *
     * @description: Return the boolean status of liveAjax.paused
     * @example: table.liveAjax.isPaused();
     * @return boolean
     */
    $.fn.dataTable.Api.register( 'liveAjax.isPaused()', function () {
        return this.iterator( 'table', function ( dtSettings ) {
            return dtSettings.liveAjax.paused;
        }, false )[0];
    } );

    /**
     * Toggle Pause Status
     *
     * @description: Toggle the pause status of the table
     * @example: table.liveAjax.togglePause();
     * @return  DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.togglePause()', function () {
        return this.iterator( 'table', function ( dtSettings ) {
            _setPauseStatus(dtSettings, ! dtSettings.liveAjax.paused);
        } );
    } );

    /**
     * Ajax Status
     *
     * @description: Return the XHR status of the current AJAX request
     * @example: table.liveAjax.xhrStatus();
     * @return Integer
     */
    $.fn.dataTable.Api.register( 'liveAjax.xhrStatus()', function () {
        return this.iterator( 'table', function ( dtSettings ) {
            return dtSettings.jqXHR === undefined
                ? undefined
                : dtSettings.jqXHR.readyState;
        }, false )[0];
    } );

    /**
     * Reload/Update Table
     *
     * @description: Check for updates and reload the table
     * @param   {function}  callback        Callback to fire on reload
     * @param   (boolean}   _resetPaging     Reset paging via draw()
     * @param   {boolean}   force           Force update, even if updates are paused
     * @example: Reload table forcefully: table.liveAjax.reload(null, false, true );
     * @return  DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.reload()', function ( overridePause, doneCallback, failCallback, alwaysCallback ) {
        return this.iterator( 'table', function ( dtSettings ) {
            dtSettings.liveAjax.initReload( overridePause, doneCallback, failCallback, alwaysCallback );
        } );
    } );

    /**
     * Update Interval
     *
     * @description:    Update the setTimeout() interval, new interval takes effect after the
     *                  current setTimeout() iteration is completed.
     * @param   {integer}   int         New Interval
     * @param   {boolean}   immediate   Implement this interval immedaitely (meaning clear the existing
     *                                  setTimeout, and initiate a new one)
     * @example:    Set to value of #int: table.liveAjax.interval( $('#int' ).val() );
     * @example:    Reset to init value:  table.liveAjax.setInterval( null );
     * @return      DT API Instance
     */
    $.fn.dataTable.Api.register( 'liveAjax.setInterval()', function ( int, immediate ) {
        return this.iterator( 'table', function ( dtSettings ) {
            var newInt = int || dtSettings.liveAjax.initInterval;

            // If were set to implement this timeout immediately, then clear
            // the existing timeout, and initiate a new one
            if ( immediate === true ) {
                _abortXhr( dtSettings );
                _clearTimeout( dtSettings );
                _initUpdates( dtSettings );
            }

            dtSettings.liveAjax.interval =  _minInterval > newInt ? _minInterval : newInt;

            _fnCallbackFire( dtSettings, null, 'setInterval', [ dtSettings, dtSettings.liveAjax.interval], 'liveAjax' );
        } );
    } );

})( window, document, jQuery );