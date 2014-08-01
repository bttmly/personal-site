---
layout: post
title: DOM Testing
---

Unit testing the DOM can be tricky business. Googling "unit testing DOM" isn't much help either. The first hit is [QUnit](), which has a pretty basic example but doesn't provide much in the way of a comprehensive approach.

- Memory leaks


TL;DR

- Unit testing DOM manipulation can be tricky
- Avoid confusing side-effects by using some kind of DOM node factory.
- Create elements, run tests against them, then dispose of them.

```javascript
var htmlDocs =
  ['./input.html',
  // ...
  './select.html']

var promises = htmlDocs.map( $.get );

$.when.apply( $, promises ).then( function( results ) {
  // do stuff with results
  mocha.run();
});
```

```
var domTrees = (function () {
  var treeStorage = {};
  return {
    insertTree: function ( id, htmlStr ) {
      treeStorage[id] = htmlStr;
    },
    getTree: function ( id ) {
      var div = document.createElement( "div" );
      div.innerHTML = treeStorage[id];
      return div.children[0];
      // or if you have jQuery, use $.parseHTML
    }
  };
})();
```

This approach is based on two things:

At the most basic, this approach requires a way to execute some code after a set of AJAX calls have resolved. 

1. A promise-returning AJAX method.
2. A way to aggregate promises into a single "thennable".

jQuery provides both of these, but you can get this functionality with other libraries. Here I'm going to focus on how to implement this with jQuery.

We want to ensure we have a DOM tree in a predictable state each time we run a test. To accomplish this we create a new set of DOM nodes on the fly from an HTML string and run our tests against those elements.