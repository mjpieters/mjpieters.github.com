---
layout: post
category: plone
title: The dreaded plone.relations IntId KeyError
description: When IntIds go missing, the going gets tough. Specifically, plone.app.relations and related packages do not deal gracefully when a relationship source or target is missing. Here is how we clear such broken relationships.
tags : [plone.relations, IntIds, KeyError]
---
{% include JB/setup %}
*This article was originally published on [jarn.com](http://jarn.com).*

*When IntIds go missing, the going gets tough. Specifically, plone.app.relations and related packages do not deal gracefully when a relationship source or target is missing. Here is how we clear such broken relationships.*

We've been experimenting with [plone.app.relations](http://pypi.python.org/pypi/plone.app.relations) to manage relationships between objects for a few years now. This package uses [zc.relations](http://pypi.python.org/pypi/zc.relationship) to lay the links between content items in your site, which in turn relies on [zope.app.intid](http://pypi.python.org/pypi/zope.app.intid) to indirectly create those links. Basically, intids are pointers to the real objects and lets you handle the linking efficiently.

## Water in the Bilge

The relations machinery is not very forgiving if any intid has gone AWOL. Normally, the relations data structures are kept in sync through Zope events, but this doesn't always work out. In our experience, you can end up with objects and their intids removed, but the relationships pointing to the now-gone intids still in place. When this happens, things break, and you get trackbacks ending in the dreaded `KeyError: <long number>` in `getObject` of `zope/app/intid/__init__.py`. The traceback line before that will be zc/relationship/index.py in the method `resolveToken`.

Now, the zc.relations package is very powerful and very, very flexible. This comes at a price, as it's internal data structures are quite daunting to the uninitiated. If you have to repair these relations and all you have is the missing intid at one end of the relation, it'll be a long hard slug through a maze of 3 or 4 different packages and opaque TreeSets.

## Bucket by Bucket

Luckily, we already did the deep code dive for you. The following method, if passed an intid, will find any references to it in the relations data structure and remove these for you:

{% highlight python %}
from plone.relations.interfaces import IComplexRelationshipContainer
from zope.app.intid.interfaces import IIntIds

def removeKeyErrorRelationship(iid):
    """Remove all relationships that point to a intid no 
       longer in the site
    """
    intids = getUtility(IIntIds)
    relationships = getUtility(IComplexRelationshipContainer, 
                               name='relations')
    relIndex = relationships.relationIndex
    for direction in ('target', 'source'):
        data = relIndex._name_TO_mapping[direction].get(iid)
        if not data or data[0].value == 0:
            continue # Empty set for this direction
        for relid in list(data[1]):
            keyref = intids.refs.get(relid)
            if keyref is None:
                # Not even the relationship exists anymore
                relIndex._remove(relid, (iid,), direction)
            else:
                relation = keyref.object
                try:
                    relation.__parent__.remove(relation)
                except AttributeError:
                    # The relation object only exists in the intid utility;
                    # in this case __parent__ is None.
                    relIndex.unindex(relation)
                    intids.unregister(keyref)
{% endhighlight %}

Note that this method assumes you already have [the local site manager set up properly](http://stackoverflow.com/questions/5819978/how-do-i-trigger-portal-quickinstaller-reinstallproducts-form-outside-the-plone-s/5820885#5820885). This is a great little method to get rid of individual KeyError problems.

## Man the Pumps

It would be better, if you could clear out all missing intids from the relations tool altogether, *before* they become a problem and things fall down. Luckily, there is! The following code will hunt down and remove all missing intids from the tool. Note that it'll take a while (it'll scan through two whole relations indexes), so you better sit back and relax while the work is done.

{% highlight python %}
from plone.relations.interfaces import IComplexRelationshipContainer
from zope.app.intid.interfaces import IIntIds
from BTrees.IOBTree import difference

def clearAllMissingLinks():
    """Find and remove all missing intids in the
       relations tool.
    """
    intids = getUtility(IIntIds)
    relationships = getUtility(IComplexRelationshipContainer, 
                               name='relations')
    relIndex = relationships.relationIndex
    rtotal = itotal = 0
    for direction in ('target', 'source'):
        idx = relIndex._name_TO_mapping[direction]
        for iid in difference(idx, intids.refs):
            itotal += 1
            for relid in list(idx[iid][1]):
                keyref = intids.refs.get(relid)
                if keyref is None:
                    # Not even the relationship exists anymore
                    relIndex._remove(relid, (iid,), direction)
                else:
                    relation = keyref.object
                    try:
                        relation.__parent__.remove(relation)
                    except AttributeError:
                        # The relation object only exists in the intid utility;
                        # in this case __parent__ is None.
                        relIndex.unindex(relation)
                        intids.unregister(keyref)
                rtotal += 1
    return itotal, rtotal
{% endhighlight %}

Note that this method returns the total number of intids identified, as well as the total number of relationships removed.

## Patch the leak?

Instead of pumping out the water, we should of course patch the leak. We have yet to find it though, but if we do, we'll make sure the affected packages receive the patch!

### *April 2012 Update*: clean-up methods fine-tuned.

I've found that in practice some relationships only were still referenced by intid keyrefs and present in the relationships index, but no longer were present in the relationship utility itself. These have to be manually unindexed and removed; the code examples above have been updated to reflect this.
