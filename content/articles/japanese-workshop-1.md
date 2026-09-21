A couple of weeks back one of my coworkers brought to my attention [a several hour long workshop in Japan](http://partake.in/events/1698f7f8-4151-4048-b317-03a8c3f1a7ab) to go over and describe a number of my libraries, hosted by [TANAKA Hideyuki](https://github.com/tanakh) — not the [voice actor](http://en.wikipedia.org/wiki/Hideyuki_Tanaka), I checked!

I was incredibly honored and I figured that if that many people (they had 30 or so registered attendees and 10 presentations) were going to spend that much time going over software that I had written, I should at least offer to show up!

I'd like to apologize for any errors in the romanization of people's names or misunderstandings I may have in the following text. My grasp of Japanese is very poor! Please feel free to send me corrections or additions!

## Surprise!

Sadly, my [boss](https://twitter.com/mcscottmc)'s immediate reaction to hearing that there was a workshop in Japan about my work was to quip that "You're saying you're [huge in Japan](http://en.wikipedia.org/wiki/Big_in_Japan_\(phrase\))?" With him conspicuously not offering to fly me out here, I had to settle for surprising the organizers and attending via Google Hangout.

## Commentary and Logs

[@nushio](http://twitter.com/nushio) was very helpful in getting me connected, and while the speakers gave their talks I sat on the irc.freenode.net #haskell-lens channel and Google Hangout and answered questions and provided a running commentary with more details and references. Per [freenode policy](http://freenode.net/channel_guidelines.shtml) the fact that we were logging the channel was announced -- well, at least before things got too far underway.

[Here is the IRC session log as a gist](https://gist.github.com/ekmett/5283253). IKEGAMI Daisuke [@ikegami\_\_](https://twitter.com/ikegami__) (`ikeg` in the IRC log) tried to keep up a high-level running commentary about what was happening in the video to the log, which may be helpful if you are trying to follow along through each retroactively.

Other background chatter and material is strewn across twitter under the [#ekmett\_conf](https://twitter.com/search?q=%23ekmett_conf&src=typd) hash tag and on a japanese twitter aggregator named [togetter](http://togetter.com/li/480399)

## Getting Started

The 1PM start time in Shibuya, Tokyo, Japan translates to midnight at the start of Easter here in Boston, which meant ~6 hours later when we reached the Q&A session, I was a bit loopy from lack of sleep, but they were incredibly polite and didn't seem to mind my long rambling responses.

Thanks to the organizers, we have video of the vast majority of the event! There was no audio for the first couple of minutes, and the recording machine lost power for the last talk and the Q&A session at the end as we ran somewhat longer than they had originally scheduled! -- And since I was attending remotely and a number of others flitted in and out over the course of the night, they were nice enough to put most of the slides and background material online.

## profunctors by Liyang HU and HIBINO Kei

[Liyang Hu](http://liyang.hu/) ([@liyanghu](http://twitter.com/liyanghu)) started the session off with a nicely self-contained crash course on my [profunctors](http://github.com/ekmett/profunctors) package, since profunctors are used fairly heavily inside the implementation of [lens](http://github.com/ekmett/lens) and [machines](http://github.com/ekmett/machines), with a couple of detours into [contravariant](http://github.com/ekmett/contravariant) and [bifunctors](http://github.com/ekmett/bifunctors).

[His presentation materials](https://www.fpcomplete.com/user/liyang/profunctors) are available interactively from the new [FP Complete](https://www.fpcomplete.com/) School of Haskell. You can also watch the [video recording of his talk](http://www.ustream.tv/recorded/30668431/highlight/337429) on [ustream](http://www.ustream.tv/).

This talk was followed by a much more condensed version of very similar content [in Japanese by Hibino Kei](http://www.ustream.tv/recorded/30668431/highlight/337431) ([@khibino](https://github.com/khibino)) His talk was more focused on the relationship between arrows and profunctors, and the [slides are available through slideshare](http://www.slideshare.net/khibino/profunctor-and-arrow-17939130).

## lens by @its\_out\_of\_tune

Once the necessary background material was out of the way, the talk on [lens](http://hackage.haskell.org/package/lens) -- arguably the presentation that most of the people were there for -- came early.

[![ekmett\_conf-its\_out\_of\_tune-1](http://comonad.com/reader/wp-content/uploads/2013/03/ekmett_conf-its_out_of_tune-1.jpg "ekmett_conf-its_out_of_tune-1")](http://comonad.com/reader/wp-content/uploads/2013/03/ekmett_conf-its_out_of_tune-1.jpg)

[@its\_out\_of\_tune](https://twitter.com/its_out_of_tune) gave an incredibly dense overview of how to use the main parts of the lens package in Japanese. [His slides are available online](http://www.slideshare.net/itsoutoftunethismymusic/ekmett-17955009) and [here is a recording of his talk](http://www.ustream.tv/recorded/30668431/highlight/337435).

Over the course of a half hour, he was able to cram in a great cross-section of the library including material that I hadn't even been able to get to even with 4x the amount of time available during [my New York talk](https://www.youtube.com/watch?v=cefnmjtAolY&hd=1) on how to use the lens template-haskell code to automatically generate lenses for user data types and how to use the lens [Action](http://hackage.haskell.org/packages/archive/lens/3.9.0.2/doc/html/Control-Lens-Action.html%22) machinery.

## free and free-game by KINOSHITA Fumiaki

Next up, was my [free](http://hackage.haskell.org/package/free) package and the neat [free-game](http://hackage.haskell.org/package/free-game) engine that Kinoshita Fumiaki ([@fumieval](https://twitter.com/fumieval)) built on top.

The slides were in English, though the talk and humor were very Japanese. ^\_^

[![ekmett\_conf-free](http://comonad.com/reader/wp-content/uploads/2013/03/ekmett_conf-free.jpg "ekmett_conf-free")](http://comonad.com/reader/wp-content/uploads/2013/03/ekmett_conf-free.jpg)

That said, he had some amazingly nice demos, including a live demo of his tetris clone, [Monaris](https://github.com/fumieval/Monaris), which is visible about 10 minutes into [the video](http://www.ustream.tv/recorded/30668431/highlight/337437)!

## ad by @nebutalab

[@nebutalab](http://twitter.com/nebutalab), like me, joined the session remotely through Google Hangout, and proceeded to give a tutorial on how [forward mode](http://en.wikipedia.org/wiki/Automatic_differentiation#Forward_accumulation) automatic differentiation works through my [AD](http://github.com/ekmett/ad) package.

[His slides were made available before the talk](http://www.slideshare.net/nebuta/haskell-ad34) and the video is available in [two](http://www.ustream.tv/recorded/30671273/highlight/337441) [parts](http://www.ustream.tv/recorded/30671623/highlight/337439) due a technical hiccup in the middle of the recording.

[![ekmett\_conf-ad](http://comonad.com/reader/wp-content/uploads/2013/04/ekmett_conf-ad-300x204.jpg "ekmett_conf-ad")](http://comonad.com/reader/wp-content/uploads/2013/04/ekmett_conf-ad.jpg)

I'm currently working to drastically simplify the API for ad with [Alex Lang](https://github.com/alang9). Fortunately almost all of the material in this presentation will still be relevant to the new design.

## tables by MURAYAMA Shohei

Next up, Murayama Shohei ([@yuga](https://twitter.com/yuga)) gave an introduction to [tables](http://hackage.haskell.org/package/tables), which is a small in memory data-store that I wrote a few months back to sit on top of lens.

[Video of @yuga's talk](http://www.ustream.tv/recorded/30672629/highlight/337395) and [his slides](https://gist.github.com/yuga/5279313) are available, which I think makes this the first public talk about this project. -\_^

## machines by YOSHIDA Sanshiro

Yoshida Sanshiro ([@halcat0x15a](http://twitter.com/halcat0x15a)) gave a nice overview of the currently released version of [machines](http://hackage.haskell.org/package/machines) including a lot of examples! I think he may have actually written more code using machines just for demonstrations than I have written using it myself.

[Video of his talk is available](http://www.ustream.tv/recorded/30672629/highlight/337397) along with [his slide deck](http://halcat0x15a.github.com/slide/machines/out/#0) -- just tap left or right to move through the slides. He has also written [a blog post](http://krdlab.hatenablog.com/entry/2013/03/16/204039) documenting his early explorations of the library, and some thoughts about using it with attoparsec.

I've recently been trying to redesign machines with coworker Paul CHIUSANO [@pchiusano](https://twitter.com/pchiusano) and we've begun greatly simplifying the design of machines based on some work [he has been doing in Scala](http://www.youtube.com/watch?v=8fC2V9HX_m8), so unfortunately many of the particulars of this talk will be soon outdated, but the overall 'feel' of working with machines should be preserved across the change-over. Some of these changes can be seen in the [master branch on github](http://github.com/ekmett/machines) now.

## More to come

There were 4 more sessions, but alas, I'm out of time for the moment! I'll continue this write-up with more links to the source material and my thoughts as soon as I can tomorrow!
