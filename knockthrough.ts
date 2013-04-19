// knockthrough JavaScript library v0.1.0
// A utility to debug knockout js
// (c) Proactive Logic Consulting, Inc - http://proactivelogic.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
module knockthrough {
    declare var $: any;
    declare var ko: any;

    export class monitorOptions {
        ko: any;
    }
    export class ErrorNode {
        message: string;
        stack: string;
        description: string;
    }

    export class monitor {

        _options: monitorOptions;

        constructor(public options: monitorOptions) {
            this._options = options;
            this._options.ko.bindingProvider.instance = new VisualBindingProvider(this._options.ko);
        }
    }

    class VisualBindingProvider {
        $errorContainer: any;
        $errorMessage: any;
        $contextDump: any;
        $closeButton: any;

        // VisualBindingProvider started and extended from RP Niemeyer's 
        // answer to this question on how to catch binding errors:
        // http://stackoverflow.com/questions/13136678/knockoutjs-catch-errors-binding
        nodeHasBindings: any;

        // error hover - these are styled in the knockthrough.css
        htmlErrorContainerId: string = "kt-error-container";
        htmlErrorMessageId: string = "kt-error-message";
        htmlContextDumpId: string = "kt-error-context-dump";
        htmlCloseButtonId: string = "kt-error-close-btn";
        originalBindingProvider: any;

        constructor(ko) {

            this.originalBindingProvider = new ko.bindingProvider();



            //determine if an element has any bindings
            this.nodeHasBindings = this.originalBindingProvider.nodeHasBindings;

            this.wireupErrorDialog();

        }

        wireupErrorDialog() {
            // add the error container
            this.$errorMessage = $('<div>').attr("id", this.htmlErrorMessageId);
            this.$contextDump = $('<div>').attr("id", this.htmlContextDumpId);
            this.$closeButton = $('<a>x</a>').attr("id", this.htmlCloseButtonId);

            this.$errorContainer = $('<div></div>')
                .attr("id", this.htmlErrorContainerId)
                .addClass("kt-error-hover")
                .append("")
                .append(this.$closeButton)
                .append(this.$errorMessage)
                .append(this.$contextDump)
                .hide()
                .appendTo("body");

            var that = this;
            $(document).on("click", ".kt-error-node", function (e) {

                var $e = $(e.target);
                e.stopPropagation();

                if ($e.hasClass("selected")) {
                    $e.removeClass("selected");
                    that.$errorContainer.hide();
                    return;
                }

                $(".kt-error-node.selected").each(function () {
                    $(this).removeClass("selected");
                });

                $e.addClass("selected");
                var errorDetails = <ErrorNode>$e.data("ktErrorDetails");
                if (!errorDetails) return;

                var kodata = ko.dataFor($e[0]);
                var dataStr = JSON.stringify((ko.toJS(kodata)), null, 2);

                that.$errorMessage.text(errorDetails.message);
                that.$contextDump.html("<pre>" + dataStr + "</pre>");
                that.$errorContainer.css({ 'top': e.pageY, 'left': e.pageX }).slideDown();

            });

            this.$closeButton.click(function () {
                that.$errorContainer.fadeOut();
            });
        }

        getBindings(node, bindingContext) {

            //return the bindings given a node and the bindingContext

            var result;
            try {
                result = this.originalBindingProvider.getBindings(node, bindingContext);
            }
            catch (e) {
                this.handleBindingError(node, e);
                //throw e;
            }

            return result;
        }

        parseBindingsString(bindingsString, bindingContext, node) {
            var result;
            try {
                result = this.originalBindingProvider.parseBindingsString(bindingsString, bindingContext, node);
            }
            catch (e) {
                this.handleBindingError(node, e);
                //throw e;
            }
            return result;
        }

        private handleBindingError(node, e) {
            var $node = $(node).addClass("kt-error-node");
            var errorNode = new ErrorNode();
            errorNode.message = e.message;
            errorNode.description = e.description;
            errorNode.stack = e.stack;

            // the data error
            $node.data("ktErrorDetails", errorNode);
        }
    };

}

