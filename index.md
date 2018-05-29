---
title: Martijn Pieters
tagline: Invisible Framework Coding Ninja
aside: true
redirect_from:
  - /tags.html
  - /pages.html
---

{% include figure.html
	image="/assets/images/mugshot.jpg"
	position="left"
	width="100" %}
Software architect, Python mentor & Consultant with a long history in serious web applications and content management.

<br>

I'm available as a mentor and freelancer via Codementor. Book me for one-on-one sessions or long term projects:
[![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/mjpieters)

{% if site.posts != empty %}
## Latest blog posts

<section class="section  typeset">
  <ul class="list  list--post">
  {% for page in site.posts limit:3 %}
      <li class="item  item--post">
        <article class="article  article--post">
          <h3><a href="{{ page.url | absolute_url }}">{{ page.title }}</a></h3>
          {% include post-meta.html %}
          {{ page.excerpt | markdownify | truncatewords: 60 }}
        </article>
      </li>
  {% endfor %}
  </ul>
</section>
{% endif %}

<script type="text/javascript" src="https://se-flair.appspot.com/35417.js"></script>
