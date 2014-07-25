---
layout: post
title: Execution Contexts
---

For the most part, JavaScript runs in a single shared thread, and all code can access whatever variables are available in the global context. This is why extending built-in prototypes is considered bad practice. It's impossible to "scope" adding a method to something like `String.prototype`. All strings point back to that object as their prototype, and altering the prototype can have wide ranging and unpredictable consequences. Usually your project will be relying on lots of library code, and you don't want to concern youself unduly with the inner workings of those libraries. Most libraries are nicely scoped within [IIFE](), so you only interact with their public interface. However, altering global objects on which they rely can break them entirely, if, for instance, there's a sloppily written `for ... in` loop somewhere. This particular problem has a solution, but regardless, messing with native prototypes is rarely a good idea.

That said, the existence and popularity of libraries like Underscore indicates that there are lots of useful features that the standard library lacks. In particular, Underscore has methods like `pluck` and `where` which are hugely useful for operating on collections of models (arrays of objects). But composing Underscore-style methods is tricky given their argument signature, and the chaining syntax is a little clunky (ever forgotten to call `value()`?).

It'd be great to somehow have a clean, independent copy of `Array` (or `Object`, `String`, whatever) whose prototype I can extend without messing with the originals.

## Threading and Global Context
The relatively recent introduction of [Web Workers]() lets client-side code delegate expensive operations to a new JavaScript thread, allowing the UI thread to remain responsive. Each Worker has it's own thread, and, as you might expect, it's own global context. Thus, any changes made to global objects like `Object.prototype` are private to that Worker. However, the ways in which Workers may interact with the main thread are purposely limited to avoid concurrency issues. This actually _requires_ that Workers have their own global context, because if they shared things like `Object` or `Array` with the main thread, those objects would offer a synchronous, unevented means of communcation between threads. Workers can only communicate with the main thread through stringified `postMessage` event data, so there's no way to get a reference to any real object from a worker. Bummer.

## iFrame
_Note: The behavior of iframes can vary between browsers. I'm talking specifically about Chrome here, but it should hold for all modern browsers._
Ah, the tricky old `<iframe>`. The `iframe` element embeds an child HTML document within a parent HTML document. For security reasons, when the parent and child documents come from different domains the rules which govern their interactions are quite strict. Generally, when this is the case, the iframe and parent can only communicate through `postMessage`, similar to Workers. However, iframes that share the parent's domain aren't restricted in the same way. In fact, each `iframe` DOM element holds a reference to the `window` object in which its code runs. Here's a snippet which dynamically creates an iframe, then obtains a reference to the iframe's DOM `body` element, and finally demonstrates that the body element there _is not the same as_ the body element we have in our parent document. 

```javascript
// go ahead and try this in the console
var iframe = document.createElement( "iframe" );
document.body.appendChild( "iframe" );
var iframeBody = iframe.contentWindow.document.body;
document.body === iframeBody; // false
```

Clearly we can reach into the child iframe and get references to the objects we find there. In fact, communication between this iframe and the parent window is pretty free. The two contexts do, in fact, run on the same thread and can thus interact directly and synchronously. Taking a look at the last line of this snippet, it totally makes sense that the iframe's body isn't the same as the parent's body. They are totally separate, of course! However, let's try something a little tricky.

```javascript 
// builds on the previous snippet.
document.body.constructor === iframeBody.constructor 
// false! Woah.
```

The parent `body` and child `body` are different objects; that makes perfect sense. But, crucially, they are also _instances_ of different _constructors_ (or, whatever, DOM interfaces if you want to be pedantic). The point is, the parent window has an `HTMLBodyElement` object, and the child iframe has a totally different `HTMLBodyElement` object. They act the same, but they don't `===` each other. Thing is, `HTMLBodyElement` just isn't very useful. Let's try and find something that'll actually benefit us somehow. Perhaps my [favorite object](http://nickbottomley.com/2014/06/25/leveraging-array-prototype/)?

```javascript
// builds on the previous snippet.
var BizzaroArray = iframe.contentWindow.Array;
BizzaroArray === Array; // false...
BizzaroArray.prototype === Array.prototype; // false!
```
Now we're getting somewhere! You can freely extend `BizarroArray.prototype` without affecting `Array.Prototype`. The behavior of existing arrays won't be affected, but any instances of `BizzaroArray` you create will have access to the modified prototype. Keep in mind that declaring anything with brackets will return an instance of `Array`. But you can easily create a factory function that produces `BizzaroArray` instances.

```javascript
// builds on the previous snippet.
function bizzaroFactory( arr ) {
  return ( new BizarroArray() ).concat( arr );
}
```
You could set up this factory in a few different ways, and I haven't tested them for performance. Calling `BizarroArray.prototype.slice` on a regular array should transform it. Alternately, `push`ing items onto a new instance would work too.There's a great little project called [Poser](https://github.com/bevacqua/poser) by Nicolas Bevacqua which provides a clean interface for getting references to objects from iframes.

## Yeah, So?
Underscore and LoDash are pretty great as-is. They're well-tested, widely used and 

## Compare to Extending `Array`
A while back I tried to accomplish basically the same thing in a different way.

```javascript
var methods = [ "pluck", "where" ]; // etc.
methods.forEach( function( methodName ) {
  Collection.prototype[methodName] = function() {
    var args = [].slice.call( arguments );
    args.push( this );
    return _[methodName].apply( _, args );
  };
});
```
