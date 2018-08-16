---
title: Easy in-place file rewriting
date: 2013-11-26 00:00:00 +00:00
categories:
- python
tags:
- in-place
- contextmanager
- file-io
layout: post
description: Using a context manager to allow painless rewriting of files
---

*{{ page.description }}*

Whenever you need to process a file in-place, transforming the contents and writing it out again in the same location, you can reach out for the [`fileinput` module](http://docs.python.org/2/library/fileinput.html) and use its `inplace` option:

```python
import fileinput

for line in fileinput.input(somefilename, inplace=True):
    line = 'additional information ' + line.rstrip('\n')
    print line
```

There are a few problems with the `fileinput` module, however. My biggest nitpick with the module is that it has an API that relies heavily on globals; `fileinput.input()` creates a global [`fileinput.FileInput()` object](http://docs.python.org/2/library/fileinput.html#fileinput.FileInput), which other functions in the module then access. You can of course ignore all that and reach straight for the `fileinput.FileInput()` constructor, but `fileinput.input()` is presented as the main API entrypoint.

The other is that the in-place modus hijacks `sys.stdout` as the means to write back to the replacement file. Obstensibly this is to make it easy to use a `print` statement, but then you have to remember to remove the newline from the lines read from the old file.

Last, but not least, the [`fileinput` version in the Python 3 standard library](http://docs.python.org/3/library/fileinput.html) does not support specifying an encoding, error mode or newline handling. You can open the input file in binary mode, but output is always handled in text mode. This greatly diminishes the usefulness of this library. 

So I wrote my own replacement, using the excellent [`@contextlib.contextmanager` decorator](http://docs.python.org/2/library/contextlib.html#contextlib.contextmanager). This version works on both Python 2 and 3, relying on [`io.open()`](http://docs.python.org/2/library/io.html#io.open) to remain compatible between Python versions:

```python
from contextlib import contextmanager
import io
import os


@contextmanager
def inplace(filename, mode='r', buffering=-1, encoding=None, errors=None,
            newline=None, backup_extension=None):
    """Allow for a file to be replaced with new content.

    yields a tuple of (readable, writable) file objects, where writable
    replaces readable.

    If an exception occurs, the old file is restored, removing the
    written data.

    mode should *not* use 'w', 'a' or '+'; only read-only-modes are supported.

    """

    # move existing file to backup, create new file with same permissions
    # borrowed extensively from the fileinput module
    if set(mode).intersection('wa+'):
        raise ValueError('Only read-only file modes can be used')

    backupfilename = filename + (backup_extension or os.extsep + 'bak')
    try:
        os.unlink(backupfilename)
    except os.error:
        pass
    os.rename(filename, backupfilename)
    readable = io.open(backupfilename, mode, buffering=buffering,
                       encoding=encoding, errors=errors, newline=newline)
    try:
        perm = os.fstat(readable.fileno()).st_mode
    except OSError:
        writable = open(filename, 'w' + mode.replace('r', ''),
                        buffering=buffering, encoding=encoding, errors=errors,
                        newline=newline)
    else:
        os_mode = os.O_CREAT | os.O_WRONLY | os.O_TRUNC
        if hasattr(os, 'O_BINARY'):
            os_mode |= os.O_BINARY
        fd = os.open(filename, os_mode, perm)
        writable = io.open(fd, "w" + mode.replace('r', ''), buffering=buffering,
                           encoding=encoding, errors=errors, newline=newline)
        try:
            if hasattr(os, 'chmod'):
                os.chmod(filename, perm)
        except OSError:
            pass
    try:
        yield readable, writable
    except Exception:
        # move backup back
        try:
            os.unlink(filename)
        except os.error:
            pass
        os.rename(backupfilename, filename)
        raise
    finally:
        readable.close()
        writable.close()
        try:
            os.unlink(backupfilename)
        except os.error:
            pass
```

This context manager deliberately focuses on just *one* file, and ignores `sys.stdin`, unlike the `fileinput` module. It is aimed squarly at just replacing a file in-place.

Usage example, in Python 2, with the CSV module:

```python
import csv

with inplace(csvfilename, 'rb') as (infh, outfh):
    reader = csv.reader(infh)
    writer = csv.writer(outfh)

    for row in reader:
        row += ['new', 'columns']
        writer.writerow(row)
```

and the Python 3 version:

```python
import csv

with inplace(csvfilename, 'r', newline='') as (infh, outfh):
    reader = csv.reader(infh)
    writer = csv.writer(outfh)

    for row in reader:
        row += ['new', 'columns']
        writer.writerow(row)
```
