I did some digging and found the universal operations mentioned in the last couple of posts: unzip, unbizip and counzip were referenced as abide${}_F$, abide${}_\dagger$ and coabide${}_F$ -- actually, I was looking for something else, and this fell into my lap.

They were apparently named for a notion defined by Richard Bird back in:

> R.S. Bird. Lecture notes on constructive functional programming. In M. Broy, editor, Constructive Methods in Computing Science. International Summer School directed by F.L. Bauer \[et al.\], Springer Verlag, 1989. NATO Advanced Science Institute Series (Series F: Computer and System Sciences Vol. 55).

The notion can be summed up by defining that two binary operations $\mathbin{\text{⦶}}$ and $\ominus$ **abide** if for all a, b, c, d:

$(a \ominus b) \mathbin{\text{⦶}} (c \ominus d) = (a \mathbin{\text{⦶}} c) \ominus (b \mathbin{\text{⦶}} d)$.

There is a cute pictorial explanation of this idea in [Maarten Fokkinga's remarkably readable Ph.D dissertation](http://dbappl.cs.utwente.nl/Publications/PaperStore/db-utwente-404F4540.pdf) on p. 20.

The idea appears again on p.88 as part of the famous 'banana split' theorem, and then later on p90 the above names above are given along with the laws:

```haskell
fmap f &&& fmap g = unfzip . fmap (f &&& g)
bimap f g &&& bimap h j = unbizip . bimap (f &&& h) (g &&& j)
fmap f ||| fmap g = fmap (f ||| g) . counfzip
```

That said the cases when the inverse operations exist do not appear to be mentioned in these sources.
