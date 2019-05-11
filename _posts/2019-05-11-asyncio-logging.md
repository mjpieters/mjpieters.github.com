---
title: Logging in asyncio applications
date: 2019-05-11 01:00:00 +01:00
categories:
- python
tags:
- asyncio
- logging
description: Strategy to adapt the standard library logging framework for an asyncio
  app.
---

So you are building an asyncio-based application, and like most production-quality systems, you need to log events throughout. Normally, you'd reach for the [`logging` module][logging], but the logging module uses blocking I/O when emitting records.

*Or does it?*

The framework is very flexible in how records are emitted; it is up to the [logging handlers][logging-handlers] that you install. And since Python 3.2, an interesting new handler has been included, the [`QueueHandler` class][queuehandler], which comes with a corresponding [`QueueListener` class][queuelistener]. These were originally developed to handle logging in the child processes of the [`multiprocessing` library][multiprocessing], but are otherwise perfectly usable in an asyncio context.

The `QueueListener` class starts its own thread to watch a queue and send records to handlers it manages, so it will not affect the asyncio loop. The `QueueHandler` handler implementation simply puts records into the queue you specify, after a minimal clean-up operation to ensure records can be serialised easily. This makes this handler entirely non-blocking.

## Move existing handlers to `QueueListener`

My strategy is simply to move all root handlers to a `QueueListener` object before the main asyncio loop starts, and placing a `QueueHandler` object in their place. From there on out, all blocking operations in handlers are handled in a separate thread, freeing the asyncio loop from having to wait for log records to written out to files or network sockets.

I do customise the `QueueHandler` class a little, but only minimally so: there is no need to prepare records that go into a local, in-process queue, we can skip that process and minimise the cost of logging further:

```python
import logging
import logging.handlers
try:
    # Python 3.7 and newer, fast reentrant implementation
    # witohut task tracking (not needed for that when logging)
    from queue import SimpleQueue as Queue
except ImportError:
    from queue import Queue
from typing import List


class LocalQueueHandler(logging.handlers.QueueHandler):
    def emit(self, record: logging.LogRecord) -> None:
        # Removed the call to self.prepare()
        try:
            self.enqueue(record)
        except Exception:
            self.handleError(record)


def setup_logging_queue() -> None:
    """Move log handlers to a separate thread.

    Replace handlers on the root logger with a LocalQueueHandler,
    and start a logging.QueueListener holding the original
    handlers.

    """
    queue = Queue()
    root = logging.getLogger()

    handlers: List[logging.Handler] = []

    handler = LocalQueueHandler(queue)
    root.addHandler(handler)
    for h in root.handlers[:]:
        if h is not handler:
            root.removeHandler(h)
            handlers.append(h)

    listener = logging.handlers.QueueListener(
        queue, *handlers, respect_handler_level=True
    )
    listener.start()
```

You could, of course, configure the `logging` module to use the queue handler to begin with, but I find the above pattern to work better when also using the [`logging.config`][logging-config] to handle handler configuration elsewhere. The above can then simply take an already-configured system and make it suitable for an asyncio environment.

[logging]: https://docs.python.org/3/library/logging.html
[logging-handlers]: https://docs.python.org/3/library/logging.handlers.html
[queuehandler]: https://docs.python.org/3/library/logging.handlers.html#queuehandler
[queuelistener]: https://docs.python.org/3/library/logging.handlers.html#queuelistener
[multiprocessing]: https://docs.python.org/3/library/multiprocessing.html
[logging-config]: https://docs.python.org/3/library/logging.config.html