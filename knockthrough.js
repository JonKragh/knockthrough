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
    var MonitorDialog = (function () {
        function MonitorDialog() {
            this.htmlErrorContainerClass = "kt-error-container";
            this.htmlErrorMessageClass = "kt-error-message";
            this.htmlContextDumpClass = "kt-error-context-dump";
            this.htmlCloseButtonClass = "kt-error-close-btn";
            this.Message = null;
            this.KoData = null;
            var that = this;
            this.$message = $('<div>').addClass(this.htmlErrorMessageClass);
            this.$contextDump = $('<div>').addClass(this.htmlContextDumpClass);
            this.$closeButton = $('<a>x</a>').addClass(this.htmlCloseButtonClass);
            this.$container = $('<div></div>').addClass(this.htmlErrorContainerClass).addClass("kt-error-hover").append("").append(this.$closeButton).append(this.$message).append(this.$contextDump).hide().appendTo("body");
            this.$closeButton.click(function () {
                that.$container.hide();
            });
        }
        MonitorDialog.prototype.showSmall = function (top, left) {
            this.$container.css({
                'top': top,
                'left': left
            });
            this.show();
        };
        MonitorDialog.prototype.show = function () {
            var dataStr = JSON.stringify((ko.mapping.toJS(this.KoData, {
                'ignore': [
                    "__ko_mapping__"
                ]
            })), null, 2);
            this.$message.text(this.Message);
            this.$contextDump.html("<pre>" + dataStr + "</pre>");
            this.$container.show();
        };
        MonitorDialog.prototype.showFullScreen = function () {
            this.$container.css({
                'top': 10,
                'left': 10,
                'width': ($(window).width() - 100) + "px",
                'height': ($(window).height() - 150) + "px"
            });
            this.show();
        };
        MonitorDialog.prototype.close = function () {
            this.$container.hide();
        };
        return MonitorDialog;
    })();
    knockthrough.MonitorDialog = MonitorDialog;    
    var monitor = (function () {
        function monitor(options) {
            this.options = options;
            this.hiddenByVisibleBindingClassName = "kt-hidden-by-visible-binding";
            this.$boundModelSelect = null;
            this.selectedModel = null;
            this._options = options;
            var bp = new VisualBindingProvider(this._options.ko);
            this._options.ko.bindingProvider.instance = bp;
            this.wireupVisibleMonitor(options);
            this.createToolBar();
            this.watchApplyBindings();
        }
        monitor.prototype.watchApplyBindings = function () {
            var that = this;
            var origApplyBindings = ko.applyBindings;
            var count = 1;
            ko.applyBindings = function (viewModel, rootNode) {
                origApplyBindings(viewModel, rootNode);
                var thisCount = count;
                $("<option>").text("bound model #" + thisCount).data("kt-bound-model", viewModel).appendTo(that.$boundModelSelect);
                if(that.selectedModel === null) {
                    that.selectedModel = viewModel;
                }
                count = count + 1;
            };
        };
        monitor.prototype.createToolBar = function () {
            var that = this;
            var $toolbar = $("<div>").attr("id", "kt-toolbar");
            var $showHiddenCheckBox = $('<input id="kt-toolbar-show-hidden-checkbox" type="checkbox" />');
            $toolbar.append($showHiddenCheckBox);
            $toolbar.append('<label for="kt-toolbar-show-hidden-checkbox">show elements hidden by visible bindings</label>');
            this.$boundModelSelect = $("<select>");
            this.$boundModelSelect.change(function (e) {
                var $selectedOption = that.$boundModelSelect.find(":selected");
                that.selectedModel = $selectedOption.data("kt-bound-model");
            });
            var $dumpModelCont = $("<div>").attr("id", "kt-dump-model-cont");
            var $dumpModelLink = $("<a href='#'>").attr("id", "kt-dump-model-link").text("dump model").appendTo($toolbar);
            $dumpModelLink.click(function (e) {
                that.dumpViewModel();
                e.preventDefault();
            });
            $dumpModelCont.append(this.$boundModelSelect);
            $dumpModelCont.append($dumpModelLink);
            $toolbar.append($dumpModelCont);
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
        };
        monitor.prototype.dumpViewModel = function () {
            if(this.selectedModel) {
                var dialog = new MonitorDialog();
                dialog.Message = "Model Dump";
                dialog.KoData = this.selectedModel;
                dialog.showFullScreen();
            }
        };
        monitor.prototype.wireupVisibleMonitor = function (options) {
            var origVisibleHandler = options.ko.bindingHandlers.visible;
            var that = this;
            options.ko.bindingHandlers.visible = {
                update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = valueAccessor();
                    var wasVisible = !(element.style.display == "none");
                    origVisibleHandler.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                    var isVisible = !(element.style.display == "none");
                    if(isVisible != wasVisible) {
                        var $element = $(element);
                        if(isVisible) {
                            $element.removeClass(that.hiddenByVisibleBindingClassName);
                        } else {
                            var hidden = element;
                            $element.addClass(that.hiddenByVisibleBindingClassName);
                        }
                    }
                }
            };
            $(document).on("click", "." + this.hiddenByVisibleBindingClassName, function (e) {
                var $e = $(e.target);
                var existingDialog = $e.data("kt-dialog-instance");
                if(existingDialog != null) {
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
        };
        return monitor;
    })();
    knockthrough.monitor = monitor;    
    var VisualBindingProvider = (function () {
        function VisualBindingProvider(ko) {
            this.originalBindingProvider = new ko.bindingProvider();
            this.wireupErrorDialog();
        }
        VisualBindingProvider.prototype.wireupErrorDialog = function () {
            var that = this;
            $(document).on("click", ".kt-error-node", function (e) {
                var $e = $(e.target);
                e.stopPropagation();
                var existingDialog = $e.data("kt-dialog-instance");
                if(existingDialog != null) {
                    $e.removeClass("selected");
                    existingDialog.close();
                    $e.data("kt-dialog-instance", null);
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
                var dialog = new MonitorDialog();
                dialog.Message = errorDetails.message;
                dialog.KoData = ko.dataFor($e[0]);
                dialog.showSmall(e.pageY, e.pageX);
                $e.data("kt-dialog-instance", dialog);
            });
        };
        VisualBindingProvider.prototype.nodeHasBindings = function (node) {
            var result = this.originalBindingProvider.nodeHasBindings(node);
            return result;
        };
        VisualBindingProvider.prototype.getBindings = function (node, bindingContext) {
            var result;
            try  {
                result = this.originalBindingProvider.getBindings(node, bindingContext);
            } catch (e) {
                this.handleBindingError(node, e);
            }
            return result;
        };
        VisualBindingProvider.prototype.parseBindingsString = function (bindingsString, bindingContext, node) {
            var result;
            try  {
                result = this.originalBindingProvider.parseBindingsString(bindingsString, bindingContext, node);
            } catch (e) {
                this.handleBindingError(node, e);
            }
            return result;
        };
        VisualBindingProvider.prototype.handleBindingError = function (node, e) {
            var $node = $(node).addClass("kt-error-node");
            var errorNode = new ErrorNode();
            errorNode.message = e.message;
            errorNode.description = e.description;
            errorNode.stack = e.stack;
            $node.data("ktErrorDetails", errorNode);
        };
        return VisualBindingProvider;
    })();    
    ;
})(knockthrough || (knockthrough = {}));
//@ sourceMappingURL=knockthrough.js.map
