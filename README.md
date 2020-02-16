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

The local `bin/` directory contains binstubs for the requisite gems, and
there's a [direnv](https://github.com/zimbatm/direnv) `.envrc` file in the root
that adds that directory to your PATH when entering this directory. Please
tell direnv to allow this to work with:

```shell
$ direnv allow .
```

## Running locally

Keep the local toolchain up-to-date with:

```shell
$ bundle update
```

Run a local server to preview posts with:

```shell
$ rake serve
```

If you *don't* use direnv and have given direnv permission to run the local `.envrc` settings, then use `bin/rake`, so bundle dependencies can be found.

## Theme setup

I am using [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) as the theme.

* The style is customised purely in `_config.yml`.
* The jekyll-redirect-to `redirect.html` layout was customised to add Google analytics.

I've configured the theme both as a `remote_theme` entry (used by GitHub pages) and a local gem entry in the Gemfile. The latter will track the latest version if I use `bundle update`, and the rake file tests if the versions of this gem and the remote theme match. I can use `rake theme:update` to upgrade the theme reference if needed.

## Link integrity checking

I've set up htmlproofer to check for link rot, run periodically with:

```shell
$ rake test
```
