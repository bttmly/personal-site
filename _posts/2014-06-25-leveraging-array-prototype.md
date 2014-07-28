---
layout: post
title: Leveraging Array.prototype 
---

_Originally posted to [Medium](https://medium.com/@nickhbottomley/65a3e88415c5) on April 26, 2014; heavily edited and re-posted here on June 25, 2014._

`Array.prototype` is the coolest object in JavaScript. Well, the [ES5 version](http://blogs.msdn.com/b/ie/archive/2010/12/13/ecmascript-5-part-2-array-extras.aspx) at least. Its methods are intuitive and powerful, and an understanding of how to combine them lets you write expressive, concise code. Even better, these methods can be applied to a variety of objects, not just arrays. For instance, since strings have a `length` property and their characters can be accessed by their index, you can call `Array.prototype` methods on them like so:

```javascript
var str = "aaaaaaa";
Array.prototype.every.call( str, function( letter ) {
  return letter === "a";
}); // returns true
```
Yes, this isn't the kind of use case that gives you developer goosebumps. But the fact that it works is pretty damn cool. We'll come right back to `Array.prototype` after a brief detour...

jQuery is awesome, and I don't advocate developers should just stop using it. That said, there are cases where using jQuery is suboptimal. For example, jQuery should not be used as a dependency for libraries, if it's reasonably avoidable. Especially in cases where where only modern browser support is necessary, sometimes jQuery is just not necessary. Modern browsers support APIs that make some typical jQuery operations like property/attribute manipulation and tree traversal fairly easy. But even if you have no plans to go jQuery-less, you can use the patterns described here to apply useful methods like `reduce()` to jQuery collections. 

While some jQuery-type stuff is pretty simple, the native DOM API is still missing easy, built-in ways to operate on and manipulate _collections_ of elements. Methods like `querySelectorAll()` and `getElementsByTagName()` return array-like objects that are basically devoid of useful methods. Specifically, both _should_ return instances of `HTMLCollection`, but that’s not how it [actually works](https://bugzilla.mozilla.org/show_bug.cgi?id=14869) — querySelectorAll returns an instance of `NodeList` in WebKit browsers. The specifics aren't really important; the main point is that despite their similarities, these objects don't have access to the awesomeness that is `Array.prototype`.

## Method Hijacking

The following is a piece of code that nearly every JavaScript programmer has had to use at one time or another:

```javascript
var args = Array.prototype.slice.call( arguments );
```
The arguments object isn't an array but to manipulate it with operations like `push()` or `pop()`, you need to turn it into one. Probably the simplest way to accomplish this is to `slice` it. Since `arguments` is similar to an array, it's possible to use `Array.prototype` methods on it. The `slice()` method creates a shallow copy of a portion of an array; calling it without arguments copies the whole array. Also, `slice()` always returns an array. So the line above creates a shallow copy of the arguments, _as an array_, which works because `arguments` is similar to an array in the ways `slice()` cares about. This works just fine, but it'd be nice to avoid writing `Array.prototype.slice.call` every single time you want to turn `arguments` into an array. What we really want a free-floating `slice()` function. Here's how to do that:

```javascript
var slice = Function.prototype.call.bind( Array.prototype.slice );
var args = slice( arguments );
```

Why and how does this work? Generally, [call()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) is used as a method of another function. Presumably, the `this` keyword is used somewhere in the inner workings of `call()` to refer to the function on which it's being invoked. In the first snippet, that's `Array.prototype.slice`. So to replicate this without explicitly writing it out each time, we need to have a situation where the `call()` method has its `this` value fixed to `Array.prototype.slice`. _This is exactly what `bind()` does_. Here's the first sentence of the [MDN article](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) on `Function.prototype.bind`:

> The `bind()` method creates a new function that, when called, has its `this` keyword set to the provided value.

So  `Function.prototype.call.bind( Array.prototype.slice )` evaluates to a version of `call()` where `this` is set to `Array.prototype.slice`, a feat which we accomplish through `bind()`. What happens to the arguments we pass into this resulting function? They are handled the same way `call()` usually handles arguments: the first becomes the `this` binding for its function (which has been bound to `slice()`), and the rest are passed through as arguments to that same function. So, you can do the following to trim off the first two arguments:

```javascript
var slice = Function.prototype.call.bind( Array.prototype.slice );
var args = slice( arguments, 2 );
```

This same pattern will work for any method, but is best suited for those that need a meaningful `this` value. However, it's particularly useful for `Array.prototype` methods, since, as shown towards the top, they usually just need an object with `length` and bracket access to member items. Strings fit these requirements, as do arguments objects, jQuery collections, and, yes, the objects returned by `querySelectorAll` and it's cousins. In the following example we're mapping over a group of elements to get their id attributes... without jQuery!

```javascript
var map = Function.prototype.call.bind( Array.prototype.map );
var articles = document.querySelectorAll( ".article" );
var articleIds = map( articles, function( element ) {
  return element.id;
});
```
To reiterate, `map` is a function which is identical to `Function.prototype.call` _except_ that its `this` value is permanently set to `Array.prototype.map`. When executed `call()` is supposed to invoke _a different function_. Which one? Whatever its own `this` is. So, it goes to invoke `Array.prototype.map`, but does so in the context of _whatever it's first argument is_. In the snippet above, that's `articles`. Then it passes the rest of it's arguments along to `map`. All of this is necessary because `Array.prototype.map` uses `this` internally to refer to the object on which it is operating. 

These functions can be combined, but it looks backwards and weird. Plus, I've tried, and it's basically impossible to indent in a way that makes sense. Here we're making some new functions and using them on a collection.

```javascript
// [].reduce looks weird, but I'll explain in a bit
var reduce = Function.prototype.call.bind( [].reduce );
var filter = Function.prototype.call.bind( [].filter );
var map = Function.prototype.call.bind( [].map );

var eighteen = reduce( 
  filter( 
    map( [1, 2, 3, 4, 5], 
      function( el ) { return el * 3 }),
    function( el ) { return el % 2 === 0 }),
  function( sum, el ) { return sum + el }, 0);
// yuck!
```

This is evaluated from the inside out, so `map` happens first, returning `[3, 6, 9, 12, 15]`, `filter` is applied next, leaving `[6, 12]`, then `reduce` sums those numbers, returning `18`. So it works fine, but it looks batshit crazy and is extremely hard to understand. (However, if you like this approach in general, check out [this awesome library](https://github.com/CrossEye/ramda)). It'd be great if we could chain these methods together rather than nest them. Speaking of which...

## Bling!
Instead of creating a bunch of new functions, wouldn't it be easier if we could just get collections of DOM elements as real arrays? Sure it would! So let's create a super lightweight DOM selection function that does just that:

```javascript
function $( selector ) {
  return [].slice.call( document.querySelectorAll( selector ) );
}
```

Quick side note about accessing and working with prototype methods: _the two lines below are functionally identical_.

```javascript
var slice1 = Function.prototype.call.bind( Array.prototype.slice );
var slice2 = function(){}.call.bind( [].slice );
// slice1 and slice2 work exactly the same.
```

Any function's `call` method points to `Function.prototype.call` (if it hasn't been overridden for some reason). Likewise, any array's `slice` method resolves to `Array.prototype.slice`. This works provided that we're expecting to work with the function objects themselves and not expecting them to have any particular `this` context.

Back to our bling function which will work with basically any valid CSS selector. It takes an optional second argument, which is an element on which to start the query. With a few more lines of code you could optimize it to use [faster](http://jsperf.com/getelementbyid-vs-queryselector) selection methods like `getElementById`, `getElementsByClassName`, etc. when appropriate. Further, clever application of array methods, plus a working knowledge of the vanilla DOM API, lets you mimic much of jQuery's functionality. Here's how we'd get all the children of all `div` elements:

```javascript
$( "div" ).reduce( function( collection, item ){
  [].push.apply( collection, item.children );
  return collection;
}, [] );
```
Since our `$` returns arrays, you can easily chain method calls together to manipulate collections of DOM nodes. But, yes, I realize this is much more verbose than jQuery's `.children()`.

It bears noting that the original `NodeList` and `HTMLCollection` objects aren't strictly inferior to `Array` – they do pack some additional functionality that you'll lose in the conversion. Specifically `NodeList` and `HTMLCollection` are sometimes “live” — as in [“they are automatically updated when the underlying document is changed.”](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection) When you map them to an array, you lose this feature. If you are coming from jQuery, this will be natural. If, somehow, you've become accumstomed to working with live node collections, it's something to keep in mind. However, from some very basic testing in Chrome it seems to me that `HTMLCollection` tends to be live while `NodeList` does not (despite what MDN [might say](https://developer.mozilla.org/en-US/docs/Web/API/NodeList)). With small but important discrepancies like this, you’re probably better off working with regular arrays anyway.

There is another, probably lesser known, piece of functionality you lose when mapping `HTMLCollection` to Array. With an `HTMLCollection`, you can access members by either their index, _or_ their id attribute (with the name attribute as a fallback). As such, you can do things like `collection.item` to get the member with id of “item”. Once you’re working with an array, you’d need to use `.filter()` (or something similar) to accomplish the same thing.

## (T)read Carefully
Yet another approach, I guess, is to start mucking around with the `NodeList` and `HTMLCollection` prototypes directly. If you felt so inclined, you could copy the array methods wholesale onto another prototype like so<span id="copy-method-references">:</a>

```javascript
var methods = ["forEach", "filter", "map", "reduce"];

methods.forEach( function( method ) {
  NodeList.prototype[method] = function() {
    return Array.prototype[method].apply( this, arguments );
  };
});
```

But... don’t do this. Even if you’re OK with extending host objects, this is still probably not the best approach. First, you’re sort of sneakily returning an `Array` where it’d be more natural to expect a `NodeList`. Second, you’d have to implement all the methods you want on both `NodeList` and `HTMLCollection` to make sure everything behaves as expected. Finally, going around messing with built-in prototypes, _especially_ in the unpredictable world of the DOM, is a bad habit to get into. One possible exception is to add a method that would convert the object into an array. This is somewhat acceptable since it a.) clearly says what kind of object it returns, and b.) is unlikely to overwrite something that acts any differently. Still, you could just `slice()` them and avoid the whole issue.

```javascript
NodeList.prototype.toArray = 
HTMLCollection.prototype.toArray =
function() {
  return [].slice.call( this );
};
```

## Looking Forward
Eventually we’ll be able to do away with these workarounds. The DOM4 specification includes an [Elements class](http://www.w3.org/TR/domcore/#collections:-elements) that inherits from `Array`. Hooray! Instances of `Node` and of `Elements` will have `.query()` and `.queryAll()` methods that will search their context subtree(s) for matching elements, and return an `Elements` object with array methods. Pretty sweet right? I recently came across [a polyfill](https://github.com/barberboy/dom-elements) for `Elements` and the element query methods. The future is now.Still, `Elements` won't be widely supported for a long time. 

Moreover, gaining fluency with the `Array.prototype` methods is an immensely valuable skill. At [Hack Reactor](http://www.hackreactor.com/), "toy problems" are one of the central parts of the curriculum. I've found that elegant solutions to many of these involve using `Array.prototype` methods in clever ways. Abstracting away the details of iteration and combining these methods into powerful compositions is a great way to write code that is succinct and easily comprehensible. Once you're comfortable with how they work and where they can be used, you'll see applications for `Array.prototype` methods everywhere.

Thanks for reading. Find me on [Twitter](https://twitter.com/nickhbottomley) for any questions or comments, or open an [issue](https://github.com/nickb1080/personal-site/issues) on this repo.

---

### Extra Credit

1.) Why does the following snippet not work correctly? It looks pretty similar to [some code above](#copy-method-references).

```javascript
var methods = ["forEach", "filter", "map", "reduce"];
for ( var i = 0; i < methods.length; i++ ) {
  NodeList.prototype[methods[i]] = function() {
    return Array.prototype[methods[i]].apply( this, arguments );
  };
}
```

2.) [Bind-ception!](http://tech.pro/blog/2097/clever-way-to-demethodize-native-js-methods). This bizzare-looking piece of code creates a function that "demethodizes" anything you give it. For instance, passing `Array.prototype.slice` to it would produce the same thing as the naked `slice()` function we created above. How the heck does it work, though?

```javascript
var demethodize = 
  Function.prototype.bind.bind( Function.prototype.call );
```