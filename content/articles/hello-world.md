```haskell
import qualified Control.Comonad as Comonad
import qualified Edward hiding (personal_details)
import Blog.Software

-- Hello, World!

instance Blog Comonad.Reader where
    url = "http://comonad.com/reader"
    author = Edward.Kmett

main = forever $ post stuff
```

Syntax highlighting works.

$ \frac{}{\Gamma, x:\tau \vdash x:\tau}\;\text{var}$

$ \frac{\Gamma,x:\sigma \vdash M:\tau}{\Gamma \vdash \lambda x : \sigma. M : \sigma \rightarrow \tau}\;\text{abs}$

$ \frac{\Gamma \vdash M : \sigma \rightarrow \tau \qquad  \Gamma \vdash N:\sigma}{\Gamma \vdash M N : \tau}\;\text{app}$

Apparently, $\LaTeX$ works.



<figure class="category-diagram"><img src="/figures/lifting-square.svg" alt="A, B, C, D; e, f, g, m"></figure>



Commutative diagrams, check.

All systems go.

World, meet blog; blog, meet world.
