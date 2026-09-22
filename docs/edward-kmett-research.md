# Edward Kmett: additional archive research

Research checked 2026-09-21. This report inventories additional talks, articles, papers and interviews beyond the Comonad.Reader and Edward’s School of Haskell collections already being migrated. Primary records were preferred: author repositories, organizer programs, publisher pages, and uploader descriptions. This is broad coverage, not a claim of exhaustiveness.

The main JSON currently contains **50 records**. The separate Boston Haskell inventory contains **33 public videos**, matching the channel’s reported count: 30 uploads and 3 archived livestreams. It preserves all speakers, 27 exact presentation dates, two month-only dates, and four recordings with no established event date. The six records without exact event dates use explicitly labeled upload fallbacks.

## Deliverables and ingestion

- `edward-kmett-inventory.json`: normalized additional works; detailed date assertions and source evidence remain on every record.
- `boston-haskell-videos.json`: channel identity and `.videos` array with `id`, `title`, `speakers`, `videoUrl`, `uploadDate`, `eventDate`, `date`, `dateBasis`, materials and uncertainty.
- `monadic-warsaw-series.json`: four connected, independently dated parts; sequence is editorially meaningful even where upload timestamps are out of order.
- `external-talks.json`: import-ready `.videos` array, including Warsaw; additional arrays retain talks without resolved recordings and explicitly unverified video candidates. Deduplicate Warsaw by video ID if both files are ingested.
- `external-articles.json`: import-ready `.articles` array with publication dates or explicit uncertainty, original URLs, preservation pointers and optional scope decisions. Interview article/video records share IDs for consolidation.

The main JSON’s `date` is an exact calendar date or null. `dateValue` and `datePrecision` preserve approximate years, months and intervals. A null day is intentional; import it into an approximate-date group rather than inventing a day. For Boston records, `date` is always sortable but `dateBasis` must be shown when it is only an upload fallback. Do not pass calendar strings through a local-timezone date conversion.

## Chronology and deduplication decisions

Use one archive card for one work or delivered occurrence, with video, slides, source, transcript and later revisions as attachments. A pure blog announcement of that same talk should be consolidated in display while preserving the article’s original URL and publication date. A substantial follow-up article remains its own dated item with a relationship to the talk. Repeated presentations at different events remain separate occurrences, joined by a work-family identifier.

For talks, prefer the presentation date; for writing and interviews, prefer the first verified publication date. Preserve the recording date and every later upload or revision separately. Conference intervals and year/month dates should display their actual precision. If a total order is required, keep an explicit approximate bucket or labeled upload fallback; a sorting convenience is not historical evidence.

Specific cases:

- **Cache-Oblivious Maps:** talk 2013-10-18, video upload 2013-10-25, slide footer 2013-10-26. The footer dates a later deck version. The related Deamortized ST article also has a signature/header difference.
- **Google “Discrimination Is Wrong”:** the verified recording is ZuriHac 2015-05-30, uploaded 2015-07-28. Do not attach this recording to the separate YOW 2015 occurrence.
- **Learning to Learn:** one 2014 talk family also titled Stop Treading Water. The older official YouTube URL reports unavailable; the surviving Adam Piper mirror was uploaded 2017-12-05. No exact 2014 performance day is established. The scheduled YOW title differs in imported programs; this is recorded explicitly.
- **Boston Propagators:** recorded 2015-11-18, uploaded 2015-11-19. Some secondary lists wrongly label it 2016. It is distinct from the Warsaw series and other conferences.
- **Haskell Cast:** recorded 2013-08-04, released 2013-08-26; edited audio and uncut video are one interview.
- **Functional Futures:** original audio/video released 2022-08-18, edited Serokell highlights 2022-08-23. Preserve Emils Petracenoks’s article credit and Jonn’s interviewer credit.
- **ApplicativeDo:** credit Simon Marlow, Simon Peyton Jones, Edward Kmett and Andrey Mokhov. The program’s 2016-09-22 slot does not identify which coauthor presented. The author webpage’s September1 date may be month-normalized metadata.

## Source-checked additional records

### Harmless Algorithms — Issue 01: Fine Occlusion Culling Algorithms

- ID: `kmett-1999-harmless-algorithms-01` · technical_article, column · Flipcode
- Attribution: Edward Kmett (author).
- Archive date: **1999-04-09** (publication; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 1999-04-09 — publication; Flipcode byline and primary archive index agree.
- Date evidence: 1999-04-08 — author_signature; Date printed at the article’s closing signature; may precede publication.
- Source: [Original publisher archived article](https://flipcode.com/archives/Harmless_Algorithms-Issue_01_Fine_Occlusion_Culling_Algorithms.shtml) — Title, author byline, publication date and separate signed date; original HTML publicly readable.
- Source: [Flipcode featured articles and columns archive](https://flipcode.com/archives/articles.shtml) — Groups all four articles under Harmless Algorithms by Edward Kmett and lists publication dates.
- Material: [html_article](https://flipcode.com/archives/Harmless_Algorithms-Issue_01_Fine_Occlusion_Culling_Algorithms.shtml) — Full public HTML article; code/diagrams inline where present.
- Note: Surveys S-buffers, binary span trees, C-buffers, active edge lists/heaps, triage masks and beam trees. Some pages retain a boilerplate copyright1999 even when dated2000/2001; use byline/publication date. No coauthors named.

### Harmless Algorithms — Issue 02: Scene Traversal Algorithms

- ID: `kmett-1999-harmless-algorithms-02` · technical_article, column · Flipcode
- Attribution: Edward Kmett (author).
- Archive date: **1999-04-30** (publication; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 1999-04-30 — publication; Flipcode byline and primary archive index agree.
- Date evidence: 1999-04-29 — author_signature; Date printed at the article’s closing signature; may precede publication.
- Source: [Original publisher archived article](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml) — Title, author byline, publication date and separate signed date; original HTML publicly readable.
- Source: [Flipcode featured articles and columns archive](https://flipcode.com/archives/articles.shtml) — Groups all four articles under Harmless Algorithms by Edward Kmett and lists publication dates.
- Material: [html_article](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml) — Full public HTML article; code/diagrams inline where present.
- Note: Discusses traversal of BSP, portal and spatial-subdivision structures. Some pages retain a boilerplate copyright1999 even when dated2000/2001; use byline/publication date. No coauthors named.

### Harmless Algorithms — Issue 03: Design Patterns And 3D Gaming

- ID: `kmett-2000-harmless-algorithms-03` · technical_article, column · Flipcode
- Attribution: Edward Kmett (author).
- Archive date: **2000-01-26** (publication; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2000-01-26 — publication; Flipcode byline and primary archive index agree.
- Date evidence: 2000-01-26 — author_signature; Date printed at the article’s closing signature; may precede publication.
- Source: [Original publisher archived article](https://flipcode.com/archives/Harmless_Algorithms-Issue_03_Design_Patterns_And_3D_Gaming.shtml) — Title, author byline, publication date and separate signed date; original HTML publicly readable.
- Source: [Flipcode featured articles and columns archive](https://flipcode.com/archives/articles.shtml) — Groups all four articles under Harmless Algorithms by Edward Kmett and lists publication dates.
- Material: [html_article](https://flipcode.com/archives/Harmless_Algorithms-Issue_03_Design_Patterns_And_3D_Gaming.shtml) — Full public HTML article; code/diagrams inline where present.
- Note: Design-pattern techniques for 3D engine code, including a typed wrapper around abstract implementation. Some pages retain a boilerplate copyright1999 even when dated2000/2001; use byline/publication date. No coauthors named.

### Harmless Algorithms — Issue 04: A Hybrid Approach to Visibility

- ID: `kmett-2001-harmless-algorithms-04` · technical_article, column · Flipcode
- Attribution: Edward Kmett (author).
- Archive date: **2001-02-19** (publication; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2001-02-19 — publication; Flipcode byline and primary archive index agree.
- Date evidence: 2001-02-03 — author_signature; Date printed at the article’s closing signature; may precede publication.
- Source: [Original publisher archived article](https://flipcode.com/archives/Harmless_Algorithms-Issue_04_A_Hybrid_Approach_to_Visibility.shtml) — Title, author byline, publication date and separate signed date; original HTML publicly readable.
- Source: [Flipcode featured articles and columns archive](https://flipcode.com/archives/articles.shtml) — Groups all four articles under Harmless Algorithms by Edward Kmett and lists publication dates.
- Material: [html_article](https://flipcode.com/archives/Harmless_Algorithms-Issue_04_A_Hybrid_Approach_to_Visibility.shtml) — Full public HTML article; code/diagrams inline where present.
- Note: Combines visibility and spatial-subdivision approaches from the earlier columns in a hybrid engine. Some pages retain a boilerplate copyright1999 even when dated2000/2001; use byline/publication date. No coauthors named.

### Real-time viseme extraction

- ID: `kmett-2005-real-time-viseme-extraction` · thesis, paper · Eastern Michigan University, Senior Honors Theses and Projects 96
- Attribution: Edward A. Kmett (author).
- Archive date: **2005** (approval; year precision). Inclusion: recommended. Confidence: high for work/year; medium for disambiguating author identity.
- Date evidence: 2005 — approval; EMU repository explicitly labels Date Approved: 2005.
- Date evidence: 2009-10-01 — repository_download_tracking_start; Landing page says Downloads Since October 01, 2009; not evidence for original publication date.
- Source: [EMU institutional repository](https://commons.emich.edu/honors/96/) — Title, named author, mathematics department, approval year and public Download link.
- Source: [EMU content posted in 2009](https://commons.emich.edu/2009.html) — Repository lists this thesis among content posted in 2009.
- Material: [pdf](https://commons.emich.edu/honors/96/) — Public Download link on landing page; direct target could not be retrieved by browsing tool.
- Note: No month/day established. Education and graphics background are consistent with Edward Kmett; repository has no profile identifier. Do not manufacture January 1 or use 2009 deposit chronology as thesis date.

### Near-Duplicate Image Detection — answer by Edward Kmett

- ID: `kmett-2009-near-duplicate-image-detection` · technical_answer · Stack Overflow
- Attribution: Edward Kmett (answer author).
- Archive date: **2009-07-02T20:23:00** (publication; minute precision). Inclusion: optional. Confidence: high.
- Date evidence: 2009-07-02T20:23:00 — publication; Original answer timestamp displayed by Stack Overflow; timezone not explicitly established in page text.
- Date evidence: 2009-07-02T23:26:00 — revision; Edited timestamp shown for same answer.
- Source: [Original question and answer](https://stackoverflow.com/questions/1034900/near-duplicate-image-detection) — Named author and original/edit timestamps; substantial explanation of wavelets, sparse vectors, minHash and tf-idf.
- Note: Optional curated technical writing, not a separately commissioned article. Link specifically to Kmett’s answer when obtaining an answer permalink; original question has multiple authors. Preserve revision/attribution history if republishing.

### Lenses: A Functional Imperative

- ID: `kmett-2011-lenses-functional-imperative` · talk, video_series · Boston Area Scala Enthusiasts (BASE), Google Cambridge
- Attribution: Edward Kmett (presenter).
- Archive date: **2011-05-24** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2011-05-24 — presentation; Author-uploaded part1 description explicitly gives BASE, May24,2011,Google Cambridge.
- Date evidence: 2011-05-26 — video_upload; Part1 upload timestamp2011-05-26T20:26:36-07:00; other parts separately linked without inferred upload dates.
- Source: [Author recording description](https://www.youtube.com/watch?v=efv0SQNde5Q) — direct_metadata_verified
- Material: [Lenses: A Functional Imperative [1/5\]](https://www.youtube.com/watch?v=efv0SQNde5Q) — Author-channel public search result; part1 watch-page metadata checked.
- Material: [Lenses: A Functional Imperative [2/5\]](https://www.youtube.com/watch?v=XVmhK8WbRLY) — Author-channel public search result; part1 watch-page metadata checked.
- Material: [Lenses: A Functional Imperative [3/5\]](https://www.youtube.com/watch?v=QjatJWIJBTM) — Author-channel public search result; part1 watch-page metadata checked.
- Material: [Lenses: A Functional Imperative [4/5\]](https://www.youtube.com/watch?v=CXH1V4xS2W0) — Author-channel public search result; part1 watch-page metadata checked.
- Material: [Lenses: A Functional Imperative [5/5\]](https://www.youtube.com/watch?v=YiFcvqRM6AA) — Author-channel public search result; part1 watch-page metadata checked.
- Note: Five files are one presentation, not five separately delivered talks. Match against any existing blog announcement before creating another archive card. Do not confuse BASE with the Boston Haskell channel.

### Purely Functional Data Structures for On-Line LCA

- ID: `kmett-2012-online-lca` · talk · Boston Haskell
- Attribution: Edward Kmett (presenter).
- Archive date: **2012-05-30** (presentation; day precision). Inclusion: recommended. Confidence: high for title/authorship; medium for exact date.
- Date evidence: 2012-05-30 — presentation; Date transcribed from reproduced title slide; primary title-slide visual not rechecked.
- Source: [Author SlideShare](https://www.slideshare.net/slideshow/skewbinary-online-lowest-common-ancestor-search/13144385) — Exact title, Edward uploader, 43 slides.
- Source: [Author lca repository](https://github.com/ekmett/lca) — Links deck.
- Source: [Reproduced deck](https://www.slideserve.com/tauret/purely-functional-data-structures-for-on-line-lca) — Cover transcript names Boston Haskell May30 2012.
- Material: [slides](https://www.slideshare.net/slideshow/skewbinary-online-lowest-common-ancestor-search/13144385) — Public deck.
- Note: Exact date has medium confidence; related SoH article is separately signed September14 2013 with later migrated header.

### Lenses, Folds, and Traversals

- ID: `kmett-2012-lenses-google` · talk · Google San Francisco / Bay Area Haskell Users
- Attribution: Edward Kmett (presenter).
- Archive date: **2012-10-18** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2012-10-18 — presentation; Organizer report explicitly names Thursday October 18 2012.
- Date evidence: 2012-10-24 — organizer_report_publication; Google Open Source blog dateline.
- Source: [Google organizer report](https://opensource.googleblog.com/2012/10/lenses-folds-and-traversals-haskell.html) — Title, presenter and event date.
- Note: Separate presentation from NYC December 12; NYC recording should not be assigned to this occurrence.

### Lenses, Folds and Traversals

- ID: `kmett-2012-lenses-nyc` · talk · New York Haskell
- Attribution: Edward Kmett (presenter).
- Archive date: **2012-12-12** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2012-12-12 — presentation; Lens site preserves announcement for Wednesday December 12, posted November20 2012.
- Date evidence: 2013-01-26 — recording_listing_publication; Lens project Recent Activity lists recording on this date; YouTube upload not independently verified.
- Source: [Lens project site](https://lens.github.io/) — Announcement, slides, recording and dates.
- Source: [Lens repository](https://github.com/ekmett/lens) — README links slides and recording.
- Material: [video](https://www.youtube.com/watch?v=cefnmjtAolY) — Primary-linked recording.
- Material: [slides_pdf](https://comonad.com/haskell/Lenses-Folds-and-Traversals-NYC.pdf) — Primary-linked PDF; fetch failed.
- Note: Same talk family as Google October18, distinct event. Related Mirrored Lenses article is not automatically a duplicate.

### The Ermine programming language

- ID: `kmett-2013-ermine-boston` · talk · Boston Haskell
- Attribution: Edward Kmett (presenter).
- Archive date: **2013-07** (presentation; month precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2013-07 — presentation; Runar Bjarnason recording description says Recorded Boston Haskell July2013.
- Date evidence: 2013-07-29 — video_upload; YouTube player metadata.
- Source: [Official Ermine project](https://ermine-language.github.io/) — Links Boston recording.
- Source: [Edward-authored HCAR report](https://www.haskell.org/communities/11-2013/html/report.html) — Confirms Boston and CUFP presentations by November2013.
- Source: [Runar Bjarnason recording](https://www.youtube.com/watch?v=QCvXlOCBe5A) — Recording event month and upload date; parent verified player metadata.
- Material: [video](https://www.youtube.com/watch?v=QCvXlOCBe5A) — Project-linked Boston recording; lowercase l after X.
- Note: Recording by Runar Bjarnason explicitly recorded Boston Haskell July2013. Exact day not established; parent verified player metadata in work/ermine-boston.json. Distinct from CUFP.

### Episode 1 — Edward Kmett on Lenses

- ID: `kmett-2013-haskellcast-lenses` · podcast, interview, video · The Haskell Cast
- Attribution: Edward Kmett (guest); Rein Henrichs (host); Chris Forno (host).
- Archive date: **2013-08-26** (publication; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2013-08-04 — recording; Original episode page explicitly gives Recorded: 2013-08-04.
- Date evidence: 2013-08-26 — publication; Original episode page explicitly gives Published: 2013-08-26.
- Date evidence: 2013-09-23 — video_upload; Official haskellcast channel watch-page metadata: 2013-09-23T05:41:23-07:00; description explicitly identifies uncut video of episode001.
- Source: [Original episode page](https://www.haskellcast.com/episode/001-edward-kmett-on-lenses) — Recording/publication dates, hosts, public MP3 link and embedded uncut interview video.
- Source: [Official Haskell Cast uncut video](https://www.youtube.com/watch?v=6GNDzrgFhGM) — direct_metadata_verified
- Material: [mp3](https://www.haskellcast.com/episode/001-edward-kmett-on-lenses) — Public Download MP3 link provided; direct S3 link failed retrieval.
- Material: [video](https://www.haskellcast.com/episode/001-edward-kmett-on-lenses) — Uncut video embedded on same episode page.
- Material: [video](https://www.youtube.com/watch?v=6GNDzrgFhGM) — Direct metadata: official haskellcast uploader; description links exact original episode page.
- Note: One interview with edited audio and uncut video. Prefer publication date in archive, disclose recording date. Do not create independent duplicate entries for audio and video. The uncut video upload is 2013-09-23, after the podcast release; preserve it as a manifestation of the same episode.

### Functional Reporting

- ID: `kmett-2013-functional-reporting` · talk · CUFP2013
- Attribution: Edward Kmett (presenter).
- Archive date: **2013-09-22** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2013-09-22 — presentation; Contemporary CUFP liveblog dated Sep22; organizer PC member confirms talks day Sep22.
- Source: [Ermine project](https://ermine-language.github.io/) — Links CUFP video.
- Source: [CUFP liveblog](https://www.syslog.cl.cam.ac.uk/2013/09/22/liveblogging-cufp-2013/) — IQ: Functional Reporting section.
- Source: [PC member event announcement](https://steve.vinoski.net/blog/2013/09/12/cufp-2013-erlang-web-tutorial/) — Talks day Sep22.
- Material: [video](https://www.youtube.com/watch?v=o3m2NkusI9k) — Project-linked recording.
- Material: [slides_pdf](https://ekmett.github.io/presentations/Functional%20Reporting.pdf) — Public file verified via GitHub directory API; full large PDF not inspected.
- Note: Also styled IQ: Functional Reporting. Presenter Edward, S&P Capital IQ. CUFP scribes report is not a Kmett-authored paper. Project contributors are not co-presenters.

### Cache-Oblivious Maps

- ID: `kmett-2013-cache-oblivious-maps` · talk · Bay Area Haskell User Group at Mozilla San Francisco
- Attribution: Edward Kmett (presenter).
- Archive date: **2013-10-18** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2013-10-18 — presentation; Edward’s own recording description explicitly names October18 2013.
- Date evidence: 2013-10-25 — video_upload; YouTube indexed publication metadata.
- Date evidence: 2013-10-26 — slide_version; PDF footer Saturday October26 13; later than talk.
- Source: [Author recording](https://www.youtube.com/watch?v=P3pLDpbzqCw) — Presentation date and upload metadata.
- Source: [Author slides](https://ekmett.github.io/presentations/Cache-Oblivious%20Data%20Structures.pdf) — 52-page PDF inspected, title CACHE-OBLIVIOUS MAPS and later date.
- Material: [video](https://www.youtube.com/watch?v=P3pLDpbzqCw) — Public recording.
- Material: [slides_pdf](https://ekmett.github.io/presentations/Cache-Oblivious%20Data%20Structures.pdf) — Public inspected PDF.
- Material: [slides_source](https://raw.githubusercontent.com/ekmett/ekmett.github.com/master/presentations/Cache-Oblivious%20Data%20Structures.key) — Public Keynote file.
- Note: Do not use slide-version Oct26 as presentation date. Related SoH Deamortized ST article explicitly continues this talk.

### Edward Kmett’s contributions to Haskell Communities and Activities Report, 2013-11

- ID: `kmett-2013-11-hcar-contributions` · collection, technical_report · Haskell Communities and Activities Report
- Attribution: Edward Kmett (author of sections explicitly labeled Report by; not sole author of issue).
- Archive date: **2013-11** (publication; month precision). Inclusion: optional. Confidence: high for issue/month and section attribution.
- Date evidence: 2013-11 — publication; Issue heading identifies Twenty-Fifth Edition, 2013-11.
- Source: [Original HCAR issue](https://www.haskell.org/communities/11-2013/html/report.html) — Contains numerous sections explicitly labeled Report by: Edward Kmett, including lens, machines, folds, exceptions, profunctors and other libraries.
- Material: [pdf](https://www.haskell.org/communities/11-2013/report.pdf) — Public whole-issue PDF; includes many other authors.
- Note: Optional collection entry, not every short package notice as an article. Compare successive issues before importing repeated text. Keep section-level participant credit (machines: Anthony Cowley, Shachaf Ben-Kiki, Paul Chiusano, Nathan van Doorn; profunctors: Shachaf Ben-Kiki, Elliott Hird). Participants are project collaborators, not automatically report coauthors. Many sections link to already-covered Comonad.Reader or School of Haskell pieces.

### What’s a wavelet tree? Why do we care?

- ID: `kmett-2013-wavelet-ljubljana` · talk · University of Ljubljana FMF seminar
- Attribution: Edward Kmett (presenter).
- Archive date: **2013-11-15** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2013-11-15 — presentation; Organizer gives November15, 12:00–14:00; room3.06 Jadranska21.
- Date evidence: 2013-11-12 — announcement_publication; Organizer page publication.
- Source: [University organizer announcement](https://www.fmf.uni-lj.si/en/news/news/28291/edward-kmett-whats-a-wavelet-tree-why-do-we-care/) — Exact date, title, presenter, abstract.
- Note: No recording or slides located.

### Stop Treading Water: Learning to Learn

- ID: `kmett-2014-stop-treading-water` · talk · YOW!2014
- Attribution: Edward Kmett (presenter).
- Archive date: **2014** (presentation; year precision). Inclusion: recommended. Confidence: high for delivered talk/year; exact day and recording city unresolved.
- Date evidence: 2014 — presentation; Edward’s own 2017 interview confirms learning-to-learn talk at YOW!2014. Attendee identifies Sydney.
- Source: [Author interview](https://theinitialcommit.com/2017/01/10/edward-kmett/) — Explicitly identifies Learning How To Learn at YOW!2014.
- Source: [Sydney attendee account](https://www.grahamlea.com/2015/05/ed-kmett-stop-treading-water-learning-to-learn-yow-2014/) — Title, event/city and links to organizer slides/recording; account published May7 2015.
- Source: [Surviving mirror metadata](https://www.youtube.com/watch?v=j0XmixCsWjs) — direct_metadata_verified
- Material: [video](https://www.youtube.com/watch?v=Z8KcCU-p8QA) — Linked by later author interview; parent retrieving metadata.
- Material: [video_historical](https://yow.eventer.com/yow-2014-1222/stop-treading-water-learning-to-learn-by-edward-kmett-1750) — Original organizer recording URL, currently unresolved.
- Material: [slides_pdf](https://slides.yowconference.com/yow2014/Kmett-StopTreadingWater.pdf) — Organizer slide URL linked by contemporary attendee and surviving mirror; file availability not independently established.
- Material: [video_mirror](https://www.youtube.com/watch?v=j0XmixCsWjs) — Direct metadata; explicitly links original YOW eventer video and organizer slides. Unofficial mirror; audiovisual identity not compared.
- Note: Scheduled-title conflict: ConfEngine YOW2014 Sydney/Melbourne/Brisbane list Functionally Oblivious and Succinct. Delivered Stop Treading Water attested; retain both until city-specific provenance resolved. Do not use 2015-05-07 report publication as talk date. Legacy organizer-linked YouTube Z8KcCU-p8QA currently returns Video unavailable. Keep it as historical alias, use the clearly labeled surviving mirror if desired. Mirror upload2017-12-05 is not the2014 talk date.

### Functionally Oblivious and Succinct

- ID: `kmett-2014-yow-lambda-functionally-oblivious` · talk · YOW! Lambda Jam2014
- Attribution: Edward Kmett (presenter).
- Archive date: **2014** (event; year precision). Inclusion: recommended. Confidence: high for scheduled talk/event/year; date precision limited.
- Date evidence: 2014 — event; Organizer ConfEngine archive identifies YOW! Lambda Jam2014.
- Source: [Organizer speaker archive](https://confengine.com/user/edward-kmett) — Title, event, 30-minute invited talk.
- Source: [Organizer session URL](https://confengine.com/conferences/yow-lambda-jam-2014/proposal/12793/functionally-oblivious-and-succinct) — Linked from speaker archive; direct retrieval failed.
- Note: Exact talk day/material version unresolved. Relative age in ConfEngine reflects import and must not be used as date. 2015 Kefalonia PDF is later version.

### Succinct Functional Data Structures

- ID: `kmett-2014-succinct-jhu` · talk · Johns Hopkins Computer Science seminar
- Attribution: Edward Kmett (presenter).
- Archive date: **2014-04-22** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2014-04-22 — presentation; Official seminar archive exact date.
- Source: [JHU organizer archive](https://www.cs.jhu.edu/seminar-archive-spring-2014/) — Title, date, presenter, abstract and Video Recording link.
- Note: Historical recording link exists but target was not recovered. Related Ljubljana talk family, distinct occurrence.

### Edward Kmett’s contributions to Haskell Communities and Activities Report, 2014-05

- ID: `kmett-2014-05-hcar-contributions` · collection, technical_report · Haskell Communities and Activities Report
- Attribution: Edward Kmett (author of sections explicitly labeled Report by; not sole author of issue).
- Archive date: **2014-05** (publication; month precision). Inclusion: optional. Confidence: high for issue/month and section attribution.
- Date evidence: 2014-05 — publication; Issue heading identifies Twenty-Sixth Edition, 2014-05.
- Source: [Original HCAR issue](https://www.haskell.org/communities/05-2014/html/report.html) — Contains numerous sections explicitly labeled Report by: Edward Kmett, including lens, machines, folds, exceptions, profunctors and other libraries.
- Material: [pdf](https://www.haskell.org/communities/05-2014/report.pdf) — Public whole-issue PDF; includes many other authors.
- Note: Optional collection entry, not every short package notice as an article. Compare successive issues before importing repeated text. Keep section-level participant credit (machines: Anthony Cowley, Shachaf Ben-Kiki, Paul Chiusano, Nathan van Doorn; profunctors: Shachaf Ben-Kiki, Elliott Hird). Participants are project collaborators, not automatically report coauthors. Many sections link to already-covered Comonad.Reader or School of Haskell pieces.

### [Persistent data structures based on cache-oblivious algorithms]

- ID: `kmett-2014-zurihac` · talk · ZuriHac2014
- Attribution: Edward Kmett (presenter).
- Archive date: **2014-06-06/2014-06-08** (event_interval; interval precision). Inclusion: recommended. Confidence: high for occurrence and event interval; title/exact day unestablished.
- Date evidence: 2014-06-06/2014-06-08 — event_interval; Organizer report says three-day event began June6; exact talk day unknown.
- Date evidence: 2014-06-30 — organizer_report_publication; Report dateline.
- Source: [Organizer report by Johan Tibell](https://opensource.googleblog.com/2014/06/zurihac-2014-haskell-hackathon-in-zurich.html) — Confirms Edward talk after Simon Marlow.
- Note: Bracketed title is descriptive, not an attested formal title. No material located.

### On Hask

- ID: `kmett-2014-on-hask` · talk · Boston Haskell at Akamai, Cambridge
- Attribution: Edward Kmett (presenter).
- Archive date: **2014-07-16** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2014-07-16 — presentation; Author recording explicitly says Boston Haskell Wednesday July16 2014 at Akamai Cambridge.
- Date evidence: 2014-07-18 — video_upload; YouTube player metadata.
- Source: [Haskell Weekly News300 mirror](https://www.mail-archive.com/haskell%40haskell.org/msg24962.html) — Video link circulated July2014.
- Source: [Edward’s own recording](https://www.youtube.com/watch?v=Klwkt9oJwg0) — Title, actual event date and venue in description; parent verified player metadata.
- Material: [video](https://www.youtube.com/watch?v=Klwkt9oJwg0) — Linked recording.
- Note: Exact talk date in Edward’s own recording description; source code https://github.com/ekmett/hask. Parent verified original player metadata in work/on-hask.json.

### Discrimination is Wrong: Improving Productivity

- ID: `discrimination-yow-2015` · talk · YOW! Lambda Jam 2015
- Attribution: Edward Kmett (presenter).
- Archive date: **2015** (presentation; year precision). Inclusion: recommended. Confidence: medium.
- Date evidence: 2015 — presentation; Exact presentation day unresolved. cB8DapKQz-I is a ZuriHac performance, not YOW.
- Source: [Organizer occurrence and title](https://confengine.com/user/edward-kmett) — primary
- Note: Exact presentation day unresolved. cB8DapKQz-I is a ZuriHac performance, not YOW.

### Functionally Oblivious (and Succinct)

- ID: `functionally-oblivious-ifip-2015` · talk_and_slides · IFIP WG2.8 33rd meeting, Kefalonia
- Attribution: Edward Kmett (presenter).
- Archive date: **2015-05-26** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2015-05-26 — presentation; Minutes say title; supplied PDF supplies actual title. Slot 11:50–12:30. Linked 2014 videos are prior performances, not recordings of this occurrence.
- Source: [Date and speaker](https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/33/minutes.html) — primary
- Source: [Title and authorship](https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/33/slides/Edward.pdf) — primary
- Material: [slides_pdf](https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/33/slides/Edward.pdf) — fetched
- Material: [slides_keynote](https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/33/slides/Edward.key) — linked_by_primary_source
- Note: Minutes say title; supplied PDF supplies actual title. Slot 11:50–12:30. Linked 2014 videos are prior performances, not recordings of this occurrence.

### Discrimination is Wrong: Improving Productivity

- ID: `discrimination-zurihac-2015` · talk_and_slides · ZuriHac 2015
- Attribution: Edward Kmett (presenter).
- Archive date: **2015-05-30** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2015-05-30 — presentation; Date corroborated by recording description in parent research: May30,2015. Video upload2015-07-28 is distinct from presentation.
- Date evidence: 2015-07-28 — video_upload; Direct YouTube metadata; original offset timestamp 2015-07-28T10:58:33-07:00
- Source: [Organizer index](https://github.com/zfoh/HaskellerZ) — primary
- Source: [Dated organizer material directory](https://github.com/zfoh/HaskellerZ/tree/master/meetups/20150530-ZuriHac2015_Edward_Kmett-Discrimination_is_Wrong_Improving_Productivity) — primary
- Source: [Google TechTalks recording](https://www.youtube.com/watch?v=cB8DapKQz-I) — direct_metadata_verified
- Material: [slides_pdf](https://raw.githubusercontent.com/zfoh/HaskellerZ/master/meetups/20150530-ZuriHac2015_Edward_Kmett-Discrimination_is_Wrong_Improving_Productivity/Discrimination%20-%20Zurihac.pdf) — linked_by_primary_source
- Material: [video](https://www.youtube.com/watch?v=cB8DapKQz-I) — Parent directly checked recording metadata: ZuriHac2015 and explicit presentation date2015-05-30.
- Note: Date corroborated by recording description in parent research: May30,2015. Video upload2015-07-28 is distinct from presentation.

### Propagators

- ID: `propagators-yow-lambda-2016` · talk · YOW! Lambda Jam 2016
- Attribution: Edward Kmett (presenter).
- Archive date: **2016** (presentation; year precision). Inclusion: recommended. Confidence: medium.
- Date evidence: 2016 — presentation; Exact day unresolved. Video discovered in gwils gist; do not inherit its erroneous Boston year.
- Source: [Organizer occurrence and 120-minute Combo format](https://confengine.com/user/edward-kmett) — primary
- Material: [video](https://www.youtube.com/watch?v=acZkF6Q2XKs) — candidate_secondary_resource_list
- Note: Exact day unresolved. Video discovered in gwils gist; do not inherit its erroneous Boston year. Candidate video URL returned no usable videoDetails in current retrieval; organizer occurrence is established separately.

### Propagators

- ID: `propagators-yow-west-2016` · keynote · YOW! West 2016
- Attribution: Edward Kmett (presenter).
- Archive date: **2016** (presentation; year precision). Inclusion: recommended. Confidence: medium.
- Date evidence: 2016 — presentation; Exact day unresolved. Distinct occurrence from Lambda Jam and Boston.
- Source: [Organizer occurrence, 60-minute keynote](https://confengine.com/user/edward-kmett) — primary
- Source: [Session URL linked by organizer](https://confengine.com/conferences/yow-west-2016/proposal/13117/propagators) — primary
- Material: [video](https://www.youtube.com/watch?v=ctT425sPAm4) — candidate_secondary_resource_list
- Note: Exact day unresolved. Distinct occurrence from Lambda Jam and Boston. Candidate video URL returned no usable videoDetails in current retrieval; organizer occurrence is established separately.

### Monad Homomorphisms

- ID: `monad-homomorphisms-zurihac-2016` · keynote_video · ZuriHac 2016
- Attribution: Edward Kmett (presenter).
- Archive date: **2016-07-23** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2016-07-23 — presentation; Google retrospective publication 2016-09-30 is not the talk date.
- Source: [Organizer README explicitly dates keynote](https://github.com/zfoh/HaskellerZ) — primary
- Source: [Sponsor retrospective confirms delivery and video](https://opensource.googleblog.com/2016/09/another-year-of-haskell-hacking-in.html) — primary
- Material: [video](https://www.youtube.com/watch?v=YTaNkWjd-ac) — title_fetched_and_primary_linked
- Note: Google retrospective publication 2016-09-30 is not the talk date.

### Desugaring Haskell’s do-Notation into Applicative Operations

- ID: `kmett-2016-applicativedo` · paper, conference_paper · Haskell Symposium 2016 / ACM
- Attribution: Simon Marlow (coauthor); Simon Peyton Jones (coauthor); Edward Kmett (coauthor); Andrey Mokhov (coauthor).
- Archive date: **2016-09** (proceedings_publication; month precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2016-09-01 — author_page_publication; Simon Peyton Jones’s publication page explicitly says Published: September 1, 2016. May reflect month-level metadata represented as day 1; treat separately from formal publication date.
- Date evidence: 2016-09-22 — scheduled_presentation; Haskell Symposium program Thursday September 22, 15:45; does not establish which coauthor spoke.
- Date evidence: 2016-09 — proceedings_publication; Final proceedings PDF identifies Haskell’16 September 22–23, 2016 and DOI; no exact online publication date verified.
- Source: [Coauthor publication page](https://simon.peytonjones.org/desugaring-haskell/) — All four authors; PDF and BibTeX; explicit web-page date.
- Source: [Organizer program](https://www.haskell.org/haskell-symposium/2016/) — Thursday September 22 2016 15:45 presentation and all four authors.
- Source: [Microsoft Research final paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/08/desugaring-haskell-haskell16.pdf) — All authors, conference September 22–23, DOI 10.1145/2976002.2976007.
- Material: [pdf](https://simon.peytonjones.org/assets/pdfs/desugaring-haskell.pdf) — Public author-hosted PDF.
- Material: [pdf](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/08/desugaring-haskell-haskell16.pdf) — Public Microsoft Research final paper.
- Material: [doi](https://doi.org/10.1145/2976002.2976007) — DOI printed in original final paper; target access not tested.
- Note: Keep a single coauthored paper work with copies/editions. SIGPLAN Notices indexing with DOI 10.1145/3241625.2976007 may be duplicate proceedings republication rather than new research; that DOI is only a discovered secondary-source lead here. Do not claim this was a talk delivered by Kmett, because the program names authors without identifying presenter.

### Transients

- ID: `transients-yow-2017` · talk · YOW! Lambda Jam 2017
- Attribution: Edward Kmett (presenter).
- Archive date: **2017** (presentation; year precision). Inclusion: recommended. Confidence: medium.
- Date evidence: 2017 — presentation; Exact day unresolved; July2 secondary link date not adopted.
- Source: [Organizer occurrence, 45-minute invited talk](https://confengine.com/user/edward-kmett) — primary
- Source: [Session URL linked by organizer](https://confengine.com/conferences/yow-lambda-jam-2017/proposal/12492/transients) — primary
- Note: Exact day unresolved; July2 secondary link date not adopted.

### An Interview With Haskell Developer Edward Kmett

- ID: `kmett-2017-initialcommit` · written_interview · _theInitialCommit
- Attribution: Edward Kmett (interviewee); _theInitialCommit (publisher; individual interviewer unverified).
- Archive date: **2017-01-10** (publication; day precision). Inclusion: recommended. Confidence: high for title/date/text in indexed primary source; direct page inaccessible.
- Date evidence: 2017-01-10 — publication; Original publisher search result and dated URL explicitly give Jan 10, 2017.
- Source: [Original publisher interview](https://theinitialcommit.com/2017/01/10/edward-kmett/) — Substantial written Q&A on library design, lens, ad, community, and maintenance; original page indexed, direct opening returned 403.
- Note: This references Learning How To Learn at YOW! 2014; it is a later interview, not a transcript or duplicate of that talk.

### Efficiently coding for modern CPUs

- ID: `efficient-modern-cpus-zurihac-2017` · keynote_video · ZuriHac 2017
- Attribution: Edward Kmett (presenter).
- Archive date: **2017-06-11** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2017-06-11 — presentation; Organizer program gives June11 slot; recording upload2017-07-06T22:29:18-07:00 is distinct.
- Date evidence: 2017-07-06 — video_upload; Direct YouTube metadata; original offset timestamp 2017-07-06T22:29:18-07:00
- Source: [Organizer dates Edward keynote Sunday June11 10:00–11:00](https://2017.zurihac.info/) — primary
- Source: [OST – Ostschweizer Fachhochschule recording](https://www.youtube.com/watch?v=KzqNQMpRbac) — direct_metadata_verified
- Material: [video](https://www.youtube.com/watch?v=KzqNQMpRbac) — Parent directly checked metadata: uploader OST – Ostschweizer Fachhochschule; title correct; description dates event June9–11.
- Note: Organizer program gives June11 slot; recording upload2017-07-06T22:29:18-07:00 is distinct.

### Let's Lens

- ID: `lets-lens-yow-2018` · workshop · YOW! Lambda Jam 2018
- Attribution: Tony Morris (presenter); Edward Kmett (presenter).
- Archive date: **2018** (presentation; year precision). Inclusion: recommended. Confidence: medium.
- Date evidence: 2018 — presentation; Exact day unresolved.
- Source: [Organizer occurrence, author order, full-day workshop](https://confengine.com/user/edward-kmett) — primary
- Note: Exact day unresolved.

### Combinators Revisited

- ID: `combinators-yow-2018` · talk_slides_video · YOW! Lambda Jam 2018, Sydney
- Attribution: Edward Kmett (presenter).
- Archive date: **2018-05-22** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2018-05-22 — presentation; 
- Source: [Organizer date 16:55–17:40 AEST, title, materials](https://confengine.com/conferences/yow-lambda-jam-2018/proposal/5919/combinators-revisited) — primary
- Material: [slides_pdf](https://yowconference.com.au/slides/yowlambdajam2018/Kmett-Combinators.pdf) — linked_by_primary_source
- Material: [slides_pdf_redirect](https://slides.yowconference.com/yowlambdajam2018/Kmett-Combinators.pdf) — redirect_observed_not_fetched
- Material: [video](https://www.youtube.com/watch?v=zhj_tUMwTe0) — linked_by_primary_source

### Combinators Revisited

- ID: `combinators-zurihac-2018` · keynote_video · ZuriHac 2018
- Attribution: Edward Kmett (presenter).
- Archive date: **2018-06-10** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2018-06-10 — presentation; Google publication 2018-08-17 is not presentation date; recording differs from YOW.
- Source: [Organizer title, date and 10:00–11:00 slot](https://2018.zurihac.info/) — primary
- Source: [Sponsor retrospective links HSR video](https://opensource.googleblog.com/2018/08/zurihac-2018-haskell-hackathon-in.html) — primary
- Material: [video](https://www.youtube.com/watch?v=PA1Fc7DNKtA) — linked_by_primary_source
- Note: Google publication 2018-08-17 is not presentation date; recording differs from YOW.

### Let's Lens

- ID: `lets-lens-yow-2019` · workshop · YOW! Lambda Jam 2019
- Attribution: Edward Kmett (presenter); Tony Morris (presenter).
- Archive date: **2019** (presentation; year precision). Inclusion: recommended. Confidence: medium.
- Date evidence: 2019 — presentation; Exact day unresolved.
- Source: [Organizer occurrence, author order, full-day workshop](https://confengine.com/user/edward-kmett) — primary
- Note: Exact day unresolved.

### Logic Programming à la Carte

- ID: `logic-a-la-carte-yow-2019` · talk · YOW! Lambda Jam 2019
- Attribution: Edward Kmett (presenter).
- Archive date: **2019** (presentation; year precision). Inclusion: recommended. Confidence: medium.
- Date evidence: 2019 — presentation; Exact day unresolved.
- Source: [Organizer occurrence, 30-minute invited talk](https://confengine.com/user/edward-kmett) — primary
- Note: Exact day unresolved.

### Cadenza: Building fast functional languages on the JVM

- ID: `cadenza-haskellday-2019` · talk · Haskell Day 2019, Haskell-jp, Tokyo
- Attribution: Edward Kmett (presenter).
- Archive date: **2019-11-09** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2019-11-09 — presentation; Scheduled occurrence; no slides or recording found in this pass. Title differs from 2020 Cadenza.
- Source: [Organizer listing gives event date and 17:00 special-talk slot](https://techplay.jp/event/727059) — primary
- Note: Scheduled occurrence; no slides or recording found in this pass. Title differs from 2020 Cadenza.

### Logic Programming à la Carte

- ID: `logic-a-la-carte-fnconf-2019` · keynote_slides_video · Functional Conf 2019, Bengaluru
- Attribution: Edward Kmett (presenter).
- Archive date: **2019-11-15** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2019-11-15 — presentation; 
- Source: [Organizer title, date and 09:30–10:15 IST slot](https://confengine.com/conferences/functional-conf-2019/schedule) — primary
- Source: [Session URL linked by organizer](https://confengine.com/conferences/functional-conf-2019/proposal/12701/logic-programming-la-carte) — primary
- Material: [slides_landing](https://confengine.com/conferences/functional-conf-2019/schedule) — Google Drive slides link observed; direct target unresolved
- Material: [video_landing](https://confengine.com/conferences/functional-conf-2019/schedule) — YouTube link observed; direct target unresolved

### Q & A Session With Functional Conf Speakers

- ID: `panel-fnconf-2019` · panel_video · Functional Conf 2019, Bengaluru
- Attribution: Naresh Jain (presenter); Aaron Hsu (presenter); Andrea Leopardi (presenter); Bruce Tate (presenter); Edward Kmett (presenter); Saurabh Nanda (presenter).
- Archive date: **2019-11-16** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2019-11-16 — presentation; Participants, not a solely Edward-authored talk. Organizer labels this as keynote.
- Source: [Organizer date, title, 17:00–17:45 IST slot and participants](https://confengine.com/conferences/functional-conf-2019/schedule) — primary
- Source: [Session URL linked by organizer](https://confengine.com/conferences/functional-conf-2019/proposal/13521/q-a-session-with-functional-conf-speakers) — primary
- Material: [video_landing](https://confengine.com/conferences/functional-conf-2019/schedule) — YouTube link observed; direct target unresolved
- Note: Participants, not a solely Edward-authored talk. Organizer labels this as keynote.

### Propagators

- ID: `propagators-fnconf-2019` · demonstration_video · Functional Conf 2019, Bengaluru
- Attribution: Edward Kmett (presenter).
- Archive date: **2019-11-16** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2019-11-16 — presentation; 
- Source: [Organizer date, title, 11:00–11:45 IST slot and recording link](https://confengine.com/conferences/functional-conf-2019/schedule) — primary
- Source: [Session URL linked by organizer](https://confengine.com/conferences/functional-conf-2019/proposal/12713/propagators) — primary
- Material: [video_landing](https://confengine.com/conferences/functional-conf-2019/schedule) — YouTube link observed; direct target unresolved

### Let's Lens

- ID: `lets-lens-fnconf-2019` · workshop · Functional Conf 2019, Bengaluru
- Attribution: Edward Kmett (presenter); Tony Morris (presenter).
- Archive date: **2019-11-17** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2019-11-17 — presentation; No media links found on session page.
- Source: [Organizer title, co-presenters, 10:00–18:00 IST date](https://confengine.com/conferences/functional-conf-2019/proposal/12476/lets-lens) — primary
- Note: No media links found on session page.

### Cadenza: Building Fast Functional Languages Fast

- ID: `cadenza-yow-2020` · talk_video · YOW! Lambda Jam 2020, online
- Attribution: Edward Kmett (presenter).
- Archive date: **2020-07-24** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2020-07-24 — presentation; Live coding normalization by evaluation and Graal/Truffle. Distinct occurrence from Haskell Day 2019.
- Source: [Organizer title, date, 10:10–10:55 AEST slot and video](https://confengine.com/conferences/yow-lambda-jam-2020/proposal/14531/cadenza-building-fast-functional-languages-fast) — primary
- Material: [video](https://www.youtube.com/watch?v=25RmUl88jSw) — linked_by_primary_source
- Note: Live coding normalization by evaluation and Graal/Truffle. Distinct occurrence from Haskell Day 2019.

### A Taste of Linear Optics

- ID: `linear-optics-bx-2021` · keynote_slides · Bx 2021 / STAF, online
- Attribution: Edward Kmett (presenter).
- Archive date: **2021-06-21** (presentation; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2021-06-21 — presentation; Mike Shulman credited as prior-work source in abstract, not coauthor. No recording found.
- Source: [Title, speaker, event date](https://bx-community.wikidot.com/bx2021:home) — primary
- Source: [09:10–10:30 CEST slot and downloadable slides](https://bx-community.wikidot.com/bx2021:program) — primary
- Source: [Proceedings retrospective confirms event and keynote](https://ceur-ws.org/Vol-2999/bxpreface.pdf) — primary
- Material: [slides_pdf](http://bx-community.wdfiles.com/local--files/bx2021:program/Keynote-slides.pdf) — linked_by_primary_source
- Note: Mike Shulman credited as prior-work source in abstract, not coauthor. No recording found.

### Episode 404 — Edward Kmett, Head of Software Engineering at Groq — Incredible Processing for AI Models

- ID: `kmett-2021-moderncto` · podcast, interview, transcript · Modern CTO
- Attribution: Edward Kmett (guest); Joel Beasley (host).
- Archive date: **2021-11-08** (publication; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2021-11-08 — publication; Original publisher labels Episode 404 · November 08, 2021.
- Source: [Original Modern CTO episode and transcript](https://moderncto.io/edward-kmett/) — Exact date, episode number, host identified as Joel Beasley in transcript, substantial full transcript.
- Material: [audio_and_transcript](https://moderncto.io/edward-kmett/) — Official episode page with audio and full transcript; direct audio download not separately verified.
- Note: One podcast episode with transcript; recording date not stated. Groq repost and other podcast-directory copies should be aliases, not independent entries.

### Edward Kmett interview after Functional Conf 2019

- ID: `kmett-2019-functionalconf-interview` · interview, video, transcript · Functional Conference
- Attribution: Edward Kmett (interviewee); Functional Conference (interviewer/producer; individual interviewer unverified).
- Archive date: **2021-12-13** (excerpt_publication; day precision). Inclusion: recommended. Confidence: high for excerpt dates; medium for single-interview grouping.
- Date evidence: 2019 — recording; Both official excerpt pages say Kmett spoke to them after presenting/delivering his keynote at Functional Conf 2019.
- Date evidence: 2021-12-13 — excerpt_publication; Official Why Haskell? page date.
- Date evidence: 2022-01-05 — excerpt_publication; Official How I discovered Functional Programming page date.
- Source: [Edward Kmett — Why Haskell?](https://functionalconf.com/edward-kmett-why-haskell/) — Official publication date 2021-12-13, context of interview following 2019 keynote; transcript.
- Source: [Edward Kmett — How I discovered Functional Programming](https://functionalconf.com/edward-kmett-how-i-discovered-functional-programming/) — Official publication date 2022-01-05, context of interview following 2019 keynote; transcript.
- Material: [Why Haskell?](https://functionalconf.com/edward-kmett-why-haskell/) — Official excerpt page.
- Material: [How I discovered Functional Programming](https://functionalconf.com/edward-kmett-how-i-discovered-functional-programming/) — Official excerpt page.
- Note: Proposed group: the two clips likely derive from one post-keynote interview, but identical recording session is not conclusively established. Link to Functional Conf 2019 keynote as related, not same work. Sort by first known public excerpt (2021-12-13) with Recorded 2019 label unless a fuller original interview release is found.

### Across the Kmettverse with Edward Kmett

- ID: `kmett-2022-functional-futures` · podcast, video, interview, edited_transcript · Functional Futures / Serokell
- Attribution: Edward Kmett (guest); Jonn (interviewer; name as shown in transcript); Emils Petracenoks (author of edited transcript article).
- Archive date: **2022-08-18** (episode_publication; day precision). Inclusion: recommended. Confidence: high.
- Date evidence: 2022-08-18 — episode_publication; Official show’s syndicated Apple Podcasts episode metadata says August 18, 2022 at 19:36 UTC.
- Date evidence: 2022-08-23 — edited_transcript_publication; Serokell original article labels August 23rd, 2022.
- Date evidence: 2022-08-18 — video_upload; Serokell original video jZrCVp5ekbA upload2022-08-18T12:41:38-07:00.
- Source: [Original Serokell article](https://serokell.io/blog/across-the-kmettverse-with-edward-kmett) — Author Emils Petracenoks; dated edited highlights; links to official YouTube and audio version.
- Source: [Official show syndication on Apple Podcasts](https://podcasts.apple.com/us/podcast/across-the-kmettverse-with-edward-kmett/id1606772921?i=1000576527907) — Episode 10, season 1, publication timestamp 2022-08-18 19:36 UTC; 1h34m.
- Source: [Original Serokell video](https://www.youtube.com/watch?v=jZrCVp5ekbA) — direct_metadata_verified
- Material: [video](https://www.youtube.com/watch?v=jZrCVp5ekbA) — Direct public watch-page metadata verified: Serokell uploader, matching title and episode description.
- Material: [audio](https://podcasts.apple.com/us/podcast/across-the-kmettverse-with-edward-kmett/id1606772921?i=1000576527907) — Official podcast syndication; no direct MP3 download independently verified.
- Material: [edited_transcript](https://serokell.io/blog/across-the-kmettverse-with-edward-kmett) — Public publisher article.
- Note: One interview work with audio/video and later edited highlights. Recording date is unknown. References to Stop Treading Water and Type Classes vs. the World are related works, not duplicates. Current serokell.co mirror and serokell.io article should alias one manifestation.

### Testimony of Edward Kmett in support of House Bill 4668: Large AI Developers’ Safety and Security Protocols

- ID: `kmett-2025-michigan-testimony` · written_testimony · Michigan State House of Representatives, Judiciary Committee
- Attribution: Edward Kmett (author, Founder & Chief Scientist, Positron AI).
- Archive date: **2025-06-25** (committee_testimony; day precision). Inclusion: optional. Confidence: high for author/date; medium for downloadable format.
- Date evidence: 2025-06-25 — committee_testimony; House Judiciary committee original index explicitly lists June 25, 2025 — HB 4668 — Edward Kmett, Positron AI.
- Source: [Michigan House Judiciary committee index](https://house.mi.gov/Committee/HJUDI) — Exact date and matching author/bill; indexed primary source, direct opening failed.
- Source: [Original submitted testimony](https://www.house.mi.gov/Document/?DocumentId=54834&DocumentType=CommitteeTestimony) — Search-indexed document title and text identify Kmett, Positron AI, committee and bill; direct retrieval returned 502.
- Material: [document](https://www.house.mi.gov/Document/?DocumentId=54834&DocumentType=CommitteeTestimony) — Public committee download; indexed title ends .docx but delivered MIME type was not established.
- Note: A substantial authored policy document outside programming; editorial choice whether to include. Date is committee testimony date, not independently verified upload date. Do not infer oral delivery from written testimony.

### Wavelets in 3d Graphics

- ID: `kmett-pre2001-wavelets-3d-graphics` · technical_article · Bloodshed.com / Harmless Entertainment
- Attribution: Edward Kmett (author).
- Archive date: **unknown** (unknown; unknown precision). Inclusion: recommended. Confidence: high for title/attribution; original date unknown.
- Date evidence: 2001-05-26 — archive_capture; Wayback CDX and readable snapshot; establishes article existed by this date, not original publication date.
- Source: [Archived author paper](https://web.archive.org/web/20010526225638/http://www.bloodshed.com:80/wavelets/haar.shtml) — Full substantial paper with Edward Kmett byline, email and site.
- Source: [Archived author introduction](https://web.archive.org/web/20011121083059/http://www.bloodshed.com:80/wavelets/start.shtml) — Calls the Haar-basis document an old paper the author wrote; discusses wavelet code.
- Material: [html_article](https://web.archive.org/web/20010526225638/http://www.bloodshed.com:80/wavelets/haar.shtml) — Complete archived HTML text, mathematical expressions and illustrations in source; image availability not checked.
- Note: Haar-wavelet texture compression and comparison with mipmapping for a3D polygonal game engine. Source cites literature through1997 but gives no author/publication date. Adjacent dsp.zip01/16/99 label dates code package, not this paper. Do not assign1999 to paper or treat2001 capture as original publication. No magazine provenance established.

### Making de Bruijn Succ Less

- ID: `kmett-undated-bound-slides` · talk · SlideShare / event unidentified
- Attribution: Edward Kmett (presenter).
- Archive date: **unknown** (unknown; unknown precision). Inclusion: candidate. Confidence: high for title and attribution; date unknown.
- Source: [Author SlideShare](https://www.slideshare.net/slideshow/bound-making-de-bruijn-succ-less/13768903) — 50-slide deck, title and author-upload.
- Material: [slides](https://www.slideshare.net/slideshow/bound-making-de-bruijn-succ-less/13768903) — Public slides.
- Note: Likely2012, date/event not established. Bound library contributors must not be converted to slide coauthors.

## Relationships to existing blog records

- **Introduction to Monoids / Iteratees, Parsec and Monoids slides**: Attach slide resources and event metadata to existing blog record. Only Introduction received the full talk Aug18; do not pretend the second full talk was delivered then. [Evidence / related content](https://ekmett.github.io/reader/category/haskell/boston-haskell/index.html)
- **A Parallel Parsing Trifecta: Iteratees, Parsec, and Monoids**: Separate September presentation reuses earlier deck; later2017 Monoidal Parsing is a related new performance. [Evidence / related content](https://groups.google.com/g/fa.haskell/c/3PDC3LgQeao)
- **Finger Trees**: Blog last-night statement supports inferred event date; consolidate slide-only announcement and talk assets. [Evidence / related content](https://ekmett.github.io/reader/category/haskell/boston-haskell/index.html)
- **kmett-2013-cache-oblivious-maps**: Substantial follow-up article is distinct content, linked to talk. Article header2013-11-08 and signature2013-10-31 differ. [Evidence / related content](https://www.schoolofhaskell.com/school/to-infinity-and-beyond/pick-of-the-week/deamortized-st)
- **kmett-2012-online-lca**: 2012 presentation and later article are distinct; article signature2013-09-14 versus displayed header2015-08-27. [Evidence / related content](https://www.schoolofhaskell.com/user/edwardk/online-lca)
- **kmett-undated-bound-slides**: Connect deck and article as one topic family; do not transfer article migrated date to undated slides. [Evidence / related content](https://www.schoolofhaskell.com/user/edwardk/bound)
- **kmett-2022-functional-futures**: Interview references Type Classes vs.the World; it is not the same work. 
- **propagators**: Boston2015, YOW2016, MonadicParty2019 and FunctionalConf2019 are separate performances; no identical recording found. 

## Boston Haskell channel

Channel identity is verified directly from YouTube metadata: **Boston Haskell**, **@BostonHaskell**, **UCUCpgCWjaniUkX88wZrK_Ig**. The [Videos tab](https://www.youtube.com/@BostonHaskell/videos) contains 30 entries and the [Live tab](https://www.youtube.com/@BostonHaskell/streams) contains three archives. Every watch page matches that channel ID. This covers public listed items at retrieval; private, deleted or unlisted recordings are outside that count.

Uploader ownership does not determine speaker attribution. The December 2014 lightning recording has six timed segments; preserve all six names and Edward’s segment at 01:34:55. Ryan Wisnesky’s 2014 talk description credits joint work with David Spivak, without identifying Spivak as a speaker.

| Event date / precision | Upload date | Recording | Speaker(s) |
|---|---|---|---|
| 2014-04-16 | 2015-02-15 | [Tim Braje - A Quick Introduction To Haskell](https://www.youtube.com/watch?v=IAYNk951_xk) | Tim Braje |
| 2014-04-16 | 2015-02-15 | [Ryan Wisnesky - A Functorial Query Language](https://www.youtube.com/watch?v=Q0m8baqBrk4) | Ryan Wisnesky |
| 2014-08-20 | 2015-02-17 | [Adam Chlipala - Ur/Web](https://www.youtube.com/watch?v=8n5ubDe9FAA) | Adam Chlipala |
| 2014-09-17 | 2014-09-24 | [Kenneth Foner - Getting a Quick Fix of Comonads](https://www.youtube.com/watch?v=8r1lji4Pzsg) | Kenneth Foner |
| 2014-11-19 | 2014-11-24 | [Ranjit Jhala - Liquid Haskell](https://www.youtube.com/watch?v=vYh27zz9530) | Ranjit Jhala |
| 2014-12 (month only) | 2015-01-15 | [Boston Haskell Lightning talks - Dec. 2014](https://www.youtube.com/watch?v=yFXzuCFeRGM) | Darius Jahandarie, Elliot Stern, William Blair, Kenneth Foner, Tom Titchener, Edward Kmett |
| 2015-01-21 | 2015-02-16 | [Edward Kmett - Type Classes vs. the World](https://www.youtube.com/watch?v=hIZxTQP1ifo) | Edward Kmett |
| 2015-02-18 | 2015-03-29 | [Rishiyur S. Nikhil - Enigmatic Haskell, Haskellish Enigma](https://www.youtube.com/watch?v=9-u2n4GgcVw) | Rishiyur S. Nikhil |
| 2015-02-18 | 2015-03-29 | [Cody Roux - Pure Type Systems](https://www.youtube.com/watch?v=ZGqKsalJi4s) | Cody Roux |
| 2015-03-25 | 2015-04-01 | [Anthony Cowley - Framing the Discussion with EDSLs](https://www.youtube.com/watch?v=_KioQRICpmo) | Anthony Cowley |
| 2015-04-15 | 2015-05-09 | [Chris Casinghino - Making Dependent Types Practical](https://www.youtube.com/watch?v=_2jrmgO_Gq0) | Chris Casinghino |
| 2015-04-15 | 2015-05-09 | [Ryan Trinkle - Reflex: Practical Functional Reactive Programming](https://www.youtube.com/watch?v=dOy7zIk3IUI) | Ryan Trinkle |
| 2015-05-20 | 2015-07-06 | [Alec Heller - Skete: Exploring Distributed Package Management](https://www.youtube.com/watch?v=gZwMp8YXIXg) | Alec Heller |
| 2015-10-21 | 2015-11-11 | [Paul Chiusano on csound-expression](https://www.youtube.com/watch?v=O0oBXcwGZQY) | Paul Chiusano |
| 2015-11-04 | 2015-11-13 | [Julian Arni - Servant - Boston Haskell](https://www.youtube.com/watch?v=rsv96JK4Vx4) | Julian Arni |
| 2015-11-18 | 2015-11-19 | [Edward Kmett - Propagators - Boston Haskell](https://www.youtube.com/watch?v=DyPzPeOPgUE) | Edward Kmett |
| 2016-01-20 | 2016-01-20 | [Dimensional - Douglas McClean - Boston Haskell](https://www.youtube.com/watch?v=-Kz7SYZNoUU) | Douglas McClean |
| 2016-01-20 | 2016-01-21 | [On Reflex - Boston Haskell - Greg Hale](https://www.youtube.com/watch?v=MfXxuy_CJSk) | Greg Hale |
| 2016-02-17 | 2016-02-28 | [Edward Kmett - Undecidable Superclasses](https://www.youtube.com/watch?v=ZL9ehIJhk98) | Edward Kmett |
| Unknown | 2016-02-28 | [James Larisch - Haskell Code Review!](https://www.youtube.com/watch?v=0fyrf83pjMg) | James Larisch |
| 2016-03-16 | 2016-03-27 | [Haskell, Startups, and Domain Specific Languages](https://www.youtube.com/watch?v=R4nLSxCKkNw) | Adam Wespiser |
| Unknown | 2016-03-28 | [Composing (Music) in Haskell - Stuart Popejoy](https://www.youtube.com/watch?v=Jmw6LLNQQfs) | Stuart Popejoy |
| 2016-04-20 | 2016-04-28 | [Alexey Radul - Probabilistic Programming Live-code](https://www.youtube.com/watch?v=8YUUuZMawdY) | Alexey Radul |
| 2016-04-20 | 2016-04-27 | [Austin Seipp - binary-serialize-cbor](https://www.youtube.com/watch?v=Mj2cXQXgyWE) | Austin Seipp |
| 2016-05-18 | 2016-05-26 | [Faré Rideau - First-class implementations](https://www.youtube.com/watch?v=heU8NyX5Hus) | François-René Rideau |
| 2017-07 (month only) | 2017-09-05 | [James Koppel - Cracking Multi-Language Transformations](https://www.youtube.com/watch?v=SmBpQ3V9Yqo) | James Koppel |
| Unknown | 2017-08-06 | [Cody Roux - SMT for DSLs: a Tutorial](https://www.youtube.com/watch?v=2rhrxkNtrM4) | Cody Roux |
| Unknown | 2017-09-05 | [Thomas Dietert - Introduction to Cryptocurrencies in Haskell](https://www.youtube.com/watch?v=wjyiOXRuUdo) | Thomas Dietert |
| 2017-09-20 | 2017-09-20 | [Algebraic Databases - Boston Haskell Meetup](https://www.youtube.com/watch?v=JzShJfikr4g) | Ryan Wisnesky |
| 2017-10-18 | 2017-10-18 | [Monoidal Parsing - Boston Haskell Meetup](https://www.youtube.com/watch?v=090hIEiUoE0) | Edward Kmett |
| 2017-11-15 | 2017-11-15 | [A Walk-through of Computational Reflection in Coq  - Boston Haskell Meetup](https://www.youtube.com/watch?v=4BmvEInzoY0) | Gregory Malecha |
| 2021-10-27 | 2021-11-17 | [Programming with Tactics](https://www.youtube.com/watch?v=BiH_A36zKwI) | Reed Mullanix |
| 2022-01-05 | 2022-02-07 | [The current state of the Haskell Foundation](https://www.youtube.com/watch?v=AweAVW4Pig8) | Andrew Boardman |

Cowley’s 2015-03-25 date combines the organizer’s March25 description with the [speaker’s March2015 repository](https://github.com/acowley/BostonHaskell2015), which links the exact recording. Koppel’s July2017 month comes from his [own CV](https://www.jameskoppel.com/files/cv.pdf). Faré’s 2016-05-18 date is independently on his [slide title page](https://fare.tunes.org/files/cs/fci-bh2016.pdf). Materials and full source descriptions are in the channel JSON.

## Attribution, exclusions and coverage limits

- Dan Doel’s Homotopy and Directed Type Theory slides hosted by Edward remain Dan’s work. Japanese ekmett-workshop library talks remain attributed to their actual speakers, not to the library author.
- Wren Ng Thornton co-taught the 2011 McMaster DSL bootcamp. Project contributors, acknowledgments, or cited influences are not automatically coauthors or presenters.
- HCAR contains many short library reports and repeated revisions. Two issues are optional curated collection entries here; this is not an exhaustive import of every section or issue.
- Papers such as Profunctor Optics, What You Needa Know about Yoneda, Typeclassopedia, and There Is No Fork mention or build on Kmett’s work but are not thereby Kmett-authored publications.
- Several old conference pages, original video URLs and downloads are unavailable. A source can verify that a work existed without providing a currently playable recording. Candidate and secondary-source media links are marked accordingly.
- The 2022 YOW announcement about unlifted types/Backpack remains a lead: exact title, day and recording were not established. Broad post2022 searching did not establish additional general technical talks; this does not imply none occurred.
- The pre-blog magazine-writing lead remains unresolved unless a byline/issue is found. Do not manufacture magazine credits from the flipcode column.
- No video media was downloaded, no site was published, no outside person was contacted, and the main project was not edited. Only this research workspace and small public metadata/document evidence were used.

## Monadic Warsaw / Monadic Party series

# Monadic Party 2019: four Guanxi sessions

**Primary event dates recovered:** June18 and June20,2019, at Monadic Party in Poznań, Poland. Monadic Warsaw is the organizer/uploader. The archived2019 event hostname no longer resolves, but the organizer’s public Git history preserves the full program.

- [Preserved organizer site](https://github.com/mkawalec/monadic-party/blob/87898f578f99bd50550ef40e9fe1e6b5cc55be36/src/index.html) (last pre-event source update June13,2019).
- [Header: June18–21,2019 in Poznań](https://github.com/mkawalec/monadic-party/blob/87898f578f99bd50550ef40e9fe1e6b5cc55be36/src/index.html#L50-L53).
- [Organizer identity and same YouTube channel](https://github.com/mkawalec/monadic-party/blob/87898f578f99bd50550ef40e9fe1e6b5cc55be36/src/index.html#L85-L86).
- [Workshop title and abstract](https://github.com/mkawalec/monadic-party/blob/87898f578f99bd50550ef40e9fe1e6b5cc55be36/src/index.html#L457-L475): four-hour advanced tour of Guanxi, a Haskell logic-programming framework in the style of miniKanren.

| Part | Exact video title | Presentation (local scheduled start) | Upload metadata | Recording |
|---|---|---|---|---|
| 1/4 | Guanxi - Logic Programming in Haskell 1/4 | 2019-06-18 14:00 | 2019-07-04T14:28:24-07:00 | [Video](https://www.youtube.com/watch?v=D7rlJWc3474) |
| 2/4 | Guanxi - Logic Programming in Haskell 2/4 | 2019-06-18 15:00 | 2019-07-04T14:31:39-07:00 | [Video](https://www.youtube.com/watch?v=s5OnhepyL7w) |
| 3/4 | Logic Programming in Haskell 3/4 | 2019-06-20 10:00 | 2019-07-06T13:22:36-07:00 | [Video](https://www.youtube.com/watch?v=c3UE41eYXHA) |
| 4/4 | Logic Programming in Haskell 4/4 | 2019-06-20 11:00 | 2019-07-06T11:50:03-07:00 | [Video](https://www.youtube.com/watch?v=TnohBRvoUJk) |

The program has parts1/2 under Tuesday (June18) at14:00 and15:00, and parts3/4 under Thursday (June20) at10:00 and11:00. These are program dates, corroborated to the event/sequence by the organizer’s recording titles and descriptions; no internal recording date was checked. All four descriptions say “Monadic Party2019” and link monadic.party.

- [Parts1/2 in program](https://github.com/mkawalec/monadic-party/blob/87898f578f99bd50550ef40e9fe1e6b5cc55be36/src/index.html#L744-L758).
- [Parts3/4 in program](https://github.com/mkawalec/monadic-party/blob/87898f578f99bd50550ef40e9fe1e6b5cc55be36/src/index.html#L1067-L1081).
- Durations:47:31;43:44;46:31;52:08.
- Parts3/4 omit “Guanxi” from the recording title; the program title includes it for all four.
- Keep all four rows as separate workshop sessions, grouped in one series. Do not collapse them with Boston Propagators or the YOW talks. Upload order is not session order: part4 was uploaded earlier than part3.

Materials: [Guanxi source repository](https://github.com/ekmett/guanxi), the library explicitly named in the abstract. [Contemporary code revision](https://github.com/ekmett/guanxi/tree/4434198d406738d553256034b8b9fb9e959f4d18) is the latest repository commit before the event (April17,2019), **not** claimed to be the exact workshop checkout. No separate slide deck was found.

Evidence files: `monadic-party-2019.html`; `monadic-party-commits.json`; `warsaw-1.json` through `warsaw-4.json`; structured entries in `warsaw-talks.json`.

## Flipcode supplement

# Pre-Comonad.Reader articles: Flipcode

Verified against the original publisher archive on 2026-09-21. The series is **Harmless Algorithms by Edward Kmett**, signed **Harmless**. Four installments are preserved in the [primary index](https://flipcode.com/archives/articles.shtml).

| Issue/title | Publisher date | Signed date | Source |
|---|---|---|---|
| Harmless Algorithms — Issue 01: Fine Occlusion Culling Algorithms | 1999-04-09 | 1999-04-08 | [Original article](https://flipcode.com/archives/Harmless_Algorithms-Issue_01_Fine_Occlusion_Culling_Algorithms.shtml) |
| Harmless Algorithms — Issue 02: Scene Traversal Algorithms | 1999-04-30 | 1999-04-29 | [Original article](https://flipcode.com/archives/Harmless_Algorithms-Issue_02_Scene_Traversal_Algorithms.shtml) |
| Harmless Algorithms — Issue 03: Design Patterns And 3D Gaming | 2000-01-26 | 2000-01-26 | [Original article](https://flipcode.com/archives/Harmless_Algorithms-Issue_03_Design_Patterns_And_3D_Gaming.shtml) |
| Harmless Algorithms — Issue 04: A Hybrid Approach to Visibility | 2001-02-19 | 2001-02-03 | [Original article](https://flipcode.com/archives/Harmless_Algorithms-Issue_04_A_Hybrid_Approach_to_Visibility.shtml) |

All four are recoverable full HTML articles, not merely bibliographic citations. Publication and signature dates differ in three cases and should both be retained. The pages carry an old copyright1999 boilerplate even on the2000 and2001 articles; it is not the publication year. No coauthor is named. Do not add Jacco Bikker’s related articles simply because they quote or credit Edward.

Useful attribution exclusions: Jacco Bikker’s *Building a3D Portal Engine, Issue16: More On Portals* and *Thoughts On Visibility Determination* discuss Edward’s feedback but are Bikker works. Willem de Boer’s *Fast Terrain Rendering Using Geometrical MipMapping* thanks Edward; it is not a Kmett-authored paper.

Early personal sites linked in the column are bloodshed.com (1999) and kmett.com (2001); useful leads for additional archives. Print magazine articles remain unresolved in this pass; no title/issue/byline should be invented from a general recollection.

## Recovered earlier personal-site paper

**Wavelets in3d Graphics**, Edward Kmett — [full archived original](https://web.archive.org/web/20010526225638/http://www.bloodshed.com:80/wavelets/haar.shtml). Discusses Haar-wavelet compression of textures and relation to mipmapping. Undated internally; **2001-05-26 is archive capture**, establishing an upper bound on original publication. The surrounding [author introduction](https://web.archive.org/web/20011121083059/http://www.bloodshed.com:80/wavelets/start.shtml) calls it an old paper. Bibliography includes1997 literature. Adjacent dsp.zip01/16/99 in the contents dates a code package, not necessarily the paper. No magazine provenance established.

The archived [author about page](https://web.archive.org/web/20001026211946/http://www.bloodshed.com:80/self.shtml) identifies aliases/pen names **Harmless, Edward Allan**. Those are useful alternate bylines for further print-magazine research.

## Print-magazine bibliography remains unresolved

The initiating author recollection is [this Comonad.Reader comment](http://comonad.com/reader/2008/kan-extension-iii/#comment-20469). It says the author used to write magazine articles and recalls the Flipcode column, but names no print publication or specific article. Bounded searches under Edward Kmett, Edward Allan and Harmless did not identify a reliable title/issue/byline; this is a research gap, not evidence that none existed.

Preservation pointers: canonical publisher URLs are in each JSON record, together with the Wayback URL for the recovered paper. Research HTML snapshots exist in `work/flipcode-issue2.html`, `work/flipcode-issue3.html`, `work/flipcode-issue4.html`, and `work/bloodshed-haar.html`. They are not complete preservation packages: images/linked code have not been captured.


## Author dating correction and new recordings — 22 September 2026

Edward recalls writing **Wavelets in 3D Graphics circa 1995**. This supersedes the unknown-date assessment above. The archive uses that approximate year, separately retaining the 2001 capture date and the uncertainty about later revisions (bibliography through 1997). The complete paper is now imported; the separately linked dsp.zip returned 404.

Added Monadic Warsaw’s *Monad Transformer Lenses* (uploaded 25 July 2016), Lambda World Seattle’s *There and Back Again* (presented 18 September 2018, uploaded 6 November), and 31 recordings covering live-coding sessions 1–26. Live-coding dates use explicitly labeled YouTube release dates; the numbered series preserves intended order and split sessions.
