---
title: Portlets as ESI include
date: 2012-06-14 00:00:00 +01:00
categories:
- plone
tags:
- ESI
- caching
- portlets
description: Using ESI includes to cache Plone portlets separately.
redirect_from:
- "/plone/2012/06/09/portlets-as-esi-include/"
---

*{{ page.description }}*

To help with making a large and busy intranet website perform better, we've used a light sprinkling of [ESI](https://en.wikipedia.org/wiki/Edge_Side_Includes) (via [Varnish's ESI support](https://www.varnish-cache.org/trac/wiki/ESIfeatures)) to improve the cacheabilibty of pages in the site. By delegating assembly of parts of the page to the Varnish cache, pages become much more cacheable as frequently changing chunks such as the personal bar at the top are requested separately.

## Portlets via ESI include

One such chunk we separated out is the right-hand portlets column. Varnish has been configured to set a special header so that we can detect that ESI is supported:

```c
sub vcl_recv {
    ...
    # Indicate that a varnish capable of doing ESI is in front...
    set req.http.X-ESI = "esi";
    ...
}
```

Using this header we can then conditionally swap out the portlets column with an `<esi:include>` statement; this makes site development much easier as we do not have to run Varnish just to see the site working. Here is the relevant section from the `main_template.pt` file:

```xml
<td id="portal-column-two"
    metal:define-slot="column_two_slot"
    tal:condition="sr">
  <div class="visualPadding"
       tal:define="
           esi_header request/HTTP_X_ESI | nothing;
           base context/@@plone_context_state/current_base_url | nothing;
           location python:base and base.rstrip('/').split('/')[-1].lstrip('@');
           esi python:esi_header and (location not in (
               'manage-portlets', 'manage-content-type-portlets'));
           queryString request/QUERY_STRING;
           queryString python: queryString and '?' + queryString or '';
           ">
    <metal:portlets define-slot="portlets_two_slot">
      <esi:include tal:condition="esi"
          tal:attributes="src string:${context/absolute_url}/@@right-column${queryString}" />
      <tal:noesi condition="not: esi"
                 replace="structure provider:plone.rightcolumn" />
    </metal:portlets>
    &nbsp;
  </div>
</td>
```

Note that we are making sure that ESI is also not applied when using the portlet management views.

The `@@right-column` view is simply a template:

```xml
<html tal:omit-tag="">
<body tal:omit-tag="">

<tal:block replace="structure provider:plone.rightcolumn" />

</body>
</html>
```

This whole setup was working swimmingly; we could cache pages for extended periods of times with things like the portlets updating much more frequently and with caching keyed to specific groups of users.

## Where did that portlet go?

This being a large and complex intranet, it took some time for someone to notice that some lightly-used portlets were no longer showing up. These were portlets that depend on certain content being there, so their absence was not necessarily a problem. However, it was becoming clear that even when their specific conditions were being met, they were not being rendered still. This was quickly narrowed down to the ESI-included portlet rendering; if you bypassed the cache the portlets would show up.

So what went wrong?

Portlets are essentially rendered as part of the Zope viewlet framework. Viewlets are snippets of page output that are looked up by a key consisting of the current context, the current request, the current view and the viewlet manager. Portlets thus have access to these same pieces of information, and you can thus register portlets that only show for certain contexts (particular content types, marker interfaces, etc.), browser layers (usually themes), and even only for specific views or portlet managers (tying the portlet to the left, right or dashboard portlet wells).

With the lesser-known [`<plone:portletRenderer />` directive](https://github.com/plone/plone.app.portlets/blob/7a6303400b4ecf7595fb21ec9c43b38b31fb8aca/plone/app/portlets/metadirectives.py#L67), you can also vary the way portlets are rendered for the above keys. Thus, a portlet can look different in different themes, different portlet managers, or when a certain extra marker interface is present on your content objects. This is what had happened to the vanished portlets here; they had been tied to specific *views*:

```xml
<configure
    xmlns="http://namespaces.zope.org/zope"
    xmlns:plone="http://namespaces.plone.org/plone"
    />

  <plone:portlet
    name="foobar.portlets.localcalendar"
    interface=".localportlet.ILocalCalendarPortlet"
    assignment=".localportlet.Assignment"
    renderer=".localportlet.Hidden"
    addview=".localportlet.AddForm"
    />

  <!-- My HQ page -->
  <plone:portletRenderer
    portlet=".localportlet.ILocalCalendarPortlet"
    class=".localportlet.Renderer"
    view="foobar.types.browser.mychain.MyChainView"
    />

  <!-- My Store page -->
  <plone:portletRenderer
    portlet=".localportlet.ILocalCalendarPortlet"
    class=".localportlet.Renderer"
    view="foobar.types.browser.store.StoreView"
    />
</configure>
```

The above `plone:portlet` declaration registers a portlet that is hidden by default. The two `plone:portletRenderer` declarations then assign new renderers when certain views are being used instead. This neat trick allows for the portlet to be targeted very specifically.

This all works great, unless you use a dedicated view for ESI rendering of the portlets. Suddenly the current view is no longer `MyChainView` or `StoreView`, but rather `@@right-column`. Thus the dedicated renderer is skipped in favour of the `.localportlet.Hidden` renderer, which does what it says on the tin: not render.

## Reconstruct the *whole* context

The solution is of course to reconstruct the whole context; the `@@right-column` view already had most things right, only the current view is wrong. With a simple set of TAL declarations we can set up a new value for the `view` variable when rendering the portlets. Here is the reworked `main_template.pt` code:

```xml
<td id="portal-column-two"
    metal:define-slot="column_two_slot"
    tal:condition="sr">
  <div class="visualPadding"
       tal:define="
           esi_header request/HTTP_X_ESI | nothing;
           base context/@@plone_context_state/current_base_url | nothing;
           location python:base and base.rstrip('/').split('/')[-1].lstrip('@');
           esi python:esi_header and (location not in ('manage-portlets', 'manage-content-type-portlets'));
           viewContext string:?__view_context=${view/__name__};
           queryString request/QUERY_STRING;
           queryString python: queryString and viewContext + '&amp;' + queryString or viewContext;
                   ">
    <metal:portlets define-slot="portlets_two_slot">
      <esi:include tal:condition="esi"
                   tal:attributes="src string:${context/absolute_url}/@@right-column${queryString}" />
      <tal:noesi condition="not: esi"
                 replace="structure provider:plone.rightcolumn" />
    </metal:portlets>
    &nbsp;
  </div>
</td>
```

We use a GET parameter to pass along the name of the view to look up; I've used a double-underscore prefix here to reduce the chances we clash with a query string parameter used elsewhere in the site. The `@@right-column` view then restores this view for portlet rendering (with a fallback to the Plone default view context `@@plone`):

```xml
<html tal:omit-tag="">
<body tal:omit-tag="">

<tal:block
    define="viewname request/__view_context | nothing;
            viewname python:viewname and '@@' + viewname or '@@plone';
            view nocall:context/?viewname"
	replace="structure provider:plone.rightcolumn" />

</body>
</html>
```

Et voilà, our portlets are showing up good and proper again.

*[ESI]: Edge Side Includes
