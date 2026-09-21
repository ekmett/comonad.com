Was reading Castagna, Ghelli, and Longo's 1995 paper on "[A Calculus for Overloaded Functions with Subtyping](http://citeseer.ist.psu.edu/125897.html)" today and in it they have to jump through some hoops to index their '&' types to keep them well behaved under β-reduction.

It seems to me, at least from my back-of-the-envelope scribblings, that if you [CPS transform](http://comonad.com/reader/wiki?item=CPS+transformation) the calculus before, that the main technical innovation (overloaded functions using the tighter run-time type information) remains intact, but the need for this technical trick goes away. In this case you know what the reduction will evaluate out to regardless of call-by-value or call-by-need (just bottom), and if the specification changes during evaluation it is still sound, so no need for an index.

$ \frac{\Gamma \vdash M:W_1 \leq \lbrace\neg U_i\rbrace_{i\leq(n-1)} \qquad  \Gamma \vdash N : W_2 \leq \neg U_n}{\Gamma \vdash (M \mathbin{\&} N) : \lbrace \neg U_i \rbrace_{i \leq n }}\;\lbrace\rbrace\text{-I}$

$ \frac{\Gamma \vdash M : \lbrace \neg U_i \rbrace_{i \in I} \qquad  \Gamma \vdash N : U \qquad  U_j = \min_{i \in I} \lbrace U_i \vert U \leq U_i \rbrace }{\Gamma \vdash M \bullet N : \perp }\;\lbrace\rbrace\text{-E}$

The above then would requires explicit continuations and might interfere with rederiving tupling from the overloading mechanism alone, but seems to eliminate some of the barriers they mention to the higher order case. However, I'm not convinced it is a net win regardless, because it would require a notion of typecase.
