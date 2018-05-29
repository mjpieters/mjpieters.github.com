---
layout: post
category: plone
title: "Saving the day: recovering lost objects"
description: When a customer discovers over a week later that an important object was accidentially deleted, what do you do?
tags : [recovery, beforestorage]
---
*{{ page.description }}*

## Oh noes!

A customer discovered that an important entire section of his site was missing and asked us to bring it back. This was in a heavily edited site, with loads of writes each day, but we quickly located the offending transaction: someone had deleted the object in question 9 days earlier.

Undo was no longer an option, though: too many things had changed, not least the catalog. Truncating the Data.fs (removing all transactions since, including the offending one) was not only undesirable, but impossible as the site stores the data in Oracle through [RelStorage](http://wiki.zope.org/ZODB/RelStorage).

## Time travel

So, instead of permanently removing transactions, we used a handy little package to do some time traveling: [zc.beforestorage](http://pypi.python.org/pypi/zc.beforestorage).

`zc.beforestorage` does require a ZODB version 3.8 or 3.9; the customer installation is on Plone 3.0, so a newer ZODB3 egg was necessary for this operation. A small additional buildout configuration file (saved as beforestorage.cfg) helps out:

```ini
[buildout]
extends =
    buildout.cfg
eggs +=
    zc.beforestorage
    ZODB3
    zope.proxy

[versions]
ZODB3 = 3.8.1
zope.proxy = 3.4.2

[relstorage-patch]
recipe = plone.recipe.command
command = 
    cd ${buildout:eggs-directory}/ZODB3-3.8.1-py2.4-linux-i686.egg/ZODB
    curl -s http://svn.zope.de/zope.org/relstorage/tags/1.1c1/poll-invalidation-1-zodb-3-8-0.patch | patch -N -p0
    cd ${buildout:directory}
update-command = ${relstorage-patch:command}

[instance]
zope-conf-additional +=
    enable-product-installation False
```

The `relstorage-patch` section in the above code ensures that our ZODB3 egg is patched with the RelStorage additions, and the zope.proxy egg is needed because ZODB 3.8 requires a newer version. The `enable-product-installation` line is required because `zc.beforestorage` puts your ZODB in read-only mode (understandibly); the option tells Zope not to try and write product information to the ZODB.

Once buildout has been run with this configuration (with the `-c` switch), you'll still need to edit the zope.conf file for your instance, usually in parts/instance/etc/zope.conf. You need to edit the `<zodb_db main>` section to wrap the storage in the beforestorage. Ours looked something like this:

```xml
<zodb_db main>
    # Main database
    cache-size 650000
%import zc.beforestorage
%import relstorage
    <before>
    before 2008-12-08T10:29:03
    <relstorage>
        <oracle>
            dsn RELSTORAGE_DSN
            password xxxxxxxxx
            user xxxxxxxx
        </oracle>
    </relstorage>
    </before>
    mount-point /
</zodb_db>
```

Any line with the word 'before' in it is new. The timestamp we learned from the undo log, simply converted to UTC. Now, when you start the instance, you are in the past. You can't alter this past (no killing of grandfathers), but you *can* read it. And lo and behold, the deleted object is back.

## Recovery

Now that we have found the lost object, we can recover it. We simply exported it; in the ZMI, choose the Export/Import button, and save the export on the server. Remove the zc.beforestorage configuration (just run buildout with your regular buildout file), restart, import the .zexp file, done!

Note that you'll need to reindex the imported content and that any related data that lives outside of the object itself is gone. For example, its intid are gone and all relationships to it will have to be recreated etc. But you just saved your customers bacon, I'm sure they won't mind a little manual work!

*This article was originally published on [jarn.com](http://jarn.com).*
