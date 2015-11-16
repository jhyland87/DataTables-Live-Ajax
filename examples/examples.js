(function($){
    /**
     * This autoGrowInput plugin was taken from the answer by James at StackOverflow
     * @see http://stackoverflow.com/questions/931207/is-there-a-jquery-autogrow-plugin-for-text-fields
     */
    $.fn.autoGrowInput = function(o) {
        o = $.extend({
            maxWidth: 1000,
            minWidth: 0,
            comfortZone: 70
        }, o);
        this.filter('input:text').each(function(){
            var minWidth = o.minWidth || $(this).width(),
                val = '',
                input = $(this),
                testSubject = $('<tester/>').css({
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    width: 'auto',
                    fontSize: input.css('fontSize'),
                    fontFamily: input.css('fontFamily'),
                    fontWeight: input.css('fontWeight'),
                    letterSpacing: input.css('letterSpacing'),
                    whiteSpace: 'nowrap'
                }),
                check = function() {
                    if (val === (val = input.val())) {return;}
                    // Enter new content into testSubject
                    var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    testSubject.html(escaped);
                    // Calculate new width + whether to change
                    var testerWidth = testSubject.width(),
                        newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
                        currentWidth = input.width(),
                        isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                            || (newWidth > minWidth && newWidth < o.maxWidth);
                    // Animate width
                    if (isValidWidthChange) {
                        input.width(newWidth);
                    }
                };
            testSubject.insertAfter(input);
            $(this).bind('keyup keydown blur update', check);
        });
        return this;
    };

})(jQuery);

$(document).ready( function () {
    "use strict";

    // Move the JS to the preview code box
    $('code.javascript').text($('script#example-js').text());

    // Highlight it
    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });

    // Create the events DT Instance
    var event_table = $('table#event-log-table' ).DataTable({
        columns: [
            { width: "20%", targets: 0 },
            { width: "15%", targets: 1 },
            { width: "65%", targets: 2 }
        ],
        order:[[0, 'desc']]
    });

    // Basic function to add a message and timestamp to the top of the event log
    window.addEventLog = function ( event, msg ){
        event_table.row.add( [
            new Date,
            event+'.liveAjax',
            msg
        ] ).draw();
    }

    // Auto-grow the setInterval input, just to be cool
    $( "input#new-interval" ).autoGrowInput( { minWidth:30, comfortZone:5 } );
});