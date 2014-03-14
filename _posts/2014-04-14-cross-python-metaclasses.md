---
layout: post
category: python
title: Cross-Python metaclasses
description: Using a class decorator for applying a metaclass in both Python 2 and 3
tags : [metaclass, decorator, python-2-and-3]
---
{% include JB/setup %}

*{{ page.description }}*

When you want to create using a metaclass, making it compatible with both Python 2 and 3 can be a little tricky. 

The excellent [`six` library](http://pythonhosted.org/six/) provides you with a [`six.with_metaclass()` factory function](http://pythonhosted.org/six/#six.with_metaclass) that'll generate a base class for you from a given metaclass:

{% highlight python %}
from six import with_metaclass

class Meta(type):
    pass

class Base(object):
    pass

class MyClass(with_metaclass(Meta, Base)):
    pass
{% endhighlight %}

The basic trick is that you can call any metaclass to produce a class for you, given a name, a sequence of baseclasses and the class body. `six` produces a *new*, intermediary base class for you:


{% highlight pycon %}
>>> type(MyClass)
<class '__main__.Meta'>
>>> MyClass.__mro__
(<class '__main__.MyClass'>, <class 'six.NewBase'>, <class '__main__.Base'>, <type 'object'>)
{% endhighlight %}

This can complicate your code as for some usecases you now have to account for the extra `six.NewBase` baseclass present.

Rather than creating a base class, I've come up with a class decorator that replaces any class with one produced from the metaclass, instead:

{% highlight python %}
def with_metaclass(mcls):
    def decorator(cls):
        return mcls(cls.__name__, cls.__bases__, cls.__dict__.copy())
    return decorator
{% endhighlight %}

which you'd use as:

{% highlight python %}
class Meta(type):
    pass

class Base(object):
    pass

@with_metaclass(Meta)
class MyClass(Base):
    pass
{% endhighlight %}

which results in a cleaner MRO:

{% highlight pycon %}
>>> type(MyClass)
<class '__main__.Meta'>
>>> MyClass.__mro__
(<class '__main__.MyClass'>, <class '__main__.Base'>, <type 'object'>)
{% endhighlight %}
