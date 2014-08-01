---
layout: post
title: Safely Extending Built-Ins
---

For the most part, JavaScript runs in a single shared thread, and all code can access whatever variables are available in the global context. This is why extending built-in objects is generally considered bad practice. It's impossible to "scope" adding a method to something like `String.prototype`. All strings point back to that object as their prototype, and altering the prototype can have wide ranging and unpredictable consequences. Many projects rely on a substantial amount of library code, and you don't want to concern youself unduly with the inner workings of those libraries. Most libraries are nicely scoped within an [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression), so you only interact with their public interface. However, altering global objects on which they rely can break them entirely, if, for instance, there's a sloppily written `for ... in` loop somewhere. This particular problem is solvable, but regardless, messing with native prototypes is rarely a good idea, since it can be immensely difficult to track down errors it can induce.

The fluent chaining syntax you get with jQuery and other libraries is great, but it sucks that we can't safely extend the built-in prototypes to add all the awesome Underscore/Lo-Dash methods. What if we could somehow get a clean, independent copy of `Array` (or `Object`, `String`, whatever) whose prototype one could extend without messing with the originals? In fact, we can do just that.

## Threading and Execution Contexts
I want to point out crucial difference in two terms that are sometimes confused: a "thread" and a "global execution context". A thread is a single process, in which code being executed prevents subsequent code from being run. In other words, only one thing can be going on in a thread at once. Generally JavaScript is single-threaded, but its possible to generate new threads with APIs like <a href="http://nodejs.org/api/vm.html">Node VM</a> and <a href="#">Web Workers</a>. However, communication between threads _must_ happen asynchronously. This usually takes the form of stringified messages being passed back and forth through some kind of event system. Thus, there is no way to pass references to objects between threads.

But, it's possible for more than one global execution context (GEC) to live in a single thread. You can find a good discussion of execution contexts <a href="http://davidshariff.com/blog/what-is-the-execution-context-in-javascript/">here</a>. The crucial point in this case is that each GEC has it's own set of objects provided by the host environment. In the context of the browser, that means DOM-type things like `window`, but also objects like the `Array` constructor and it's prototype. There's one particular circumstance I want to examine in which two (or more) GEC's share a single thread: `iframe`.

<!-- Up at the top I mentioned the single thread in which JavaScript runs. This is an oversimplification; [Web Workers]() for instance, operate in their own thread, as does code in `<iframe>`s in certain situations (we'll come back to this).

### Web Workers
The relatively recent introduction of [Web Workers]() lets client-side code delegate expensive operations to a new JavaScript thread, allowing the UI thread to remain responsive. Each Worker has it's own thread, and, as you might expect, it's own global context. Thus, any changes made to global objects like `Object.prototype` are private to that Worker. However, the ways in which Workers may interact with the main thread are purposely limited to avoid concurrency issues. This actually _requires_ that Workers have their own global context, because if they shared things like `Object` or `Array` with the main thread, those objects would offer a synchronous, unevented means of communcation between threads. Workers can only communicate with the main thread through stringified `postMessage` event data, so there's no way to get a reference to any real object from a worker. Bummer. -->

### iFrames
The HTML `iframe` element embeds an child document within a parent document. For security reasons, when the parent and child documents come from different domains the rules which govern their interactions are quite strict. In fact, they're very similar to the event-based, stringified messages Web Workers use.

However, `iframe`s that share the parent document's domain aren't restricted in the same way. In fact, you can access the `iframe`'s execution context directly through the DOM element's `contentWindow` property. Here's a snippet which dynamically creates an iframe, then reaches into the execution context there to

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

The parent `body` and child `body` are different objects; that makes perfect sense. But, crucially, they are also _instances_ of different _constructors_ (or, whatever, DOM interfaces if you want to be pedantic). Each DOM element has a constructor. For `<body>`, that constructor is `HTMLBodyElement`. The point is, the parent window has an `HTMLBodyElement` object, and the child iframe has a totally different `HTMLBodyElement` object. They act the same, but they don't `===` each other. As cool as a unique `HTMLBodyElement` might be, it just isn't very useful. Let's try and find something that'll actually benefit us somehow. Perhaps my [favorite object](http://nickbottomley.com/2014/06/25/leveraging-array-prototype/)?

```javascript
// builds on the previous snippet.
var BizzaroArray = iframe.contentWindow.Array;
BizzaroArray === Array; // false...
BizzaroArray.prototype === Array.prototype; // false! Oh shit!
```
Now we're getting somewhere! You can freely extend `BizarroArray.prototype` without affecting `Array.Prototype`. The behavior of existing arrays won't be affected, but any instances of `BizzaroArray` you create will have access to the modified prototype. Keep in mind that declaring anything with `[]` will return an instance of `Array`. But you can easily create a factory function that produces `BizzaroArray` instances.

```javascript
// builds on the previous snippet.
function bizzaroFactory ( arr ) {
  return ( new BizarroArray() ).concat( arr );
}
```
You could set up this factory in a few different ways, though I haven't tested them for performance. Calling `BizarroArray.prototype.slice` on a regular array should transform it. Alternately, `push`ing items onto a new instance would work too. There's a great little project called [Poser](https://github.com/bevacqua/poser) by Nicolas Bevacqua which provides a clean interface for getting references to objects from iframes. For another use case, check out his [Dominus](https://github.com/bevacqua/dominus) library, which implements a minimal DOM node collection class that extends `Array` and features a chunk of jQuery's functionality.

## What Now?
I'm writing a <a href="https://github.com/nickb1080/super-collection">little library</a> that uses the strategy outlined here, along with Poser, to build a class which safely extends `Array` and includes re-implementations of the Underscore methods that work on arrays. I'm particularly interested in benchmarking the methods against Underscore to ensure it has comparable performance. Also, I'm planning to add a couple more methods and to build out a comprehensive test suite. So far it doesn't seem like there is any significant performance hit associated with using objects from another execution context. Contributions are more than welcome!

## Why?
Underscore and LoDash are pretty great as-is. They're battle-tested, widely used, and well documented. Still, as mentioned at the top, using them isn't entirely fluid. You can us them functionally, which can get a bit awkward if you have a number of operations to perform. Conversely, you can use the chaining syntax, but that's also a bit cumbersome; each chain of operations needs to start with `_(...).chain()...` and end with `value()`. Clearly, less than ideal.

So how do we build a fluent, chainable API with Underscore-type methods on top of `Array`?

## Why Not Inherit From `Array`?
A naive solution would be to subclass `Array`, which is pretty easy to do. The problem is that you'll often want to delegate to the superclass methods; for instance, Underscore's <a href="http://underscorejs.org/#where">`where`</a> is a subset of `filter`. If you were implementing this on a class that inheritied from Array, delegating to `filter` would be a complete no-brainer. Unfortunately, it also won't work.

```javascript
function Collection ( arr ) {
  this.push.apply( this, arr );
}

Collection.prototype = Object.create( Array.prototype );

var nums = new Collection([ 1, 2, 3, 4, 5, 6 ]);

nums instanceof Collection; // true

var evens = nums.filter( function ( num ) {
  return num % 2 === 0;
});

evens instanceof Collection; // false
```


Methods that change arrays in-place will generally work fine, but `map`, `filter` and many others actually return new objects. Presumably you'd want them to be instances of this new `Collection` class for chaining purposes but they're just plain arrays. Sure, you could re-implement `filter` et al on the prototype, but then you've lost the main benefits of subclassing.

## Takeaways
- Each execution context has it's own copies of the environment's built-in objects.
- You can access an `iframe`'s objects through it's containing DOM element.
- You can alter objects from an `iframe` without affecting their equivalents in the main `window`.
- This lets you do awesome things like build on native classes without unintended side effects.
