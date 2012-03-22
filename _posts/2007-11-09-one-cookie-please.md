---
layout: post
category: plone
title: One cookie please, but hold the pickles
tags : [cookies, pickling, pickles, security]
---
{% include JB/setup %}
*This article was originally published on [jarn.com](http://jarn.com).*

*The python pickle module is dangerous, didn't you know?*

## All your base are belong to us

By now you all should have installed [last Tuesday's Hotfix](http://plone.org/products/plone-hotfix/releases/20071106). If you haven't yet, but are running Plone 2.5 or Plone 3.0 websites, you should do so **yesterday**, or at least as soon as humanly possible.

The Hotfix patches a serious security problem in the statusmessages and linkintegrity modules, where network-supplied data was interpreted as [pickles](http://docs.python.org/lib/module-pickle.html). "Network-supplied" data in this case means both cookies and form data, and no authentication is required to exploit the holes.

## What happen ?

The basic problem with the holes is that the Plone community was totally unaware of how dangerous the pickle module really is. Hanno Schlichting did file a [report](http://dev.plone.org/plone/ticket/6943) a few months ago stating that the code was potentially dangerous, but even he didn't fully appreciate that pickles are a security hole only waiting for attacker input. The scary thing here is that the code in question was written by extremely capable and experienced developers, but none of them were aware of the fact that you cannot ever use pickles to load user-supplied data.

What is needed then, is education. This is my contribution.

## You are on the way to destruction

So what is wrong with pickles? They are just a damn handy way to serialize arbitrary data into binary strings and back again, right?

Yes, they are that, but the pickle format used is also a [simple stack language](http://peadrop.com/blog/2007/06/18/pickle-an-interesting-stack-language/) that allows the creation of arbitrary python structures, and execute them. This stack language allows you to import modules (the 'c' symbol), and apply arguments to callables (the 'R' symbol), thus causing code to be run. Combine this with the python built-in methods `eval` and `compile` and you have the perfect vehicle for an attacker to have the pickle loader routine execute arbitrary python code when loading a well-crafted pickle. Just image what an attacker could do with that to your Zope server. Do you think you'll ever be sure you got all the backdoors out of your Data.fs?

## We get signal

So next time you need to preserve data across HTTP requests, please do not be tempted to use the pickle module to create strings for you. Rarely will you have anything more than a handful of simple datatypes to pass along anyway, so just invent a simple dataformat and use that instead. (No, using a subclass of the python implementation of pickle is not a simpler solution).

With statusmessages for example, each message consists of a message and a type string, both unicode. So we changed to a hand-rolled format using a 2 byte length header (11 bits of message length, 5 for the type) directly followed by the message and type strings (encoded to utf-8). When reading this from a cookie again later, the decoder simply has to read the lengths from the first 2 bytes, then read the right amount of characters to get the message and type back. A similar method was used to encode the linkintegrity data. Simple, effective, and impervious to attacks.

> Congratulation!!<br />
> A.D.2111<br />
> All bases of CATS were destroyed.<br />
> It seems to be peaceful.<br />
> But it is incorrect. CATS is still alive.<br />
> ZIG-01 must fight against CATS again.<br />
> And down with them completely !<br />
> Good luck.
>
> <small markdown="1">[Zero Wing, 1989](http://en.wikipedia.org/wiki/All_your_base_are_belong_to_us)</small>
{: cite=http://en.wikipedia.org/wiki/All_your_base_are_belong_to_us}
