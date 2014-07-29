---
layout: post
title: Choosing An Iteration Method
---

The methods available on `Array.prototype` are awesome and there are tons of ways to use them. In order to become an iteration wizard, it's essential to have a clear understanding of what each method does, so you can quickly reach for the right one.

Step one: do you need to definitely iterate over every item, or can you exit early under some circumstance? If you want to iterate _until_ you hit a particular condition, `every` and `some` are your friends. Otherwise, check out `map`, `filter`, and `reduce`.

Step two: what does the output of your desired operation look like? Is it an array of the same length, with different items? Or a subset of the original array? Or something more exotic? Defining your output in terms of your input is crucial.

## Breaking Out Early

In cases where you may want to break out of a loop before going over each item, people seem to immediately reach for `for` or `while` loops. These are perfectly fine solutions, however there are native array methods that can accomplish these operations. Underscore's <a href="http://underscorejs.org/#find">`find`</a> method is a good example of an exit-early operation; it returns the first object in a collection which matches a truth test. From the docs:

```javascript
  var two = _.find([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });
```

Recreating this operation efficiently means you can't use `.forEach` or `.filter` because you can't break out of those methods. However, ES5 provides two methods on `Array.prototype` which allow you to end iteration early: `every()` and `some()`. Here are implementations of `find` using a for loop and again using `some`

```javascript
var nums = [1, 2, 3, 4, 5, 6];

var forFind = function( arr, cb ) {
  var i;
  for ( i = 0; i < arr.length; i++ ) {
    if ( cb( arr[i] ) ) {
      return arr[i];
    }
  }
  return null;
};

var someFind = function( arr, cb ) {
  var result = null;
  arr.some( function ( item ) {
    if ( cb( item ) ) {
      return result = item;
    }
  })
  return result;
};
```

`some` and `every` are great for situations where you want to iterate _until_ something happens, then break out.

## Full Iteration

Most often you'll want to iterate over an entire array. There are 4 primary ES5 array methods for doing so. Here's a super abbreviated list of each does and what it returns:

- `forEach`
Performs an operation on each item in an array; returns nothing.

- `map`
Performs a transformation on each item in an array; returns an array of the same length as the input array.

- `filter`
Checks if each item in an array matches a condition; returns a subset of the original array.

- `reduce`
Perform an arbitrary operation on an array and a stateful accumulator; returns the accumulator.

Reduce is strictly more powerful than filter or map. Here are demonstrations of `map` and `filter` as `reduce` operations.

```javascript
var mapAsReduce = function ( arr, cb ) {
  return arr.reduce( function( acc, item, i, arr ) {
    acc.push( cb( item, i, arr ) );
    return acc;
  }, []);
};

var filterAsReduce = function ( arr, cb ) {
  return arr.reduce( function( acc, item, i, arr ) {
    if ( cb( item, i, arr ) ) {
      acc.push( item ):
    }
    return acc;
  }, []);
};
```

While reduce is more versatile, it is also less expressive. It can perform _any_ kind of iterative operation, and return anything. Map and filter always return arrays, with predefined relationships to the input. Map's return always has the same length, and filter always returns a subset of the original items. In contrast, `reduce` could be used for everything from summing a list of numbers to transforming an array into an object. <a href="{{ site.baseurl }}/2014/06/25/leveraging-array-prototype/">In a previous post</a> I showed how `reduce` can be used to gather all the child nodes of an array of DOM nodes.

Part of the appeal of using native methods is precisely that they are _expressive_. They abstract away the particulars involved in iteration, and especially with `map` and `filter`, the operation they perform is immediately comprehensible. With these methods, the purpose of iteration is evident by the method used. Search with `filter`, transform with `map`.

Knowing how these methods work and what they return allows you to quickly choose which methods to use to attack which problems.

There's another, oft overlooked, advantage to using built-in iterators: free scoping. Sometimes you need to hold the iteration state in closure scope, and you can do this extremely easily with iteration methods. Here's a rather contrived example (assume `paras` is an array of all the `<p>` elements on a page):

```javascript
// won't work as expected
for ( var i = 0; i < paras.length; i++ ) {
  paras[i].addEventListener( "click", function () {
    console.log( i + "th paragraph clicked." );
  });
}

// will work
paras.forEach( function ( para, i ) {
  para.addEventListener( "click", function () {
    console.log( i + "th paragraph clicked." );
  });
});

```


## Downsides
There are times where using array iterators might not be ideal. Specifically, these two issues come to mind:

- **Hiding Complexity**: It's really obvious when you have nested for loops, because they stick out like a sore thumb. While sometimes you need nested iteration, other times there are clever ways to avoid it. But in order to avoid it, you need to recognize that it's happening, which is difficult when using iteration methods rather than for loops. In reality, it's not that hard. But it's harder than noticing nested `for` loops.

- **Less efficient**: For loops are faster than Array methods. This is partially due to the rigorous spec that these methods must follow, which account for some bizarre corner cases, and simply because they introduce an additional function call. If this is an issue for you, check out [fast.js](https://github.com/codemix/fast.js).

## Takeaways
- Array methods `.every()` and `.some()` are breakable iterators.
- Abstract away all the loops with expressive iteration methods.
- A method's expressiveness and flexibility are inversely proportional.
- Make sure you're not magnifying complexity by unneccesarily nesting iterators.

---

Thanks for reading. Find me on [Twitter]({{site.networks.twitter}}) for any questions or comments, or open an [issue]({{site.github_repo}}/issues) on this repo.