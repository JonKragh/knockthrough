#knockthrough
============

A simple debugging tool to visualize knockoutjs issues.

##Usage:

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