In light of the burgeoning length of the ongoing record discussion [sparked off by Simon Peyton-Jones in October](http://www.haskell.org/pipermail/glasgow-haskell-users/2011-October/021101.html), I would like to propose that we recognize an extension to Wadler's law (supplied in bold), which I'll refer to as the "Weak Record Conjecture" below.

> In any language design, the total time spent discussing a feature in this list is proportional to two raised to the power of its position.
> 
> -   0\. Semantics
> -   1\. Syntax
> -   2\. Lexical syntax
> -   3\. Lexical syntax of comments
> -   **4\. Semantics of records**

I base the Weak Record Conjecture on the stable of proposed record semantics, which now includes (among others) [Simple Overloaded Record Fields (SORF)](http://hackage.haskell.org/trac/ghc/wiki/Records/OverloadedRecordFields), [Agda-derived Records (ADR)](http://www.youtube.com/watch?v=pEig1D4sJdI%3C/a%3E,%20%20%3C/a%3E%3Ca%20href=), [Frege-derived Records (FDR)](http://hackage.haskell.org/trac/ghc/wiki/Records/NameSpacing), [Type-Punning Declared Overloaded Record Fields (TPDORF)](http://hackage.haskell.org/trac/ghc/wiki/Records/TypePunningDeclaredOverloadedRecordFields), [Syntax Directed Name Resolution](http://hackage.haskell.org/trac/ghc/wiki/Records/SyntaxDirectedNameResolution), [Type Indexed Records](http://hackage.haskell.org/trac/ghc/wiki/Records/TypeIndexedRecords) and the less seriously proposed [Homotopy Extensional Record Proposal (HERP)](http://www.haskell.org/pipermail/glasgow-haskell-users/2012-April/022219.html) and [Dependent Extensional Record Proposal (DERP)](http://www.haskell.org/pipermail/glasgow-haskell-users/2012-April/022219.html).

There is an additional option implied but not stated in all of this, which is the option to "Leave Well Enough Alone" (LWEA?), since you can always [Man Up and Learn Lenses (MUALL)](http://stackoverflow.com/questions/5767129/lenses-fclabels-data-accessor-which-library-for-structure-access-and-mutatio/5769285#5769285). Given that every record proposal I've seen thus far breaks polymorphic field updates to some degree, and lenses are going to be compatible with whatever mess folks settle on, even preserving the status quo, this is the path I've chosen to take.

Now, based on the fact that discussions of [syntax have already started](http://www.haskell.org/pipermail/glasgow-haskell-users/2012-January/021531.html), and the intuition supplied by the ordering already present in Wadler's insightful law, I would also like to conjecture that perhaps an even stronger version of Wadler's law might be able to be stated, the "Strong Record Conjecture".

> In any language design, the total time spent discussing a feature in this list is proportional to two raised to the power of its position.
> 
> -   0\. Semantics
> -   1\. Syntax
> -   2\. Lexical syntax
> -   3\. Lexical syntax of comments
> -   **4\. Semantics of records**
> -   5\. Syntax of records
>     
> -   6\. Lexical syntax of records
>     

Under the Strong Record Conjecture, even in the unlikely event that universal accord could be reached on record semantics today — 164 days into this discussion — we'd still be due for at least another 3 years (328 + 656 days) of backlogged complaining over the syntax before anything gets done.

The evidence thus far is pretty strong that at least the Weak Record Conjecture holds — if anything the exponent is too small and may require further calibration, but we don't have much data yet on the Strong Record Conjecture. Consequently, and in the name of science, I plan to check in again on the record debate in 3 years. Hopefully by then we will have resolved the remaining semantic issues, and will have a better feel for the necessary time commitment required to resolve items 5 and 6.
