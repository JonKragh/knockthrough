// knockthrough JavaScript library v0.1.3
// A utility to debug knockout js
// (c) Proactive Logic Consulting, Inc - http://proactivelogic.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
module knockthrough {
    declare var $: any;
    declare var ko: any;

    export class monitorOptions {
        ko: any;
        enableObservableWatch: bool = true; // subscribes to all observable changes 
        logEntries: number = 200; // amount of log entries to keep
    }
    export class ErrorNode {
        message: string;
        stack: string;
        description: string;
    }

    export class MonitorDialog {

        htmlDialogContainerClass: string = "kt-dialog-container";
        htmlDialogHeaderClass: string = "kt-dialog-header";
        htmlDialogBodyClass: string = "kt-dialog-body";

        htmlDialogMessageClass: string = "kt-dialog-message";
        htmlContextDumpClass: string = "kt-error-context-dump";
        htmlCloseButtonClass: string = "kt-error-close-btn";

        $container: any;
        $message: any;
        $contextDump: any;
        $closeButton: any;

        constructor() {

            var that = this;
            // add the error container
            this.$message = $('<div>').addClass(this.htmlDialogMessageClass);
            this.$contextDump = $('<div>').addClass(this.htmlContextDumpClass);
            var $dialogHeader = $('<div>').addClass(this.htmlDialogHeaderClass);
            var $dialogBody = $('<div>').addClass(this.htmlDialogBodyClass);

            var $selectModelLink = $('<a href="#">select model</a>');

            $dialogBody.append(this.$message);
            $dialogBody.append($selectModelLink);
            $dialogBody.append(this.$contextDump);

            this.$closeButton = $('<a>x</a>').addClass(this.htmlCloseButtonClass);
            $dialogHeader.append(this.$closeButton);

            this.$container = $('<div></div>')
                .addClass(this.htmlDialogContainerClass)
                .append($dialogHeader)
                .append($dialogBody)
                .hide()
                .appendTo("body");

            this.$closeButton.click(function () {
                that.close();
            });

            $selectModelLink.click(function (e) {
                that.selectText(that.$contextDump);
            });

        }

        public Message: string = null;
        public KoData: any = null;

        public showSmall(top, left) {


            this.$container.css({ 'top': top, 'left': left });
            this.show();
        }
        private show() {

            var dataStr = JSON.stringify(ko.toJS(this.KoData), function (key, val) {
                return key === '__ko_mapping__' ? undefined : val;
            }, 2);

            this.$message.text(this.Message);

            this.$contextDump.html("<pre>" + dataStr + "</pre>");
            this.$container.show();
            var that = this;
            $("body").click(function (e) {
                var $target = $(e.target);

                // ignore clicks on the dialog
                if ($target.hasClass(that.htmlDialogContainerClass)) return;
                if ($target.closest("." + that.htmlDialogContainerClass).length > 0) return;
                that.close();
            });
        }

        public showFullScreen() {
            this.$container.css({ 'top': 10, 'left': 100, 'width': ($(window).width() - 200) + "px", 'height': ($(window).height() - 200) + "px" });
            this.show();
        }

        public close() {
            this.$container.remove();
        }

        selectText($element) {
            var doc = document
                , element = $element[0]
                , range, selection;

            var body = <any>doc.body;
            var doc2 = <any>document.body;

            if (body.createTextRange) {
                range = doc2.createTextRange();
                range.moveToElementText(element);
                range.select();
            } else if (window.getSelection) {
                selection = window.getSelection();
                range = document.createRange();
                range.selectNodeContents(element);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

    }
    export class ModelWatch {

        rootWatchNode: ModelWatchNode;
        constructor(model, parentName, callback) {

            if (!parentName) {
                parentName = "root";
            }
            this.rootWatchNode = new ModelWatchNode(model, parentName, callback);
        }
    }
    export class ModelWatchNode {

        watchedNodes: ModelWatchNode[] = [];

        constructor(node, parentName, callback) {
            var that = this;
            for (var prop in node) {
                if (!node.hasOwnProperty(prop)) continue;

                if (prop === "ko") continue;
                if (prop === "$root") continue;
                if (prop === "$parents") continue;
                if (prop === "$parent") continue;
                if (prop === "$parentContext") continue;
                if (ko.isObservable(node[prop])) {

                    (function() {
                        var currentValue = node[prop]();
                        var propName = prop;
                        var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
                        node[prop].subscribe(function (newValue) {
                            var alertText = time + " - " + "<span class='kt-watch-data-point-name'>" + parentName + "." + propName + "</span>" +
                                 "<span class='kt-watch-data-points'>[from: <span class='kt-watch-data-point-from'>" + currentValue + "</span> to: " + "<span class='kt-watch-data-point-to'>" + newValue + "</span>]</span>";
                            currentValue = newValue;
                            callback(alertText);
                        });
                    } ());

                    var child = new ModelWatchNode(node[prop](), parentName + "." + prop, callback);
                    this.watchedNodes.push(child);
                }
                else {
                    var propValue = node[prop];
                    if (typeof propValue === 'object') {
                        var child = new ModelWatchNode(propValue, parentName + "." + prop, callback);
                    }
                    this.watchedNodes.push(child);
                }

            }
        }


    }

    export class monitor {

        _options: monitorOptions;

        hiddenByVisibleBindingClassName: string = "kt-hidden-by-visible-binding";
        $boundModelSelect: any = null;
        $watchList: any = null;
        selectedModel: any = null;

        constructor(public options: monitorOptions) {
            this._options = options;
            var bp = new VisualBindingProvider(this._options.ko);
            this._options.ko.bindingProvider.instance = bp;

            this.wireupVisibleMonitor(options);

            this.createToolBar();

            this.watchApplyBindings();

        }

        handleObservableChange(oldValue, newValue) {
            var test = oldValue + newValue;

        }

        // track all models bound with ko.applyBindings

        WatchedModels: ModelWatch[] = [];

        watchApplyBindings() {
            var that = this;
            var addedCount = 0;
            var origApplyBindings = ko.applyBindings;
            var count = 1;
            // override knockouts applybindings - gotta love js
            ko.applyBindings = function (viewModel, rootNode) {
                // call the original
                origApplyBindings(viewModel, rootNode);
                var thisCount = count;

                var name = that.getModelName(viewModel);
                $("<option>").text("bound model #" + thisCount + " [" + name + "]").data("kt-bound-model", viewModel).appendTo(that.$boundModelSelect);
                if (that.selectedModel === null) {
                    that.selectedModel = viewModel;
                }
                count = count + 1;
                
                if (that._options.enableObservableWatch) {
                    var modelWatch = new ModelWatch(viewModel, name, function (message) {
                        addedCount++;

                        
                        if (addedCount > that._options.logEntries) {
                            var last = that.$watchList.find("li:last-child");
                            last.remove();
                        }
                        that.$watchList.prepend("<li>" + message + "</li>");
                    } );
                    that.WatchedModels.push(modelWatch);
                }
            }

        }

        getModelName(obj) {
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec((obj).constructor.toString());
            return (results && results.length > 1) ? results[1] : "";
        }

        createToolBar() {

            var that = this;
            var $left = $("<div>").attr("id", "kt-toolbar-left");
            var $right = $("<div>").attr("id", "kt-toolbar-right");

            var $hideToolbarLink = $("<a id='kt-hide-toolbar-link' href='#'>minimize</a>");

            $right.append($hideToolbarLink);

            var $toolbar = $("<div>").attr("id", "kt-toolbar");
            var $showToolbarLink = $("<a id='kt-show-toolbar-link' href='#'>knockthrough.js</a>");

            var $toolbarHidden = $("<div>").attr("id", "kt-toolbar-hidden").append($showToolbarLink).hide();
            $toolbarHidden.appendTo("body");

            $showToolbarLink.click(function (e) {
                e.preventDefault();
                $toolbarHidden.hide();
                $toolbar.show();
            });

            $hideToolbarLink.click(function (e) {
                e.preventDefault();
                $toolbar.slideDown().hide();
                $toolbarHidden.show();
            });

            

            //// select a view model
            this.$boundModelSelect = $("<select>");
            this.$boundModelSelect.change(function (e) {

                var $selectedOption = that.$boundModelSelect.find(":selected");
                that.selectedModel = $selectedOption.data("kt-bound-model");
            });

            // dump model
            var $dumpModelCont = $("<div>").attr("id", "kt-dump-model-cont");

            var $dumpModelLink = $("<a href='#'>").attr("id", "kt-dump-model-link").text("dump model").appendTo($dumpModelCont);
            $dumpModelLink.click(function (e) {
                that.dumpViewModel();
                e.preventDefault();
                e.stopPropagation();
            });

            $dumpModelCont.append(this.$boundModelSelect);
            $dumpModelCont.append($dumpModelLink);

            $right.append($dumpModelCont);

            //// hidden elements
            var $showHiddenCont = $("<div>").attr("id", "kt-toolbar-show-hidden-cont");

            var $showHiddenCheckBox = $('<input id="kt-toolbar-show-hidden-checkbox" type="checkbox" />');
            $showHiddenCont.append($showHiddenCheckBox);
            $showHiddenCont.append('<label for="kt-toolbar-show-hidden-checkbox">show elements hidden by visible bindings</label>');
            $right.append($showHiddenCont);

            // watch

            this.$watchList = $("<ul>").attr("id", "kt-watch-select-list");
            $left.append(this.$watchList);

            // logo
            var $logo = $("<div>").attr("id", "kt-logo").append('<a href="https://github.com/JonKragh/knockthrough">knockthrough.js</a> <span>v0.1.3</span> by <a href="http://www.JonKragh.com">Jon Kragh</a>');

            $right.append($logo);

            $toolbar.append($left);
            $toolbar.append($right);
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

