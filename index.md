---
layout: page
title: Martijn Pieters
tagline: Invisible Framework Coding Ninja
---
{% include JB/setup %}

Senior Software Engineer at Facebook with a long history in serious web applications and content management.

{% if site.posts != empty %}
## Blog

<ul class="posts">
  {% for post in site.posts %}
  {% if post.layout != 'redirect' %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endif %}
  {% endfor %}
</ul>
{% endif %}

![Martijn Pieters by Tesdal](https://farm2.staticflickr.com/1288/1275693477_a6a44b743e_q.jpg){: .pull-right}

## Elsewhere

 * [twitter](http://twitter.com/zopatista)
 * [google+](https://plus.google.com/102702654953333047001)
 * [linkedin](http://www.linkedin.com/in/zopatista)
 {: .span3}

 * [stackoverflow](http://stackoverflow.com/users/100297/martijn-pieters)
 * [github](https://github.com/mjpieters)
 * [keybase.io](https://keybase.io/zopatista)
 {: .span3}

 * [ohloh](https://www.ohloh.net/accounts/mjpieters)
 * [flickr](http://www.flickr.com/people/51101465@N00/)
 * [last.fm](http://www.last.fm/user/mjpieters)
 {: .span3}

<script type="text/javascript" src="http://se-flair.appspot.com/35417.js"></script>

