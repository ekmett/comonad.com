Luite Stegeman has a mirror of the packages from [Hackage](http://hackage.haskell.org/).

He uses it to power his incredibly useful [hdiff](http://hdiff.luite.com/) website.

During a Hackage outage, you can set up your local cabal configuration to point to it instead by (temporarily) replacing the remote-repo in your `~/.cabal/config` file with:

`    remote-repo:   hdiff.luite.com:http://hdiff.luite.com/packages/archive    `

and then running `cabal update`.

I have a [`~/.cabal/config`](https://github.com/ekmett/lens/blob/master/config) that I use whenever hackage goes down in my [lens](https://github.com/ekmett/lens) package.

If you use [travis-ci](http://travis-ci.org/), you can avoid build failures during hackage outages by first copying that config to ~/.cabal/config [during before\_install](https://github.com/ekmett/lens/blob/master/.travis.yml#L4). -- You'll still be stuck waiting while it first tries to refresh from the real hackage server, but it only adds a few minutes to buildbot times.
