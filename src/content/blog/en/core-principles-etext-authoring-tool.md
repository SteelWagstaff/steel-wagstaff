---
title: Core Principles for an eText Authoring Tool
description: ''
publishedAt: 2016-03-18
author: steel
tags:
- Educational Technology
- Writing
- Literature
- Higher Education
- Open Educational Resources
- Publishing
draft: false
locale: en
image: ./images/23806298056_725f168eb4_k.jpg
imageAlt: Core Principles for an eText Authoring Tool
---

### eText Authoring at UW-Madison

About a year ago, I began thinking seriously about an eText authoring platform that could be used to write and publish openly-licensed texts. I work at a [large research university](http://www.wisc.edu) in the American midwest, which means that a large percentage of my colleagues are engaged directly in both high-level academic research (and publishing) and the more quotidian task of teaching undergraduates and graduate students in their chosen research fields. A large chunk of student time (and money) is spent focused on instructor-selected instructional materials (including books and textbooks), and there have been all kinds of efforts to control and reduce these costs, including interest in producing lower-cost, higher-capability electronic texts (eTexts), and some exploration of self-publishing. On our campus, our CIO [published an enthusiastic prediction about the future of eTexts](https://it.wisc.edu/news/etext-clock-ticking-textbook-publishers/) nearly three years ago, and our central IT organization had led a series of four progressively larger ‘e-Text’ pilots. By and large, however, the eText pilot efforts I saw happening locally ended in disappointment, with hard-working content experts (i.e. faculty and grad students) and well-intentioned technologists generally failing to make durable, useful texts. In my opinion, these failures happened for a number of reasons, but chief among them was the lack of a suitable publishing environment or workflow within which to do the eText authoring. In the report on the most recent centrally-supported eText pilot (which concluded in June 2015), the project’s managers confessed that “applicants who wanted to create a textbook were also looking for advanced interactivity and multimedia integration. While some of our creators were able to find authoring tools that fit (even if awkwardly) the scope of their project, others soon realized the technology we had access to simply would not meet their expectations.” When I read this report, the phrase “we had access to” caused me to raise my eyebrows most quizzically, and I became even more distressed when later in the report’s appendix I found the following admissions:

> #### Step 3: Choose an Authoring Platform
> 
> We assumed, going into this pilot, that there must be many authoring platforms that could meet the needs of our authors, provide easy ways to incorporate interactivity, and produce a product that would be easy to access and read on a reader or other technology without an author needing to know a lot of code. … After many attempts and forays into different technologies, our team realized that there isn’t a good, publisher agnostic solution yet. …
> 
> #### Step 6: Publish and distribute
> 
> Frankly, we spent very little time on this aspect…

These two passages distressed me quite a great deal. As a technologist, I don’t want to ever be in the uncomfortable position of offering to provide support for a complex project with a mere _assumption_ that there must be a tool out there that can do what the user wants — I want to know, clearly and well in advance, that there is a tool that will meet the user’s needs, and I want to know precisely how it operates and what the major constraints and limitations of that tool are _before_ I ask the user to make major investments of time and effort into a tool/workflow. Furthermore, publication and distribution of an eText seem to me as integral to a text’s utility as creation, and to spend “very little time on this aspect” seemed to me to decision to avoid in any future efforts to make usable eTexts. Once I finished reading this report, I felt very strongly that the any future efforts to produce usable electronic texts for higher education on our campus would need to focus _first_ on the technical development (or selection) of a suitable authoring, publishing, and distribution environment, and that this focus seemed to me to have been neglected in previous efforts to develop eTexts on our campus. While I felt hopeful that there would be authoring platforms that could meet the needs of authors, rather than assuming such a tool already existed, I thought it would be wise to make a clear list of principles or capabilities such a tool would need to satisfy before being considered for use as a development option. After some thought and reflection, I developed the following list of six core principles/features that any eText authoring/publishing platform should satisfy before being considered for adoption to produce texts for use in higher education.

* * *

### Core Principles for an eText Authoring & Publishing Tool

I believe that an ideal eText authoring/publishing tool for use in higher education should be:

#### 1\. Relatively easy for novice users to work with

This feels self-explanatory, but it’s of crucial importance. It seems to me that the best authoring environments for text creation, especially open texts, are the most democratic. An ideal eText authoring tool should have a low technical barrier to entry and should not be more difficult to learn to use than a basic word-processor.

#### 2\. Collaborative, with robust version control

An ideal authoring tool should allow many authors to work together to produce a text. It should also keep track of past revisions, and allow authors to review or restore previous edits. It would be ideal if it allowed authors to establish a basic editorial workflow as well (a system of editors, commenters, proof-readers, etc.) and could hand role-management and permissions for a variety of different production roles. It almost goes without saying that if these are the requirements, the tool should probably be web- or cloud-based.

#### 3\. Open standards-based, device/platform agnostic, and compliant with both Federal accessibility law \[Section 508\] and local policies

##### Open Standards & Device/Platform Agnosticism

By this I mean several things. First, the tool should be built on broadly shared, [open standards](https://en.wikipedia.org/wiki/Open_standard) whenever possible, and should use these standards in its output. For the web, this means that it should make well-formed HTML5 output, and should be styled with CSS3. Generic output should be [cross-browser](https://en.wikipedia.org/wiki/Cross-browser) and [cross-platform](https://en.wikipedia.org/wiki/Cross-platform) compatible and stylesheets should be built with [responsive design](https://en.wikipedia.org/wiki/Responsive_web_design) in mind — in very simple terms, this means that the content should probably take fluid or flowing rather than fixed form, and should display with minimal issues on a variety of web-connected devices of all shapes and sizes.

##### Accessibility

In the United States, many institutions of higher education are subject to legal requirements for accessibility mandated by the [Americans with Disabilities Act](http://www.ada.gov/) or by [Section 508](http://www.section508.gov/) of the Rehabilitation Act of 1973. In addition, many institutions have local policies of access and inclusion designed to ensure that a broader segment of the public is able to make use of their materials and services. At the very minimum, the tool itself should be fully accessible to potential users and should produce content which satisfies the relevant legal requirements, and, if web-based, should also strive to fully implement the latest [web content accessibility guidelines](https://www.w3.org/TR/WCAG20/) issued by the W3C (an international organization founded by [Tim Berners-Lee](https://www.w3.org/People/Berners-Lee/) which develops web standards).

#### 4\. Able to export to multiple, nonproprietary formats without intellectual property issues

By this I mean that the tool maker or publishing platform should exert no control over content. Content creators should have exclusive power to decide how texts are licensed and should be able to quickly and easily publish material with the license of their choice, including [Creative Commons licenses](https://creativecommons.org/licenses/). The tool should also permit content creators to export to any/all of a wide variety of standards-based formats (like HTML, .epub, .mobi, .pdf, or text) and make persistent copies of the text available to interested users in any/all of these formats.

#### 5\. Capable of including multimedia and interaction

##### Multimedia

eTexts, particularly those based on the web, provide a number of possible enhancements that are not available to those working in traditional print formats. Chief among these is the inclusion of native or embedded audio and video resources. An ideal eText authoring tool should allow for the easy insertion of audio and video content, ideally through a dedicated media server which handles streaming issues so that users on different browsers/platforms have a uniform experience.

##### Interaction

An ideal eText authoring tool would also allow content creators to design interactive learning experiences. These experiences should include a range of activities permitted by modern web technologies, and should be simple to create and insert in the text. At the very least, the tool should allow for robust [formative assessment](https://en.wikipedia.org/wiki/Formative_assessment), and should be capable of giving timely, helpful feedback to learners.

#### 6\. Able to function both apart from and inside of multiple Learning Management Systems.

An ideal authoring tool should produce an eText that is fully capable of standing alone as a fully-functional web object or being wrapped in some kind of file format (see principle 4). In addition, these eTexts should also be able to be easily integrated with a Learning Management System, so that interested instructors can quickly and easily bring their content into a course they might be teaching. This is primarily an institutional need, but the principle remains valid, I think. When content is used with an LMS, the content should allow for assessment/some analytics, particularly in relation to any of the interactive pieces described in principle 5. If we’re speaking about [IMS Global standards](https://www.imsglobal.org/specifications.html), the tool should provide [LTI](https://www.imsglobal.org/activity/learning-tools-interoperability), [QTI](https://www.imsglobal.org/question/index.html) and/or [Thin Common Cartridge](https://www.imsglobal.org/cc/index.html) integration at the very minimum, with full [Caliper Analytics](https://www.imsglobal.org/activity/caliperram) compliance as the gold standard. If your eyes glazed over at the acronym soup, what it means is that we want a clear and system mechanism for wrapping or inserting the text inside of the LMS, so that it looks and feels like other kinds of content that a learner might encounter there \[step 1\]. The trickier piece \[step 2\], is that if a learner engages with the content from the LMS, it should be possible, under certain conditions and with the learner’s full consent, for the LMS to measure and report about what a learner does in or with that text.

\[My thanks to [bowerbird](https://medium.com/u/74a5e2d31ed) for the eagle-eyed proofreading of this document as well as some very helpful suggestions for this section.\]

* * *

Those are the 6 principles I feel are essential to a broadly useful eText authoring platform for use in higher education. In a future post, I’ll describe more about the tools I considered, and what I’ve been working to assemble/build at UW-Madison to allow any interested members of campus to author openly licensed eTexts. Featured image: Interior of Senior School, courtesy of [The US National Archives](https://www.flickr.com/photos/usnationalarchives/23806298056/)
