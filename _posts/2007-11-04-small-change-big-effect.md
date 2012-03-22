---
layout: post
category: plone
title: Small change, big effect
tags : [performance, indexing, rename]
---
{% include JB/setup %}
*This article was originally published on [jarn.com](http://jarn.com).*

*How changing one line halved the time it took to rename a Plone folder.*

Here at the Plone Performance sprint, Matt Hamilton and Sasha Vincic are homing in on the Catalog and folder renaming. As Sasha already [reported earlier](http://valentinewebsystems.com/archive/2007/11/02/indexing-in-plone-got-twice-as-fast), they identified the object_provides index as a potential bottleneck.

## The object_provides index

The index is filled with interface identifiers, strings representing the actual interfaces. The data for the index comes from a small method in Products.CMFPlone.CatalogTool, object_provides, which looked like this:

{% highlight python %}
def object_provides(object, portal, **kw):
    return [interfaceToName(portal, i) for i in providedBy(object).flattened()]
{% endhighlight %}

So, for each interface declared by an object, interfaceToName is invoked. The purpose of interfaceToName is to provide a way to turn an
interface to a string that can be used to later turn that string back
into an interface, through the queryInterface method, interfaceToName's
sibling.

Now the problem with interfaceToName is that it has to iterate over the whole utilities registry to find all interfaces registered as utilities just to find out what name it was registered with. This is a slow process, but a necessary one; although the default name for an interface is it's *dotted name* (the python identifier path to their definition), some special classes of interfaces are registered with a different name. For example, when registering a Zope3-style browser menu, an interface is generated for the menu, and registered with a zope.app.menus prefix.

## No need for interfaceToName

Luckily, for the object_provides index use-case, interfaceToName is overkill. First of all, object_provides indexes declared interfaces on content objects only, and therefore will never encounter any of the "special" interfaces.

But more importantly, the index contents are never used to find the original interfaces again. Quite the contrary, it is only used to search what objects provide a given interface, and the developer querying the catalog will have to generate the same string format every time they search. So, with the index using interfaceToName to fill the index, searching the index also requires developers to use interfaceToName to query the index. Search for IATFolder? Pass in interfaceToName(IATFolder) and hit the same performance problem.

<img alt="Renaming performance increase" src="{{BASE_PATH}}/assets/images/renaming-performance-increase.png" style="float: right" />
## Unique identifier

So if interfaceToName is overkill, what unique identifier should we use then? As we already mentioned, when you register an interface in the first place, the default name is the dotted name of the interface. It's a unique identifier, as it's the name under which python stores it in memory. It is available as the `__identifier__` attribute on the interface. As it's unique, and available directly from the interfaces themselves, it's ideally suited for both indexing and searching.

Of course, this means that if we use `__identifier__` then you should use the same attribute when querying the index. Because `__identifier__` (or `__module__ + '.' + __name__`, which is the same) is already the default for interfaceToName, this is what Plone developers have been using anyway.

So we changed the indexing method to:

{% highlight python %}
def object_provides(object, portal, **kw):
    return [i.__identifier__ for i in providedBy(object).flattened()]
{% endhighlight %}

and presto, indexing was more than twice as fast, as shown by the pretty graph on the right. We tested this by having JMeter rename a folder with 20 documents in it, 40 times.

Not bad for a one-line change.


