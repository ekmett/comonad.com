Does anyone know of any work on "forgetful laziness?"

The basic idea being that for each thunk instead of overwriting it with the answer as usual in call-by-need, you'd just write a forwarding pointer, and allow GC to collect the answers over time.

This results in recalculation and may be subject to thrashing, so the obvious fix would be either

1.  a 'forget at most once' policy, which would only mitigate the kind of memory leaks you get from laziness under limited conditions, but which has a worst case payout of doubling the workload or
2.  an exponential backoff on how often you'll try to recollect a given value, which should preserve for practical purposes the asymptotic behavior of any algorithm, but with a much larger constant for pathological access patterns. \[Edit: it may affect asymptotic behavior, because you could lose sharing\]

This would allow the recollection of large CAFs, etc. eventually once they had bitrotted long enough.

Not sure if its worth the cost of recalculating and of storing any backoff counter, but most of the horror stories you hear about Haskell center around its occasional horrific memory usage profile.

Tuning points might include studying average thunk lifetimes to construct thunk access profiles rather than use a naive exponential backoff.

It also may exascerbate the opposite problem where naive code often builds up a tower of thunks it needs to evaluate all at once in order to provide an answer (i.e. when working with a lazy accumulating parameter).
