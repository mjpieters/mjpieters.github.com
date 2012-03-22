---
layout: page
title: Martijn Pieters
tagline: Invisible Framework Coding Ninja
---
{% include JB/setup %}

Senior Open Software Engineer with a long history in serious web applications and content management.

{% if site.posts != empty %}
## Blog

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>
{% endif %}

![Martijn Pieters by Tesdal](https://farm2.staticflickr.com/1288/1275693477_a6a44b743e_q.jpg){: .pull-right}

## Elsewhere

 * [google+](https://plus.google.com/102702654953333047001)
 * [github](https://github.com/mjpieters)
 * [twitter](http://twitter.com/zopatista)
 * [linkedin](http://www.linkedin.com/in/zopatista)
 {: .span3}

 * [flickr](http://www.flickr.com/people/51101465@N00/)
 * [stackoverflow](http://stackoverflow.com/users/100297/martijn-pieters)
 * [last.fm](http://www.last.fm/user/mjpieters)
 * [ohloh](https://www.ohloh.net/accounts/mjpieters)
 {: .span3}
