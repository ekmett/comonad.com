Two concepts come up when talking about information retrieval in most standard documentation, [Precision and Recall](http://en.wikipedia.org/wiki/Precision_and_recall). Precision is a measure that tells you if your result set contains only results that are relevant to the query, and recall tells you if your result set contains everything that is relevant to the query.

The formula for classical precision is:

![Precision Formula](http://comonad.com/reader/wp-content/uploads/2009/09/precision_formula.png "Precision Formula")

However, I would argue that the classical notion of Precision is flawed, in that it doesn't model anything we tend to care about. Rarely are we interested in binary classification, instead we want a ranked classification of relevance.

When Google tells you that you have a million results, do you care? No, you skim the first few entries for what it is that you are looking for, unless you are particularly desperate for an answer. So really, you want a metric that models the actual behavior of a search engine user and that level of desperation.

There are two issues with classical precision:

1.  the denominator of precision goes to infinity as the result set increases in size
2.  each result is worth the same amount no matter where it appears in the list

The former ensures that a million answers drowns out any value from the first screen, the latter ensures that it doesn't matter which results are on the first screen. A more accurate notion of precision suitable for modern search interfaces should model the prioritization of the results, and should allow for a long tail of crap if the stuff that people will look at is accurate over all.

So how to model user behavior? We can replace the denominator with a partial sum of a geometric series for probability *p* < 1, where *p* models the percentage chance that a user will continue to browse to the next item in the list. Then you can scale the value of the nth summand in the numerator as being worth up to *p*<sup><em>n</em></sup>. If you have a ranked training set it is pretty easy to score precision in this fashion.

You retain all of the desirable properties of precision. It maxes out at 100%, it decreases when you give irrelevant results, but now it effectively models when you return irrelevant results early in your result list.

The result more accurately models user behavior when faced with a search engine than the classical binary precision metric. The parameter *p* models the desperation of the user and can vary to fit your problem domain. I personally like p=50%, because it makes for nice numbers, but it should proabably be chosen based on sampling based on knowledge of the search domain.

You can of course embellish this model with a stair-step in the cost function on each page boundary, etc. — any monotone decreasing infinite series that sums to a finite number in the limit should do.

A similar modification can of course be applied to recall.

I used this approach a couple of years ago to help tune a search engine to good effect. I went to refer someone to this post today and I realized I hadn't posted it in the almost two years since it was written, so here it is, warts and all.

If anyone is familiar with similar approaches in the literature, I'd be grateful for references!
