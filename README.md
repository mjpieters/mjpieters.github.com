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

I am using [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) as the theme.

* The style is customised purely in `_config.yml`, with only `_layouts/default.html` customised to add the contactform script tag below the style scripts.
* The jekyll-redirect-to redirect.html layout was customised to add Google analytics.
