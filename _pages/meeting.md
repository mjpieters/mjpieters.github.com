---
title: Online meeting
permalink: "/meeting"
excerpt: Online meeting via daily.co
indexing: false
sitemap: false
layout: single
classes: wide
---

<div class="online-meeting">
<iframe id="daily-call-frame" allowfullscreen allow="camera; microphone; autoplay"></iframe>
</div>
<script crossorigin src="https://unpkg.com/@daily-co/daily-js"></script>
<script>
((document, window) => {
  const callFrame = window.DailyIframe.wrap(
    document.getElementById('daily-call-frame')
  )
  callFrame.join({
    url: 'https://zopatista.daily.co/hello',
    showFullscreenButton: true,
    showLeaveButton: true,
  })
})(document, window)
</script>
