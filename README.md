# Zopatista's personal site

My personal site, stripped down to something I'll actually maintain.

The projects folder only exists to support legacy URLs; the contents redirect
to pypi mostly, except for the python distribution files, for which proper
redirects would otherwise be too cumbersome to support.

## Setup

Make sure `bundle` is installed:

```shell
$ sudo gem install bundle
```

then install all dependencies

```shell
$ bundle install --path .vendor/bundle
```

For more info, see the [GitHub pages documentation](https://help.github.com/articles/using-jekyll-with-pages).

## Running locally

Keep the local toolchain up-to-date with:

```shell
$ bundle update
```

Run a local server to preview posts with:

```shell
$ bundle exec jekyll serve --watch
```

## Theme setup

I am using [Alembic](https://github.com/daviddarnes/alembic) as the theme. 

* The style is customised according to the instructions; copying in `_sass/_settings.scss` and `_sass/alembic.scss` and then tweaking the settings in those.
* I extended `_includes/site-icons.svg` to add some more simple-icon SVGs.
* site-favicons.html was customised to use an SVG favicon, and to insert the jekyll-feed `{% feed_meta %}` directive.
* The jekyll-redirect-to redirect.html layout was customised to add Google analytics.

