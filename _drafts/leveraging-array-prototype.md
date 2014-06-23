—
layout: post
title: Leveraging Array.prototype 
subtitle: to ease the pain of dropping jQuery
date:
—

_Originally posted to [Medium](https://medium.com/@nickhbottomley/65a3e88415c5) on April 26, 2014; edited for clarity and re-posted here on June 22, 2014._

The [push](http://youmightnotneedjquery.com/) to stop using jQuery as a library dependency is great, but jumping head-first into the DOM APIs can be a little rough at times. Nonetheless, familiarity with the vanilla DOM is a crucial skill in a front-end JavaScript dev’s skillset. Plus, modern browsers support APIs that make typical jQuery operations like class manipulation, property/attribute setting or retrieval, and tree traversal fairly easy.

What you don’t have are easy, built-in ways to operate on collections of elements or nodes. Calls to [document.querySelectorAll](https://developer.mozilla.org/en-US/docs/Web/API/Document.querySelectorAll) and [document.getElementsByTagName](https://developer.mozilla.org/en-US/docs/Web/API/document.getElementsByTagName) return array-like objects that are basically devoid of useful methods. Specifically, both should return instances of HTMLCollection, but that’s not how it [actually works](https://bugzilla.mozilla.org/show_bug.cgi?id=14869) — querySelectorAll returns an instance of NodeList in WebKit browsers. It’d be great if both of these were subclasses of Array, but, alas, they aren’t. So what to do?

Well, `Array.prototype` has all the goodness you want. One way is to take the [functional approach](https://medium.com/functional-javascript/45a9dca6c64a) and co-opt an Array.prototype method like so:

```javascript
var map = Function.prototype.call.bind( Array.prototype.map );

var articles = document.querySelectorAll( ".article" );

var articleIds = map( articles, function( node ) {
  return node.id;
});
```

There’s a [good answer](http://stackoverflow.com/questions/11121586/how-does-function-prototype-call-bind-work) on StackOverflow which explains how .call and .bind work together. I also just came across [an article](http://www.smashingmagazine.com/2014/01/23/understanding-javascript-function-prototype-bind/) on Smashing Magazine which demonstrates some approaches similar to those given here.

Here’s my own explanation of what’s going on

```javascript
Function.prototype.call.bind( Array.prototype.map )
```

Generally, [call()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) is used as a method of another function. Maybe you’ve used this trick before to transform an arguments object into a plain array.

```javascript
var args = Array.prototype.slice.call( arguments )
```

Here, `call()` is used as a method of `Array.prototype.slice`. Presumably, the `this` keyword is used somewhere in the inner workings of `call()` to refer to the object of which it’s being used a method — which, in this case, is `Array.prototype.slice`.

But when we access this method “nakedly” as `Function.prototype.call`, rather than as a method of a function, it doesn’t know what `this` should be set to. What function is it supposed to be calling? This is where `bind()` comes in. Check out `Function.prototype.bind` [on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind). The first sentence is

> The `bind()` method creates a new function that, when called, has its `this` keyword set to the provided value

The `bind()` method creates a new function that, when called, has its this keyword set to the provided value
So ultimately, what the expression evaluates to is a version of `call()` where this is set to `Array.prototype.map`, a feat which we accomplish through `bind()`. If this explanation is unclear please do let me know!

You can do the same pattern for any other `Array.prototype` method you’d like to use. Also, this code can be made a bit shorter by replacing `Array.prototype` with simply `[]`, however I prefer to be explicit because it’s a bit more clear what’s actually going on.

Alternately, you can use this strategy to create a super lightweight DOM selection function.

```javascript
function select( selector ) {
  return [].slice.call( context.querySelectorAll( selector ) );
}
```

With a few more lines of code you could optimize it to use [faster](http://jsperf.com/getelementbyid-vs-queryselector) selection methods like `getElementById`, `getElementsByTagName`, etc. when appropriate.

Using Array.prototype.slice.call(arguments) to transform the array-like arguments object into an actual array is an old trick. These functions accomplish the same thing for DOM node collections. Both of these functions will return real arrays with all the useful methods you want. As mentioned above, the first line here—L11 in the code—could and probably should be written like so:


var slice = Function.prototype.call.bind( Array.prototype.slice );

A couple caveats to keep in mind when working with regular arrays, as opposed to NodeList/HTMLCollection:

NodeList and HTMLCollection are sometimes “live” — as in “they are automatically updated when the underlying document is changed.” When you map them to an array, you lose this feature. If you are coming from jQuery, this will be natural. If you’ve been using vanilla DOM APIs for a while, it might be unexpected. However, from some very basic testing in Chrome it seems to me that HTMLCollection tends to be live while NodeList does not (despite what MDN [might say](https://developer.mozilla.org/en-US/docs/Web/API/NodeList)). With small but important discrepancies like this, you’re probably better off working with regular arrays anyway.

There is another, probably lesser known, piece of functionality you lose when mapping HTMLCollection to Array. With an HTMLCollection, you can access members by either their index, or their id attribute (with the name attribute as a fallback). As such, you can do things like collection.item to get the member with id=“item”. Once you’re working with an array, you’d need to use filter (or something similar) to accomplish the same thing.
Yet another approach, I guess, is to start mucking around with the NodeList and HTMLCollection prototypes. 

If you felt so inclined, you could copy the array methods wholesale onto another prototype like so:

```javascript
var methods = ["forEach", "filter", "map", "slice", "splice"];
// etc.

methods.forEach( function( method ) {
  NodeList.prototype[method] = function() {
    return Array.prototype[method].call( this, arguments );
  };
});
```
But... definitely don’t do this. Even if you’re OK with extending host objects, this is still probably not the best approach. First, you’re sort of sneakily returning an Array where it’d be more natural to expect a NodeList. Second, you’d have to implement all the methods you want on both NodeList and HTMLCollection to make sure everything behaves as expected. Finally, going around messing with prototypes, _especially_ host objects, is a bad habit to get into.

That said, the following might actually be fairly useful

```javascript
HTMLCollection.prototype.toArray =
NodeList.prototype.toArray =
function() {
  return Array.prototype.slice.call( this );
}
```

We’re still augmenting the HTMLCollection and NodeList prototypes which isn’t ideal. However, this approach requires far less setup, and is generally more comprehensible than the others. Both previous options I described involve defining a bunch of functions that abstract away some fairly tricky prototype/call/bind stuff.

Eventually we’ll be able to do away with these workarounds. The DOM4 specification includes an [Elements class](http://www.w3.org/TR/domcore/#collections:-elements) that extends Array. Hooray! Instances of Node and of Elements will have .query() and .queryAll() methods that will search their context subtree(s) for matching elements, and return an Elements object with array methods. Pretty sweet right? **Update**: I recently came across [a polyfill](https://github.com/barberboy/dom-elements) for Elements and the element query methods. The future is now.

Thanks for reading. Find me on [Twitter](https://twitter.com/nickhbottomley) for any questions or comments.