---
layout: post
title: Execution Contexts
---

For the most part, JavaScript runs in a single shared thread, and all code can access whatever variables are available in the global context. This is why extending built-in prototypes is considered bad practice. It's impossible to "scope" adding a method to something like `String.prototype`. All strings point back to that object as their prototype, and altering the prototype can have wide ranging and unpredictable consequences. If, say, every line of code in your project was written by you or your team, you might be able to get away with augmenting prototypes. But when you use libraries you're entering into an implicit agreement not to screw around with shared objects, including prototypes.

That said, the existence and popularity of libraries like Underscore indicates that there are lots of useful features that the standard library lacks. In particular, Underscore has methods like `pluck` and `where` which are hugely useful for operating on collections of models (arrays of objects). But composing Underscore-style methods is tricky given their argument signature, and the chaining syntax is a little clunky (ever forgotten to call `value()`?).

What I want is a true copy of `Array` (or `Object`, `String`, whatever) whose prototype I can extend without messing up the originals. This is actually possible, with a clever little module called [poser](). 

## Threading and Global Context
The relatively recent introduction of [Web Workers]() lets client-side code delegate expensive operations to a new JavaScript thread, allowing the UI thread to remain responsive. Each Worker has it's own thread, and, as you might expect, it's own global context. The ways in which Workers may interact with the main thread are purposely limited to avoid concurrency issues. This requires that Workers have their own global context, because if they shared things like `Object` or `Array` with the main thread, those objects would offer a direct, unevented means of communcation between the threads. Workers can only communicate with the main thread through stringified `postMessage` data, so there's no way to get a reference to any real object from a worker. Bummer.



## Why Go To All This Trouble
Underscore and LoDash are pretty great as-is. They do all kinds of awesome stuff, are well-tested 