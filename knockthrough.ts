// knockthrough JavaScript library v0.1.2
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

    export class MonitorDialog {

        htmlErrorContainerClass: string = "kt-error-container";
        htmlErrorMessageClass: string = "kt-error-message";
        htmlContextDumpClass: string = "kt-error-context-dump";
        htmlCloseButtonClass: string = "kt-error-close-btn";

        $container: any;
        $message: any;
        $contextDump: any;
        $closeButton: any;

        constructor() {

            var that = this;
            // add the error container
            this.$message = $('<div>').addClass(this.htmlErrorMessageClass);
            this.$contextDump = $('<div>').addClass(this.htmlContextDumpClass);
            this.$closeButton = $('<a>x</a>').addClass(this.htmlCloseButtonClass);

            this.$container = $('<div></div>')
                .addClass(this.htmlErrorContainerClass)
                .addClass("kt-error-hover")
                .append("")
                .append(this.$closeButton)
                .append(this.$message)
                .append(this.$contextDump)
                .hide()
                .appendTo("body");

            this.$closeButton.click(function () {
                that.$container.hide();
            });
        }

        public Message: string = null;
        public KoData: any = null;

        public showSmall(top, left) {


            this.$container.css({ 'top': top, 'left': left });
            this.show();
        }
        private show() {


            var dataStr = JSON.stringify((ko.mapping.toJS(this.KoData, {
                'ignore': ["__ko_mapping__"]
            })), null, 2);

            this.$message.text(this.Message);

            this.$contextDump.html("<pre>" + dataStr + "</pre>");
            this.$container.show();
        }

        public showFullScreen() {
            this.$container.css({ 'top': 10, 'left': 10, 'width': ($(window).width() - 100) + "px", 'height': ($(window).height() - 150) + "px" });
            this.show();
        }

        public close() {
            this.$container.hide();
        }
    }

    export class monitor {

        _options: monitorOptions;

        hiddenByVisibleBindingClassName: string = "kt-hidden-by-visible-binding";
        $boundModelSelect: any = null;
        selectedModel: any = null;

        constructor(public options: monitorOptions) {
            this._options = options;
            var bp = new VisualBindingProvider(this._options.ko);
            this._options.ko.bindingProvider.instance = bp;

            this.wireupVisibleMonitor(options);
            this.createToolBar();
            this.watchApplyBindings();
        }

        // track all models bound with ko.applyBindings
        watchApplyBindings() {
            var that = this;

            var origApplyBindings = ko.applyBindings;
            var count = 1;
            // override knockouts applybindings - gotta love js
            ko.applyBindings = function (viewModel, rootNode) {
                // call the original
                origApplyBindings(viewModel, rootNode);
                var thisCount = count;
                $("<option>").text("bound model #" + thisCount).data("kt-bound-model", viewModel).appendTo(that.$boundModelSelect);
                if (that.selectedModel === null) {
                    that.selectedModel = viewModel;
                }
                count = count + 1;
            }

        }


        createToolBar() {
            var that = this;

            var $toolbar = $("<div>").attr("id", "kt-toolbar");

            // hidden elements
            var $showHiddenCheckBox = $('<input id="kt-toolbar-show-hidden-checkbox" type="checkbox" />');
            $toolbar.append($showHiddenCheckBox);
            $toolbar.append('<label for="kt-toolbar-show-hidden-checkbox">show elements hidden by visible bindings</label>');

            // select a view model
            this.$boundModelSelect = $("<select>");
            this.$boundModelSelect.change(function (e) {

                var $selectedOption = that.$boundModelSelect.find(":selected");
                that.selectedModel = $selectedOption.data("kt-bound-model");
            });

            

            // dump model
            var $dumpModelCont = $("<div>").attr("id", "kt-dump-model-cont");

            

            var $dumpModelLink = $("<a href='#'>").attr("id","kt-dump-model-link").text("dump model").appendTo($toolbar);
            $dumpModelLink.click(function (e) {
                that.dumpViewModel();
                e.preventDefault();

            });

            $dumpModelCont.append(this.$boundModelSelect);
            $dumpModelCont.append($dumpModelLink);

            $toolbar.append($dumpModelCont);

            // logo
            var $logo = $("<div>").attr("id", "kt-logo").append('<a href="https://github.com/JonKragh/knockthrough">knockthrough.js</a> <span>v0.1.2</span> by <a href="http://www.JonKragh.com">Jon Kragh</a>');

            $toolbar.append($logo);
            $toolbar.appendTo("body");

            var that = this;

            $showHiddenCheckBox.click(function (e) {
                var isChecked = $(e.target).is(":checked");
                $("." + that.hiddenByVisibleBindingClassName).each(function () {
                    $(this).toggle(isChecked);
                });
            });
        }

        dumpViewModel() {
            if (this.selectedModel) {
                var dialog = new MonitorDialog();
                dialog.Message = "Model Dump";
                dialog.KoData = this.selectedModel;
                //dialog.show(Math.floor(window.innerHeight / 2), Math.floor(window.innerWidth / 2));
                dialog.showFullScreen();

            }
        }

        wireupVisibleMonitor(options: monitorOptions) {

            /* override the default visible monitor */
            var origVisibleHandler = options.ko.bindingHandlers.visible;
            var that = this;
            options.ko.bindingHandlers.visible = {
                update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = valueAccessor();
                    var wasVisible = !(element.style.display == "none");

                    origVisibleHandler.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);

                    var isVisible = !(element.style.display == "none");

                    if (isVisible != wasVisible) {

                        var $element = $(element);

                        // visibility changed
                        if (isVisible) {
                            $element.removeClass(that.hiddenByVisibleBindingClassName);
                        }
                        else {
                            // add to hidden element list
                            var hidden = element;

                            $element.addClass(that.hiddenByVisibleBindingClassName);
                        }
                    }
                }



            };

            $(document).on("click", "." + this.hiddenByVisibleBindingClassName, function (e) {

                var $e = $(e.target);
                var existingDialog = $e.data("kt-dialog-instance");

                if (existingDialog != null) {
                    existingDialog.close();
                    $e.data("kt-dialog-instance", null);
                    return;
                }


                var dialog = new MonitorDialog();
                dialog.Message = "binding: " + $e.attr("data-bind");
                dialog.KoData = ko.dataFor($e[0]);
                dialog.showSmall(e.pageY, e.pageX);
                $e.data("kt-dialog-instance", dialog);

            });

        }
    }


    class VisualBindingProvider {


        // VisualBindingProvider started and extended from RP Niemeyer's 
        // answer to this question on how to catch binding errors:
        // http://stackoverflow.com/questions/13136678/knockoutjs-catch-errors-binding
        //nodeHasBindings: any;

        // error hover - these are styled in the knockthrough.css

        originalBindingProvider: any;

        constructor(ko) {

            this.originalBindingProvider = new ko.bindingProvider();
            this.wireupErrorDialog();

        }

        wireupErrorDialog() {

            var that = this;
            $(document).on("click", ".kt-error-node", function (e) {

                var $e = $(e.target);
                e.stopPropagation();

                var existingDialog = $e.data("kt-dialog-instance");

                if (existingDialog != null) {
                    $e.removeClass("selected");
                    existingDialog.close();
                    $e.data("kt-dialog-instance", null);
                    return;
                }


                $(".kt-error-node.selected").each(function () {
                    $(this).removeClass("selected");
                });

                $e.addClass("selected");
                var errorDetails = <ErrorNode>$e.data("ktErrorDetails");
                if (!errorDetails) return;


                var dialog = new MonitorDialog();
                dialog.Message = errorDetails.message;
                dialog.KoData = ko.dataFor($e[0]);
                dialog.showSmall(e.pageY, e.pageX);

                $e.data("kt-dialog-instance", dialog);

            });


        }

        nodeHasBindings(node) {

            var result = this.originalBindingProvider.nodeHasBindings(node);
            return result;
        }

        getBindings(node, bindingContext) {

            //return the bindings given a node and the bindingContext

            var result;
            try {

                result = this.originalBindingProvider.getBindings(node, bindingContext);
            }
            catch (e) {
                this.handleBindingError(node, e);
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

