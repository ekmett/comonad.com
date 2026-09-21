One area where I'm at odds with the prevailing winds in Haskell is lazy I/O. It's often said that lazy I/O is evil, scary and confusing, and it breaks things like referential transparency. Having a soft spot for it, and not liking most of the alternatives, I end up on the opposite side when the topic comes up, if I choose to pick the fight. I usually don't feel like I come away from such arguments having done much good at giving lazy I/O its justice. So, I thought perhaps it would be good to spell out my whole position, so that I can give the best defense I can give, and people can continue to ignore it, without costing me as much time in the future. :)

So, what's the argument that lazy I/O, or `unsafeInterleaveIO` on which it's based, breaks referential transparency? It usually looks something like this:

```haskell
swap (x, y) = (y, x)

setup = do
  r1 < - newIORef True
  r2 <- newIORef True
  v1 <- unsafeInterleaveIO $ do writeIORef r2 False ; readIORef r1
  v2 <- unsafeInterleaveIO $ do writeIORef r1 False ; readIORef r2
  return (v1, v2)

main = do
  p1 <- setup
  p2 <- setup
  print p1
  print . swap $ p2
```

I ran this, and got:

```haskell
(True, False)
(True, False)
```

So this is supposed to demonstrate that the pure values depend on evaluation order, and we have broken a desirable property of Haskell.

First a digression. Personally I distinguish the terms, "referential transparency," and, "purity," and use them to identify two desirable properties of Haskell. The first I use for the property that allows you to factor your program by introducing (or eliminating) named subexpressions. So, instead of:

```haskell
f e e
```

we are free to write:

```haskell
let x = e in f x x
```

or some variation. I have no argument for this meaning, other than it's what I thought it meant when I first heard the term used with respect to Haskell, it's a useful property, and it's the best name I can think of for the property. I also (of course) think it's better than some of the other explanations you'll find for what people mean when they say Haskell has referential transparency, since it doesn't mention functions or "values". It's just about equivalence of expressions.

Anyhow, for me, the above example is in no danger of violating referential transparency. There is no factoring operation that will change the meaning of the program. I can even factor out `setup` (or inline it, since it's already named):

```haskell
main = let m = setup
  in do p1 < - m
        p2 <- m
        print p1
        print . swap $ p2
```

This is the way in which `IO` preserves referential transparency, unlike side effects, in my view (note: the embedded language represented by `IO` does not have this property, since otherwise `p1` could be used in lieu of `p2`; this is why you shouldn't spend much time writing `IO` stuff, because it's a bad language embedded in a good one).

The other property, "purity," I pull from Amr Sabry's paper, [What is a Purely Functional Language?](http://www.cs.indiana.edu/~sabry/papers/purelyFunctional.ps) There he argues that a functional language should be considered "pure" if it is an extension of the lambda calculus in which there are no contexts which observe differences in evaluation order. Effectively, evaluation order must only determine whether or not you get an answer, not change the answer you get.

This is slightly different from my definition of referential transparency earlier, but it's also a useful property to have. Referential transparency tells us that we can freely refactor, and purity tells us that we can change the order things are evaluated, both without changing the meaning of our programs.

Now, it would seem that the original interleaving example violates purity. Depending on the order that the values are evaluated, opponents of lazy I/O say, the values change. However, this argument doesn't impress me, because I think the proper way to think about `unsafeInterleaveIO` is as concurrency, and in that case, it isn't very strange that the results of running it would be non-deterministic. And in that case, there's not much you can do to prove that the evaluation order is affecting results, and that you aren't simply very unlucky and always observing results that happen to correspond to evaluation order.

In fact, there's something I didn't tell you. I didn't use the `unsafeInterleaveIO` from base. I wrote my own. It looks like this:

```haskell
unsafeInterleaveIO :: IO a -> IO a
unsafeInterleaveIO action = do
  iv < - new
  forkIO $
    randomRIO (1,5) >>= threadDelay . (*1000) >>
    action >>= write iv
  return . read $ iv
```

`iv` is an `IVar` (I used [ivar-simple](https://hackage.haskell.org/package/ivar-simple)). The pertinent operations on them are:

```haskell
new :: IO (IVar a)
write :: IVar a -> a -> IO ()
read :: IVar a -> a
```

`new` creates an empty `IVar`, and we can `write` to one only once; trying to write a second time will throw an exception. But this is no problem for me, because I obviously only attempt to write once. `read` will block until its argument is actually is set, and since that can only happen once, it is considered safe for `read` to not require `IO`. \[1\]

Using this and `forkIO`, one can easily write something like `unsafeInterleaveIO`, which accepts an `IO a` argument and yields an `IO a` whose result is guaranteed to be the result of running the argument at some time in the future. The only difference is that the real `unsafeInterleaveIO` schedules things just in time, whereas mine schedules them in a relatively random order (I'll admit I had to try a few times before I got the 'expected' lazy IO answer).

But, we could even take this to be the specification of interleaving. It runs `IO` actions concurrently, and you will be fine as long as you aren't attempting to depend on the exact scheduling order (or whether things get scheduled at all in some cases).

In fact, thinking of lazy I/O as concurrency turns most spooky examples into threading problems that I would expect most people to consider rather basic. For instance:

-   Don't pass a handle to another thread and close it in the original.
-   Don't fork more file-reading threads than you have file descriptors.
-   Don't fork threads to handle files if you're concerned about the files being closed deterministically.
-   Don't read from the same handle in multiple threads (unless you don't care about each thread seeing a random subsequence of the stream).

And of course, the original example in this article is just non-determinism introduced by concurrency, but not of a sort that requires fundamentally different explanation than fork. The main pitfall, in my biased opinion, is that the scheduling for interleaving is explained in a way that encourages people to try to guess exactly what it will do. But the presumption of purity (and the reordering GHC actually does based on it) actually means that you cannot assume that much more about the scheduling than you can about my scheduler, at least in general.

This isn't to suggest that lazy I/O is appropriate for every situation. Sometimes the above advice means that it is not appropriate to use concurrency. However, in my opinion, people are over eager to ban lazy I/O even for simple uses where it is the nicest solution, and justify it based on the 'evil' and 'confusing' ascriptions. But, personally, I don't think this is justified, unless one does the same for pretty much all concurrency.

I suppose the only (leading) question left to ask is which should be declared unsafe, fork or ivars, since together they allow you to construct a(n even less deterministic) `unsafeInterleaveIO`?

\[1\] Note that there are other implementations of `IVar`. I'd expect the most popular to be in [monad-par](https://hackage.haskell.org/package/monad-par) by Simon Marlow. That allows one to construct an operation like `read`, but it is actually *less* deterministic in my construction, because it seems that it will not block unless perhaps you write and read within a single 'transaction,' so to speak.

In fact, this actually breaks referential transparency in conjunction with `forkIO`:

```haskell
deref = runPar . get

randomDelay = randomRIO (1,10) >>= threadDelay . (1000*)

myHandle m = m `catch` \(_ :: SomeExpression) -> putStrLn "Bombed"

mySpawn :: IO a -> IO (IVar a)
mySpawn action = do
  iv < - runParIO new
  forkIO $ randomDelay >> action >>= runParIO . put_ iv
  return iv

main = do
  iv < - mySpawn (return True)
  myHandle . print $ deref iv
  randomDelay
  myHandle . print $ deref iv
```

Sometimes this will print "Bombed" twice, and sometimes it will print "Bombed" followed by "True". The latter will never happen if we factor out the `deref iv` however. The blocking behavior is essential to `deref` maintaining referential transparency, and it seems like monad-par only blocks within a single `runPar`, not across multiples. Using ivar-simple in this example always results in "True" being printed twice.

It is also actually possible for `unsafeInterleaveIO` to break referential transparency if it is implemented incorrectly (or if the optimizer mucks with the internals in some bad way). But I haven't seen an example that couldn't be considered a bug in the implementation rather than some fundamental misbehavior. And my reference implementation here (with a suboptimal scheduler) suggests that there is no break that isn't just a bug.
