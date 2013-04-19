#knockthrough.js

A simple debugging tool to visualize knockoutjs binding issues.  

Possibly more debugging tools and visualizations in the future.

##Screenshot

![knockthrough screenshot](https://raw.github.com/JonKragh/knockthrough/master/screenshot.png)

##Usage

```javascript

function AppViewModel() {
    this.firstName = ko.observable("Bert");
    this.lastName = ko.observable("Bertington");
    this.fullName = ko.computed(function () {
        return this.firstName() + " " + this.lastName();
    }, this);
}

$(function () {
    var opts = new knockthrough.monitorOptions();
    // pass an instance of knockout
    opts.ko = ko;
    // kickoff the monitor before ko.applyBindings
    var monitor = new knockthrough.monitor(opts);
    // Activates knockout.js
    ko.applyBindings(new AppViewModel());
});
```