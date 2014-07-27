---
layout: post
title: DOM Testing
---

// The top hits for unit testing DOM

TL;DR

- Unit testing DOM manipulation can be tricky
- Create DOM nodes on the fly and use them for testing


```javascript
var htmlDocs =
  ['./input.html',
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


1. A promise-returning AJAX method.
2. A way to aggregate promises.