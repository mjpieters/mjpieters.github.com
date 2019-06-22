---
title: Unicode in RTF documents
date: 2012-06-06 00:00:00 +01:00
categories:
- python
tags:
- RTF
- unicode
- encoding
description: How to encode unicode codepoints in RTF documents using PyRTF.
---

*{{ page.description }}*

Some time ago I had to output some nicely formatted reports from a web application, to be usable offline by Windows users. Naturally, I used the aging but still reliable [`PyRTF` module](https://pypi.python.org/pypi/PyRTF) to generate RTF documents with headers, tables, and a consistent style.

As my application users are mostly Norwegians, however, I quickly discovered that the `PyRTF` module does not handle international characters (i.e. anything outside the ASCII codepoints), at all. There is no unicode support at all (it has been on the TODO list since forever), let alone converting unicode codepoints to whatever RTF uses to represent international characters.

Recently, a [Stack Overflow question](http://stackoverflow.com/q/10852810/100297) reminded me of how I solved this problem at the time, and clearly this question has [come](http://stackoverflow.com/q/9908647/100297) [up](https://groups.google.com/forum/?fromgroups#!topic/django-users/gZH1mnBfgoI) [before](http://osdir.com/ml/web2py/2010-03/msg01045.html). Because some approaches I've seen can actually produce incorrect or overly verbose output (including [pyrtf-ng](https://code.google.com/p/pyrtf-ng/)), I wanted to explain and expand on my solution to provide a definitive answer to the problem, and also see how my original method faired in terms of speed.

## So *does* RTF handle unicode?

Since PyRTF doesn't filter the text you add to a document at all we can just encode unicode strings ourselves. Lucky for me, the [Wikipidia entry on RTF](https://en.wikipedia.org/wiki/Rich_Text_Format) has a fairly detailed section on how [RTF handles characters outside the ASCII range](https://en.wikipedia.org/wiki/Rich_Text_Format#Character_encoding). Together with the [published RTF 1.9.1 specification](http://www.boumphrey.com/rtf/rtfspec.pdf) (PDF) there is plenty of information on how to encode unicode codepoints to RTF control sequences.

There basically are two choices:

* The `\'hh` control sequence; a backslash and single quote, followed by an 8-bit hexadecimal value. The value is interpreted as a code-point in a Windows codepage, limiting it's use. You *can* assign different codepages to different fonts, but you still cannot use the full range of unicode in a paragraph.

* The `\uN?` control sequence; backslash 'u' followed by a signed 16-bit integer value in decimal and a placeholder character (represented here by a question mark). The signed 16-bit integer number here is consistent with the RTF standard for control characters, a value between -32768 and 32767.

    This control sequence *can* properly represent unicode, at least for the U+0000 through to U+FFFF codepoints. This sequence was introduced in the 1.5 revision of the RTF spec, in 1997, so it should be widely supported. The placeholder character is meant to be used by readers that do not yet support this escape sequence and should be an ASCII character closest to the unicode codepoint.

The `\uN?` format is the easiest to produce, especially if you ignore the replacement character (just set it to '?' at all times, surely most RTF readers support the 1.5 RTF standard by now, it's been out there for 15 years).

## Encoding the slow (and incorrect) way

A quick search with Google showed me how [pyrtf-ng encodes unicode points](https://code.google.com/p/pyrtf-ng/source/browse/trunk/rtfng/Renderer.py?r=81#506):

```python
def writeUnicodeElement(self, element):
    text = ''.join(['\u%s?' % str(ord(e)) for e in element])
    self._write(text or '')
```

Unfortunately, the above snippet does a few things wrong: it uses a control code for *every* character in the unicode string, producing output that is at least 5 times as long as the input, and it doesn't produce negative numbers for codepoints over `\u7fff`:

```console?lang=python&prompt=>>>,...
>>> example = u'CJK Ideograph: \u8123'
>>> ''.join(['\u%s?' % str(ord(e)) for e in example])
u'\\u67?\\u74?\\u75?\\u32?\\u73?\\u100?\\u101?\\u111?\\u103?\\u114?\\u97?\\u112?\\u104?\\u58?\\u32?\\u33059?'
```

A recent [Stack Overflow answer](http://stackoverflow.com/a/9912561/100297) improved on this by only encoding characters over `\u007f` (decimal 127) but it still iterates over every character in the string to do so:

```console?lang=python&prompt=>>>,...
>>> ''.join(['\u%s?' % str(ord(e)) if ord(e) > 127 else e for e in example])
u'CJK Ideograph: \\u33059?'
```

This outputs unicode because codepoints < 128 are left untouched; numbers are not properly converted to signed shorts either. Here is my variation that remedies these things, and dispenses with the `str()` call:

```console?lang=python&prompt=>>>,...
>>> ''.join(['\u%i?' % (ord(e) if e < u'\u8000' else ord(e) - 65536) if (e > '\x7f' or e < '\x20' or e in u'\\{}') else str(e) for e in example])
'CJK Ideograph: \\u-32477?'
```

This feels like rather a waste to me, and must be slow as well. I wanted to see how my own solution stacks up against the character-by-character, naive implementation.

## Encoding the lazy way

While casting around for my own solution, I also looked into the Python [`codecs` module](http://docs.python.org/library/codecs.html) to come up with ideas on how to do this more efficiently. Of course, the codecs provided by that module are all implemented in C, but the `unicode_escape` codec did produce output quite close to what I needed for RTF; codepoints between `\u0020` and `\u007f` are left alone, the rest are encoded to one of the `\xhh`, `\uhhhh` or `\Uhhhhhhhh` 8, 16 or 32-bit escapes (with the exception of `\t`, `\n` and `\r`). Would there be any way to reuse this output?

Well, if you combine this with a bit of [`re.sub`](http://docs.python.org/library/re.html#re.sub) magic, you can in fact produce convincing RTF command sequences:

```console?lang=python&prompt=>>>,...
>>> import re
>>> import struct
>>> _charescape = re.compile(r'(?<!\\)\\(?:x([0-9a-fA-F]{2})|u([0-9a-fA-F]{4}))')
>>> def _replace_struct(match):
...     match = match.groups()
...     # Convert XX or XXXX hex string into 2 bytes
...     codepoint = (match[0] and '00' + match[0] or match[1]).decode('hex')
...     # Convert 2 bytes into a signed integer, insert into escape sequence
...     return '\\u%i?' % struct.unpack('!h', codepoint)
... 
>>> escaped = example.encode('unicode_escape')
>>> escaped
'CJK Ideograph: \\u8123'
>>> _charescape.sub(_replace_struct, escaped)
'CJK Ideograph: \\u-32477?'
```

Using the [`struct` module](http://docs.python.org/library/struct.html) gave me a quick means to re-interpret the hexadecimal notation as produced by the `unicode_escape` format as a signed short, but I did have to make sure there were 2 bytes at all times.

Of course, the above trick does not handle newlines, returns or tabs (`\n`, `\r` and `\t` respectively) correctly, nor does it escape existing backslashes yet, but I hoped back when that this proof of concept should operate several orders of a magnitude faster than the naive character-by-character method when dealing with mostly-ASCII input; most of the work is done in C by the `codecs` and `re` modules, after all.

So this time around I decided to time these:

```console?lang=python&prompt=>>>,...
>>> import timeit
>>> def test1(): ''.join(['\u%i?' % (ord(e) if e < u'\u8000' else ord(e) - 65536) if (e > '\x7f' or e < '\x20' or e in u'\\{}') else str(e) for e in testdocument])
... 
>>> def test2(): _charescape.sub(_replace_struct, testdocument.encode('unicode_escape'))
... 
>>> declaration = u'\
... Alle mennesker er f\xf8dt frie og med samme menneskeverd og menneskerettigheter. \
... De er utstyrt med fornuft og samvittighet og b\xf8r handle mot hverandre i brorskapets \xe5nd.'
>>> testdocument = declaration * 100
>>> timeit.timeit('test1()', 'from __main__ import test1', number=500)
5.982733964920044
>>> timeit.timeit('test2()', 'from __main__ import test2', number=500)
1.4459600448608398
```

Cool, so my hybrid encode plus regular-expression based solution looks to be around 4 times as fast, at least when it comes to simple Norwegian text with a handful of latin-1 characters, my most common case. Note however that I am not handling the RTF escape characters properly, nor are the `\n`, `\r` and `\t` characters handled correctly.

## Can I do better?

But I am actually being too clever by half (read: pretty dumb really); why did I encode to `unicode_escape` in the first place? I was still in the process of fully understanding the issues and saw a shortcut. My regular expression isn't particularly clever, I dabbled with the struct module to get my signed short values, and with all this hocus-pocus I lost sight of the goal: to escape certain classes of characters to RTF command codes.

But aren't regular expressions quite good at finding those classes all by themselves? I may as well use a decent expression that selects what needs to be encoded directly:

```console?lang=python&prompt=>>>,...
>>> _charescape_direct = re.compile(u'([\x00-\x1f\\\\{}\x80-\uffff])')
>>> def _replace_direct(match):
...     codepoint = ord(match.group(1))
...     return '\\u%s?' % (codepoint if codepoint < 32768 else codepoint - 65536)
>>> _charescape_direct.sub(_replace_direct, example).encode('ascii')
'CJK Ideograph: \\u-32477?'
>>> def test3(): _charescape_direct.sub(_replace_direct, testdocument).encode('ascii')
...
>>> timeit.timeit('test3()', 'from __main__ import test3', number=500)
0.5356400012969971
```

Suddenly we have an 10 times speed increase! Not only that, I am now also properly escaping the three whitespace characers `\n`, `\r` and `\t`, and as an added bonus, the RTF special characters `\`, `{` and `}` are now also being escaped! I call this a result, and a lesson to learn.

## Perhaps we can translate instead

We could also use a [translation table](http://docs.python.org/library/stdtypes.html#str.translate) to do my escaping for me. This is simply a dict that maps unicode codepoints to a replacement value. To create a static dict for all unicode values could be somewhat tricky, requiring either a custom `__missing__` method or loading a generated structure on import.

Before digging into clever solutions to that, I should perhaps first test the speed of a simple translation table, one that only covers codepoints up to '\u00ff', or latin-1:

```console?lang=python&prompt=>>>,...
>>> _table = {i: u"\\'{0:02x}".format(i) for i in xrange(0, 32)}
>>> _table.update({ord(c): u"\\'{0:02x}".format(ord(c)) for c in '\\{}'})
>>> _table.update({i: u"\\u{0}".format(i) for i in xrange(128, 256)})
>>> len(_table)
163
>>> timeit.timeit('testdocument.translate(_table).encode("ascii")', 'from __main__ import testdocument, _table', number=500)
2.66812801361084
```

Unfortunately, using `.translate` turns out to be slowing us down considerably. Reducing the table to just a few codepoints doesn't help either:

```console?lang=python&prompt=>>>,...
>>> _basictable = {ord(c): u"\\'{0:02x}".format(ord(c)) for c in '\n\r\t\\{}'}
>>> len(_basictable)
6
>>> timeit.timeit('testdocument.translate(_basictable)', 'from __main__ import testdocument, _basictable', number=500)
2.0113179683685303
```

So it looks like I might want to avoid using `.translate` if at all possible.

## Worst-case scenario

So far, I've compared methods by testing them against some Norwegian text, typical of many European languages with a generous helping of ASCII characters.

To get a more complete picture, I need to test these methods against a worst-case scenario, a UTF-8 encoded test set from a great set of [UTF-8 test documents](https://github.com/bits/UTF-8-Unicode-Test-Documents):

```console?lang=python&prompt=>>>,...
>>> import urllib
>>> utf8_sequence = urllib.urlopen('https://raw.github.com/bits/UTF-8-Unicode-Test-Documents/master/UTF-8_sequence_unseparated/utf8_sequence_0-0xffff_assigned_printable_unseparated.txt').read().decode('utf-8')
>>> len(utf8_sequence)
58081
>>> testdocument = utf8_sequence
>>> timeit.timeit('test1()', 'from __main__ import test1', number=10)
0.7785000801086426
>>> timeit.timeit('test3()', 'from __main__ import test3', number=10)
0.8913929462432861
```

Interesting! So in the worse-case scenario, where the vast majority (99.8%) of the text requires encoding, the character-by-character method is actually a little faster again! But this also means that for most cases, where you insert shorter text snippets into an RTF document, and where a far larger percentage of characters do not need escaping, the regular expression method will beat the character-by-character method hands down.

## So what about non-BMP Unicode?

So far I've focused only on characters within the [BMP](https://en.wikipedia.org/wiki/Unicode_plane#Basic_Multilingual_Plane). You can apparently use a [UTF-16 surrogate pair](https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B10000_to_U.2B10FFFF), at least according to Wikipedia for codepoints byond the BMP. However, the RTF specification itself is silent on this, and no endian-nes is documented anywhere that I can find. The Microsoft platform uses UTF-16-LE throughout, so perhaps RTF readers support little-endian surrogate pairs too.

However, I cannot at this time be bothered to extend my encoder to support such codepoints. On a UCS-2-compiled python there is a happy coincidence that codepoints beyond the BMP are treated mostly like UTF-16 surrogate pairs anyway, so they are sort-of supported by this method:

```console?lang=python&prompt=>>>,...
>>> beyond = u'\U00010196'
>>> _charescape_direct.sub(_replace_direct, beyond).encode('ascii')
'\\u-10240?\\u-8810?'
```

Note, however, that the first byte is -10240, or `0xd800` in unsigned hexadecimal, making this a big-endian encoded surrogate pair. Presumably on Windows that'll encode the other way around.

On a UCS-4 platform the codepoint will be ignored by the regular expression and the `.encode('ascii')` call will raise a UnicodeEncodeError instead.

I am calling this 'unsupported' and a day. Suggestions for implementing this in a neat and performant way are welcome!

## Off to PyPI we go

I am quite happy with the simple regular expression method, and prefer it over the character-by-character loop.

So I packaged up my regular expression method as a handy [module on PyPI](https://pypi.python.org/pypi/rtfunicode), complete with Python 2 and 3 support and a miniscule test suite; the [source code is available on GitHub](https://github.com/mjpieters/rtfunicode).

The module in fact registers a new codec, called `rtfunicode`, so after you import the package all you need do is use the new codec in the `.encode()` method:

```console?lang=python&prompt=>>>,...
>>> import rtfunicode
>>> declaration.encode('rtfunicode')
'Alle mennesker er f\\u248?dt frie og med samme menneskeverd og menneskerettigheter. De er utstyrt med fornuft og samvittighet og b\\u248?r handle mot hverandre i brorskapets \\u229?nd.'
```

Hopefully it comes in handy for others. Feedback is most welcome, as are patches!

*[RTF]: Rich Text Format
*[ASCII]: American Standard Code for Information Interchange
*[BMP]: Basic Multilingual Plane