---
layout: post
title: Categorizing Iteration Problems
---

TL;DR:
- Array methods `.every()` and `.some()` are breakable iterators.
- Abstract away all the loops
- A method's expressiveness and flexibility are inversely proportional.

First step: do you need to definitely iterate over every item, or can you exit early under some circumstance? If you want to iterate _until_ you hit a particular condition, `every` and `some` are your friends. Otherwise, check out `map`, `filter`, and `reduce`.

Underscore's `find` method is a good example of an exit-early method; it returns the first object in a collection which matches a truth test. From the docs:

```javascript
  var two = _.find([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });
```

Recreating this operation efficiently means you can't use `.forEach` or `.filter` because you can't break out of those methods. However, ES5 provides two methods on `Array.prototype` which allow you to end iteration early: `every()` and `some()`.

 Here are implementations of `find` using a for loop and again using `some`

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

## Matching Problems to Iterators

### forEach
Performs an operation on each item in an array; returns nothing.

### map
Performs a transformation on each item in an array; returns an array of the same length as the input array.

### filter
Checks if each item in an array matches a condition; returns a subset of the original array.

### reduce
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

While reduce is more versatile, it is also less expressive. It can perform _any_ kind of iterative operation, and return anything. Map and filter always return arrays, with predefined relationships to the input. Map's return always has the same length, and filter always has a subset of the original items. In contrast, reduce could be used for everything from summing a list of numbers to transforming arrays into objects. 

Part of the appeal of using native methods is precisely that they are _expressive_. They abstract away the particulars involved in iteration, and especially with `map` and `filter`, the operation they perform is immediately comprehensible. With these methods, the purpose of iteration is evident by the method used. Search with `filter`, transform with `map`.

Knowing how these methods work and what they return allows you to quickly choose which methods to use to attack which problems.

## Downsides

- **Hiding Complexity**: It's really obvious when you have nested for loops, because the first line sticks out like a sore thumb. While sometimes you need nested iteration, other times there are clever ways to avoid it. But in order to avoid it, you need to recognize that it's happening, which is difficult when using iteration methods rather than for loops. In reality, it's not that hard. But it's harder than noticing nested for loops.

- **Less efficient**: For loops are faster than Array methods. This is partially due to the rigorous spec that these methods must follow, which account for some bizarre corner cases, and simply because they introduce an additional function call. If this is an issue for you, check out [fast.js](https://github.com/codemix/fast.js), a library with 
