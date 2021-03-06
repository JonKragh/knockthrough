#knockthrough.js

A simple debugging tool for knockoutjs.  I'm adding features as I debug various Single Page Apps I'm building.

Tweet me with issues: [@jonkragh](https://twitter.com/jonkragh)

Features:

- **Binding Debugging** 
 - catch and display binding errors
 - highlights the element with the binding error
 - shows the binding error message
 - shows a datacontext dump for the element
- **Debug Hidden Element Issues** 
 - checkbox to display elements hidden by the "visible" binding
 - shows the binding that hid the element
 - shows a datacontext dump for the element
- **View Model Dump / Visibility** 
 - select your active view model in the knockthrough toolbar
 - does a json dump of the view models state
 - supports multiple view models per page
- **Observable Change Log** 
 - Logs all observable property changes

- **Typescript & Javascript Version** 


[Test it out here](http://htmlpreview.github.io/?https://github.com/JonKragh/knockthrough/blob/master/default.htm)
 (click on the red boxes to see the broken bindings). 

##Screenshots

##Binding Debugging
![knockthrough screenshot](https://raw.github.com/JonKragh/knockthrough/master/screenshot.png)

## Observable Property Change Log
![knockthrough binding logger screenshot](https://raw.github.com/JonKragh/knockthrough/master/model-log-screenshot.png)

## Model Dumps
![knockthrough binding logger screenshot](https://raw.github.com/JonKragh/knockthrough/master/screenshot-model-dump.png)

##Usage

- Reference the js and css files:
  - knockthrough.js
  - knockthrough.css
 - Initialize knockthrough **before** you call ko.applyBindings

##Dependencies
- Knockout JS
- jQuery


```javascript

// sample view model
function AppViewModel() {
    this.firstName = ko.observable("Bert");
    this.lastName = ko.observable("Bertington");
    this.fullName = ko.computed(function () {
        return this.firstName() + " " + this.lastName();
    }, this);
}

// initializing knockthrough.js
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