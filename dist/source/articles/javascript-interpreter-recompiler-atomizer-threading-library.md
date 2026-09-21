It recently came to my attention that most of the actual code for my old javascript libraries was not accessible from the Wiki. Apparently, I deleted the wrong directory in a spate of cleaning several months back and the links just quietly went dead.

The URL [http://comonad.com/jslib.tar.gz](http://comonad.com/jslib.tar.gz) contains an archive that is a little out of date, but should contain most of the framework. (In particular the Recompiler seems to be missing pieces) I haven't had a chance to check it for sanity, completeness or consistency.

It relies on the use of the C preprocessor on the back-end. I may have forgotten some scripts it needs to actually build. I just used a linux box with spidermonkey and rhino to test. If there is any interest I'll try to drum up the rest of the pieces and make things functional, but I haven't heard much chatter about these since I moved things over from slipwave.com.

You hereby have the right to use this under the Apache Public License 2.0 with my name substituted in for the Apache Foundation, since thats what I said I would release it under. If you need a more permissive license feel free to ask.
