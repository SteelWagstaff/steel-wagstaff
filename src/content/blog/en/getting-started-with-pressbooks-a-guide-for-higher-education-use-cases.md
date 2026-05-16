---
title: "Getting Started with Pressbooks: A guide for Higher Education use cases"
description: "Using Pressbooks to publish OER"
publishedAt: 2017-11-10
author: steel
tags: []
draft: false
locale: en
---


For the past few years, I’ve been helping faculty and other subject experts at UW-Madison develop and publish openly licensed textbooks and other learning activities using Pressbooks, free and openly licensed software which was originally conceived by Hugh McGuire as a way to extend WordPress in order to publish electronic books. I began this work with a list of core principles for an authoring/publishing tool, and after testing a whole host of alternatives (Inkling Habitat, GitBook, Booktype, and more) settled on Pressbooks as the best available tool for what I was after.

In this post, I’ll describe what Pressbooks is, how we’re using it, and some of your options for getting started in creating and publishing your own openly licensed textbooks or learning objects. Please note: this is not intended to serve as a detailed guide for making a Pressbook (though you can find some good user manuals at the end of this post), but I will try to give a high-level overview of the main components of both a Pressbooks network and an individual Pressbook from the perspective of both readers and makers.

In what follows, I’ll be using the term ‘Pressbooks’ to refer to two distinct things: 1) the software and publishing platform that allows authors to write, publish, and freely distribute eBooks and related content, and 2) an example, singular or plural, of a book or other learning object published using the Pressbooks platform. In this second case, I’ll usually refer to the object(s) in the singular, i.e. as ‘a pressbook’.

Let me parse this distinction quickly with a few examples and screenshots.

## What is Pressbooks?

Hugh McGuire, Pressbooks’ founder, describes Pressbooks as “an online book publishing platform that makes it easy for you and your team to generate clean, well-formatted books in multiple outputs [like epub, print-ready PDF, HTML, or XML]. PressBooks is built on WordPress and is open source.”

### Pressbooks is an Interconnected Network

The primary thing you need to know about Pressbooks as a piece of software is that Pressbooks is by default a network capable of containing an almost infinite number of nodes [i.e. books or other learning objects]. Because it requires WordPress Multisite, each installation of Pressbooks creates the infrastructure needed to publish an enormous library of individual books or learning objects, each of which has its own unique address on the web, as well as its own unique structure, theme or appearance, copyright license, and permissions. This means that a single Pressbooks network could easily contain both a privately published, password-protected book for which the author chose to retain full copyright and which they chose to sell elsewhere on the web at a profit as well as an openly published book dedicated to the public domain (using a CC0 license, say) with copies freely downloadable in several different formats, as well as any number of variations in between.

At the network level, administrators can control or publish any number of titles to a large public catalog. Pressbooks is currently redesigning how that main catalog page looks and what can be customized there (wireframes look excellent), but the principle will be essentially unaffected — the network has a landing page that can feature as many published ‘books’ or other objects as you like.

Here’s what looks like on our instance:

![The landing page/public catalogue for Pressbooks published at UW-Madison, showing 6 of our published titles](/src/assets/blog/pressbooks-landing-page.png)
*The landing page/public catalogue for Pressbooks published at UW-Madison, showing 6 of our published titles. See http://wisc.pb.unizin.org to see it live on the web.*

![The network admin page for our installation of Pressbooks](/src/assets/blog/pressbooks-network-admin.png)
*The network admin page for our installation of Pressbooks.*

As a network administrator, when I login to the administrative panel, I see a Pressbooks network dashboard that lets me manage all the sites and users in our network, install or activate new plugins or books themes, manage network settings, and create a new book or clone an existing book (from our instance or any other public Pressbooks instance). Users who have managed WordPress Multisite instances should be able to familiarize themselves pretty quickly with the setup depicted at the right.

## How to Use Pressbooks

I’ll describe the interface for creating and managing an individual Pressbook on the network in a later section, but I first want to quickly describe the three basic ways (taken from Pressbooks.org) that you can get access to a Pressbooks network and use this software to start developing and publishing a book or other learning object:

- Let [Pressbooks] host and maintain a Pressbooks network for you
- Host and maintain your own Pressbooks network
- Use Pressbooks.com

### Option 1: PressbooksEDU

The first option, the PressbooksEDU service, is a pretty straightforward Software as a Service [SaaS] arrangement, and seems to me to be ideal for an organization or university system who wants to make Pressbooks available for several users. I don’t know much about their pricing, but they provide their sales pitch and description of services here. In my interactions with Hugh and other Pressbooks staff, I’ve found them to be honest, straightforward, and very reliable.

### Option 2: Self-hosting Pressbooks

The second option, self-hosting, is where I began a few years ago (before there was a PressbooksEDU service) and how my institution currently provides access to Pressbooks for interested parties (through Unizin, who hosts Pressbooks instances for several schools in the consortium). If you’re thinking that this is the way to go for you, let me unpack this option a little more.

Because Pressbooks is open source software (maintained as a public repository on GitHub), you can install it on your own web server and run your own ‘instance’ of Pressbooks, by following these instructions. To do this, you’ll need to have secure, reliable web hosting (which can be expensive) and you’ll also want to be comfortable making a fresh installation of WordPress Multisite and managing plugins, updates, and basic server maintenance and security tasks yourself, which is not trivial and most likely something that the average beginning user is going to be likely to know how to do (or want to do themselves). Speaking from a couple of years worth of experience of this option, I can comfortably say that hosting and maintaining your own Pressbooks network is hard (and usually thankless) work — if you can afford to pay Pressbooks to host the service for you, it’s almost certainly worth the investment.

### Option 3: Publishing Books Piecemeal on Pressbooks.com

The third option, using the Pressbooks.com instance, seems to me to be the best way for single individuals begin testing the waters or try out Pressbooks and its several features. If you’re familiar with how WordPress works (as free software that you can download from Wordpress.org and install yourself on your own server and as a freemium service available from Wordpress.com), you’ll see that Pressbooks is not altogether that different, which Hugh’s own description of Pressbooks’ founding makes abundantly clear.

For example, Wordpress.com is actually a giant multisite installation of the Wordpress.org software, and Wordpress lets you create a site for free on that giant network (which they maintain and keep updated) and then charges you monthly fees for extra features/customization that you might want on your website. Similarly, Pressbooks.com is a single, enormous instance of the Pressbooks software (which runs a WordPress multisite), and Pressbooks maintains the network and will allow anyone who wants to try the tool to create a book on the network, much like you can create your own WordPress site at Wordpress.com.

In this ‘freemium’ arrangement, you can create a book for free on the Pressbooks.com server (Pressbooks hosts the book and handles security, just as WordPress does for Wordpress.com sites), and if you’re satisfied with the book you’ve made, you have the option to pay modest one-time fees to remove watermarks from your exports and get larger amounts of storage for your book.

## What is a Pressbook?

Ok. So let’s assume that you’ve now got access to an installation of Pressbooks — a Pressbooks network, in other words, which is made up of individual Pressbooks. So what’s a Pressbook?

### Português para principiantes: An Example

Well, let’s start with an example. At Wisconsin, I’ve worked with faculty and graduate students in the Spanish & Portuguese department to use Pressbooks to publish a free, online version of a Brazilian Portuguese language textbook they’ve written and maintained for more than 50 years. That book, Português para principiantes, now lives on the open web at https://wisc.pb.unizin.org/portuguese/.

That URL is the landing page for this book — the first part of the address (wisc.pb.unizin.org) identifies our Pressbooks network and the last part of the address (/portuguese) identifies this particular book. Each individual Pressbook on our network has its own unique URL, it’s own website where it lives on the internet, and that website functions as a “landing page” which can include all kinds of important information about the book. Please note: We’ve installed a few additional plugins on our instance, so if your views differ in some ways from what I’m demoing below, that may be one reason why.

### Pressbooks “Landing Pages”

The home page for a given book generally includes several features:

- Title, subtitle, author information and brief description (what we might call the book’s metadata)
- The book’s cover image
- A table of contents
- Download options for offline access [optional]

Here’s what that “landing page” looks like for our Portuguese language textbook:

![Sample landing page for an individual Pressbook](/src/assets/blog/pressbooks-book-landing.png)
*Sample landing page for an individual Pressbook. The red numbers are were added to the screengrab for illustrative purposes and refer to the following: 1) Title, subtitle, author information and brief description; 2) Cover image; 3) Table of contents; 4) Download options for offline access.*

![Additional metadata and licensing information for an individual book](/src/assets/blog/pressbooks-book-metadata.png)
*Additional metadata and licensing information for an individual book included on a book's landing page. Note that this book was licensed under a CC BY-NC-SA license at the time the screenshot was made.*

Most of the information that populates this landing page can be entered and edited from the ‘Book Info’ page, which is accessible from the author’s dashboard (shown below):

![Sample view of the Book Info section of a Pressbook dashboard](/src/assets/blog/pressbooks-book-info.png)
*Sample view of the 'Book Info' section of a Pressbook dashboard*

### Creating and Organizing the Book’s Content

The table of contents displayed on the book’s landing page is dynamically generated from the book’s published content. A Pressbook can contain all kinds of content: both several kinds of front & back matter (preface, acknowledgements, appendices, etc.), as well as the main body of the text. Currently Pressbooks allows authors to create “parts” (sections) which function as parent organizational elements as well as “chapters,” which are children elements to “parts.” I believe that Pressbooks is planning to release new structuring abilities shortly based on the HTMLBook specification, but this is what is currently possible.

Authors can add new front/back matter, parts and chapters from a simple ‘Organize Text’ interface also available in their dashboard. Once created, individual chapters appear in a structured order and can be moved between parts/sections using a simple drag and drop interface drag (pictured below):

![A sample view of Pressbooks text organization tool](/src/assets/blog/pressbooks-text-org.png)
*A sample view of Pressbooks' text organization tool. Chapters can be reordered by dragging and dropping.*

The book itself can be made public or private with a click of a button, and each chapter has check boxes which allow you to make that chapter public or private, hide or show the title, and include or exclude it from future exports, giving you quick and simple chapter-level controls over the published text.

![Sample view of a published chapter in Pressbooks](/src/assets/blog/pressbooks-chapter.png)
*Sample view of a published chapter in Pressbooks.*

Authors can choose from a number of themes which control the look and feel of an individual book, but generally a chapter will appear to the reader with the following elements (shown at right):

- The chapter title & its particular contents
- Forward and back buttons for navigation
- An expandable table of contents

The content in individual parts and chapters is created using a standard WYSIWYG editor and will be pretty quickly familiar to anyone who has used WordPress. Some major features are highlighted below:

- The WYWIWYG editor with buttons that allow users to quickly do a number of authoring-related tasks: insert media, change the formatting of header elements, add textboxes, links, footnotes, etc. Users can also toggle between ‘visual’ and ‘text’ (html) views.
- The actual content of the chapter.
- Information about the chapter (which part/section it belongs to and export information)
- Publishing options (status, visibility, revision history) and preview/publish/update options.

#### Sample view of the Pressbooks chapter editing interface

Beneath the content itself are several other settings which can be made visible through the ‘screen options’ at the top-right of the page, including:

- The chapter’s author (drop down list which displays all the authorized users in the book)
- Additional chapter metadata fields
- Chapter copyright license (capable of overriding the book’s generic license)
- The revision history for the chapter (past revisions can be viewed, compared, and reverted to)

![Additional settings available in chapter editing menu](/src/assets/blog/pressbooks-chapter-settings.png)
*Additional settings available in chapter editing menu*

## Producing Exports

You probably noticed in our “landing page” example that visitors to the Portuguese textbook site could download a copy of the book for offline access in a number of different formats. That’s because Pressbooks also allows you to easily create exports of your book’s content and to download, publish, or share those exports in whatever way you like. In our case, the creators of our language textbook chose to publish the textbook under an open license, and wanted to make free (offline) copies of the book available to anyone who wants to learn Portuguese. Authors can produce exports of their content at any time from a ‘Export’ link available in the book’s dashboard.

![Sample view of the export page for a Pressbook](/src/assets/blog/pressbooks-export.png)
*Sample view of the export page for a Pressbook.*

This export page will generally include the following components:

- A big red ‘export your book’ button!
- Several export format options (some of which require additional dependencies and additional installation, if you’re running your own Pressbooks network)
- The last 5 batches of exported files you’ve made for a given book
- Information about the theme you’re using for your book. We’re using the excellent Open Textbooks theme for our book (with our deepest thanks to Brad Payne and the good folks at BCcampus for their work on and support for the Open Textbooks plugin)

If you want these exports to appear on the landing pages for individual books, you’ll need to enable this at the network level. Network administrators will see an option called ‘Sharing & Privacy’ in their network settings menu, and can select the ‘Allow book administrators to enable redistribution of export files’ option (pictured at right).

If this setting is enabled, individual book authors will see a similar option available at the book level in their ‘Settings’-> ‘Sharing & Privacy’ menu under the title ‘Share Latest Export Files’ (shown below). If they select ‘yes’ to this option, the most recent exports for their book will be available for download on the book’s landing page.

## Further Reading

Phew! This has already gone on for quite some time, but I hope that it’s a helpful start. I realize that I’m not really even scratching the surface of some of the most interesting teaching & learning applications possible with open web publishing and a WordPress-based tool like Pressbooks, but I’ll have to leave that for another day. If you have any corrections, suggestions, or questions, I’d love to hear them.

In the meantime, if you’re looking for further guides to using Pressbooks for open publishing projects connected to higher education, I’d recommend consulting (or contributing to!) the following resources:

- This user guide written and maintained by Pressbooks: https://guide.pressbooks.com/ and these training videos: https://www.youtube.com/user/pressbooks/videos
- These two textbook authoring guides for Pressbooks: Lauri Aasoph and Amanda Coolidge’s original (published in 2014 by BCcampus): https://opentextbc.ca/opentextbook/ and a derivative published in 2016 by Jordan Epp, Kristine Dreaver-Charles, and Jeannette McKee at the University of Saskatchewan: http://openpress.usask.ca/authoring/
- Melissa Falldin and Karen Lauritsen’s excellent guide to Authoring Open Textbooks, with contributions from a ton of excellent university library folks.
- Rebus Foundation’s Guide to Making Open Textbooks with Students, edited by Elizabeth Mays, with significant contributions from more than a dozen university-affiliated folks.
- Billy Meinke’s training materials for supporting instructional faculty as they start working with OER (currently being piloted with faculty and staff in the University of Hawai’i system)
- Amanda Larson (now the open education librarian at Penn State) and I have published an ad-hoc guide to using some authoring features in use in our self-hosted PB instance: https://wisc.pb.unizin.org/pressbooks101/

Featured image: "open" by Roger Jones, CC BY-NC.