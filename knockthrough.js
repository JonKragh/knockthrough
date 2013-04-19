// knockthrough JavaScript library v0.1.0
// A utility to debug knockout js
// (c) Proactive Logic Consulting, Inc - http://proactivelogic.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
var knockthrough;
(function (knockthrough) {
    var monitorOptions = (function () {
        function monitorOptions() { }
        return monitorOptions;
    })();
    knockthrough.monitorOptions = monitorOptions;    
    var ErrorNode = (function () {
        function ErrorNode() { }
        return ErrorNode;
    })();
    knockthrough.ErrorNode = ErrorNode;    
    var monitor = (function () {
        function monitor(options) {
            this.options = options;
            this._options = options;
            this._options.ko.bindingProvider.instance = new VisualBindingProvider(this._options.ko);
        }
        return monitor;
    })();
    knockthrough.monitor = monitor;    
    var VisualBindingProvider = (function () {
        function VisualBindingProvider(ko) {
            // error hover - these are styled in the knockthrough.css
            this.htmlErrorContainerId = "kt-error-container";
            this.htmlErrorMessageId = "kt-error-message";
            this.htmlContextDumpId = "kt-error-context-dump";
            this.htmlCloseButtonId = "kt-error-close-btn";
            this.originalBindingProvider = new ko.bindingProvider();
            //determine if an element has any bindings
            this.nodeHasBindings = this.originalBindingProvider.nodeHasBindings;
            this.wireupErrorDialog();
        }
        VisualBindingProvider.prototype.wireupErrorDialog = function () {
            // add the error container
            this.$errorMessage = $('<div>').attr("id", this.htmlErrorMessageId);
            this.$contextDump = $('<div>').attr("id", this.htmlContextDumpId);
            this.$closeButton = $('<a>x</a>').attr("id", this.htmlCloseButtonId);
            this.$errorContainer = $('<div></div>').attr("id", this.htmlErrorContainerId).addClass("kt-error-hover").append("").append(this.$closeButton).append(this.$errorMessage).append(this.$contextDump).hide().appendTo("body");
            var that = this;
            $(document).on("click", ".kt-error-node", function (e) {
                var $e = $(e.target);
                e.stopPropagation();
                if($e.hasClass("selected")) {
                    $e.removeClass("selected");
                    that.$errorContainer.hide();
                    return;
                }
                $(".kt-error-node.selected").each(function () {
                    $(this).removeClass("selected");
                });
                $e.addClass("selected");
                var errorDetails = $e.data("ktErrorDetails");
                if(!errorDetails) {
                    return;
                }
                var kodata = ko.dataFor($e[0]);
                var dataStr = JSON.stringify((ko.toJS(kodata)), null, 2);
                that.$errorMessage.text(errorDetails.message);
                that.$contextDump.html("<pre>" + dataStr + "</pre>");
                that.$errorContainer.css({
                    'top': e.pageY,
                    'left': e.pageX
                }).slideDown();
            });
            this.$closeButton.click(function () {
                that.$errorContainer.fadeOut();
            });
        };
        VisualBindingProvider.prototype.getBindings = function (node, bindingContext) {
            //return the bindings given a node and the bindingContext
            var result;
            try  {
                result = this.originalBindingProvider.getBindings(node, bindingContext);
            } catch (e) {
                this.handleBindingError(node, e);
                //throw e;
                            }
            return result;
        };
        VisualBindingProvider.prototype.parseBindingsString = function (bindingsString, bindingContext, node) {
            var result;
            try  {
                result = this.originalBindingProvider.parseBindingsString(bindingsString, bindingContext, node);
            } catch (e) {
                this.handleBindingError(node, e);
                //throw e;
                            }
            return result;
        };
        VisualBindingProvider.prototype.handleBindingError = function (node, e) {
            var $node = $(node).addClass("kt-error-node");
            var errorNode = new ErrorNode();
            errorNode.message = e.message;
            errorNode.description = e.description;
            errorNode.stack = e.stack;
            // the data error
            $node.data("ktErrorDetails", errorNode);
        };
        return VisualBindingProvider;
    })();    
    ;
})(knockthrough || (knockthrough = {}));
//@ sourceMappingURL=knockthrough.js.map
