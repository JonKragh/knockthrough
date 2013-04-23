/// <reference path="knockthrough.ts" />

declare var $: any;
declare var ko: any;

// This is a simple *viewmodel* - JavaScript that defines the data and behavior of your UI
function AppViewModel() {
    this.firstName = ko.observable("Jon");
    this.lastName = ko.observable("Kragh");

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
    ko.applyBindings(new AppViewModel(), $("#view-modal-1")[0]);

    var viewModel2 = new AppViewModel();
    viewModel2.firstName("Jane");
    viewModel2.lastName("Doe");

    ko.applyBindings(viewModel2, $("#view-modal-2")[0]);
});