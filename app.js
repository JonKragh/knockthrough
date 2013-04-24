function AppViewModel() {
    this.firstName = ko.observable("Jon");
    this.lastName = ko.observable("Kragh");
    this.ChildAppViewModel = {
    };
    this.ChildAppViewModel.occupation = ko.observable("Developer");
    this.fullName = ko.computed(function () {
        return this.firstName() + " " + this.lastName();
    }, this);
}
$(function () {
    var opts = new knockthrough.monitorOptions();
    opts.ko = ko;
    var monitor = new knockthrough.monitor(opts);
    var viewModel1 = new AppViewModel();
    ko.applyBindings(viewModel1, $("#view-modal-1")[0]);
    var viewModel2 = new AppViewModel();
    viewModel2.firstName("Jane");
    viewModel2.lastName("Doe");
    ko.applyBindings(viewModel2, $("#view-modal-2")[0]);
    viewModel1.firstName("Jon - updated");
    viewModel1.ChildAppViewModel.occupation("Developer - Updated");
});
//@ sourceMappingURL=app.js.map
