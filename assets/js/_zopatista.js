// @ts-check
/*!
 * Zopatista.com custom JS
 * (c) 2020 Martijn Pieters (mj@zopatista.com)
 * All rights reserved
 */
/**
 * @typedef {import('@daily-co/daily-js')} daily
 */
/** Absolute minimum type def for MagnificPopup.open config options
 * @typedef {Object} MagnificPopupConfig
 * @property {'inline'} type
 * @property {Object} items
 * @property {Object} callbacks
 */
/**
 * @typedef {Object} MagnificPopup
 * @property {(a: MagnificPopupConfig, index: number) => void} open
 * @property {() => void} close
 * 
*/
(
/**
 * @param {Window} window
 * @param {Document} document
 */
(window, document) => {

  // utilities

  /**
   * debounce: only call an event callback once repeated events have subsided long enough
   * 
   * @template {(this: any, ...args: any) => any} F
   * @param {F} fn 
   * @param {number} wait 
   * @returns {(...args: Parameters<F>) => void}
   */
  function debounce(fn, wait = 20) {
    /** @type {ReturnType<typeof setTimeout>} */
    let timeoutId
    /**
     * @this {ThisParameterType<fn>}
     * @param {Parameters<fn>[]} args
     * @returns {void}
     */
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), wait)
    }
  }
  
  /** ready; promise that resolves when the DOM is ready
   *
   * @type {Promise<void>} 
   */
  const ready = new Promise(resolve => {
    if (document.readyState !== "loading") return resolve()
    document.addEventListener('DOMContentLoaded', () => resolve())
  })
  
  const reCaptchaSiteKey = '6LfT7JoUAAAAAOJeXkJp-_YhnKEvnz3DhEM-ni2n'
  const reCaptchaTokenMaxAge = 2 * 60 * 1000 // ms, two minutes, see https://developers.google.com/recaptcha/docs/verify
  // The Doherty Threshold, https://lawsofux.com/doherty-threshold, via https://ux.stackexchange.com/q/95336
  const dohertyThreshold = 400 // ms

  const soPatterns = [
    // case insensitive
    new RegExp(
      '\\b(?:' +
      [
        'stackoverflow\\.com',
        'stackoverflow',
        'stack\\s+overflow',
        'on\\s+stack',
        'deleted',
        'my\\s+(?:answer|question|comment|post|response)s?',
        'reputations?',
        'upvotes',
        'reconsider\\s+your\\s+actions',
        'review\\s+(?:my\\s+)?ban',
        'who\\s+do\\s+you\\s+think\\s+you\\s+are'
      ].join('|') +
      ')\\b',
      'ig'
    ),
    // case sensitive
    new RegExp(
      '\\b(?:' +
      [
        'on\\s+SO'
      ].join('|') +
      ')\\b',
      'g'
    )
  ]
  const nonSoPatterns = [
    new RegExp(
      '\\b(?:' +
      [
        'for\\s+freelance\\s+work',
        '(?:you\\s+)?are\\s+available',
        'be\\s+available',
        '(?:your\\s+)?hourly\\s+rate',
        'interview\\s+you',
        'python\\s+training',
        'partnering\\s+with'
      ].join('|') +
      ')\\b',
      'ig'
    )
  ]
  const soScoreThreshold = 2

  /**
   * @param {string} text 
   * @param {RegExp[]} patterns 
   * @returns {number}
   */
  const countMatches = (text, patterns) => patterns.reduce((sum, pat) => sum + (text.match(pat) || []).length, 0)

  // contact form handler
  /**
   * 
   * @param {HTMLFormElement} form 
   * @param {Gtag.Gtag} gtag 
   */
  const handleForm = (form, gtag) => {
    /** @type {HTMLInputElement} */
    const captchaResponse = form.querySelector('#captchaResponse')
    /** @type {HTMLButtonElement} */
    const submitButton = form.querySelector('button[type="submit"]')
    /** @type {HTMLInputElement} */
    const nameField = form.querySelector('#contact_name')
    /** @type {HTMLInputElement} */
    const emailField = form.querySelector('#contact_email')
    /** @type {HTMLTextAreaElement} */
    const messageArea = form.querySelector('#contact_message')
    /** @type {HTMLDivElement} */
    const soFeedback = form.querySelector('#stackoverflow_feedback')
    /** @type {HTMLInputElement} */
    const soScore = form.querySelector('#contact_soscore')
    let soFeedbackShown = false

    /** @param {string} action */
    const setReCaptcha = (action) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(reCaptchaSiteKey, { action })
        .then(token => { captchaResponse.value = token })
      })
    }
    setReCaptcha('contactform_load')
    // tokens are valid for a limited amount of time, so we want to refresh them periodically
    // in case someone takes longer between page load and submit. 90% of the maximum is a good
    // refresh point.
    window.setInterval(setReCaptcha, reCaptchaTokenMaxAge * 0.9, 'contactform_token_refresh')

    // check for subjects I probably will ignore; these don't block submitting but give feedback on
    // where to go instead.
    messageArea.addEventListener('input', debounce(() => {
      const msg = messageArea.value
      const score = countMatches(msg, soPatterns) - countMatches(msg, nonSoPatterns)
      soScore.value = score.toString()
      if (score < soScoreThreshold) {
        // given that the input event handler has been debounced at 400ms and 'fast'
        // switches states in 200ms, the .stop() calls are probably entirely redundant.
        // Still, it's probably good practice.
        if (soFeedbackShown) {
          soFeedback.classList.remove('show')
          gtag('event', 'so_feedback_hidden', {
            event_category: 'contact',
            event_label: [nameField.value, emailField.value, msg].join('|'),
            value: score
          })
        }
        soFeedbackShown = false
      } else {
        if (!soFeedbackShown) {
          soFeedback.classList.add('show')
          gtag('event', 'so_feedback_shown', {
            event_category: 'contact',
            event_label: [nameField.value, emailField.value, msg].join('|'),
            value: score
          })
        }
        soFeedbackShown = true
      }
    }, dohertyThreshold))

    // the submit button is only enabled if the form is valid
    form.addEventListener('input', (/** @type {Event & { target: Element }} */e) => {
      if (e.target.matches('input,textarea')) submitButton.toggleAttribute('disabled', !form.checkValidity())
    })

    /** show a counter on fields with a max length; only shows up when 50% of the length has been consumed
     * @param {Event & { target: HTMLInputElement | HTMLTextAreaElement }} e
     */
    const countHandler = (e) => {
      const elem = e.target
      const maxlen = parseInt(elem.getAttribute('maxlength'), 10)
      if (isNaN(maxlen)) {
        elem.removeEventListener('input', countHandler)
        return
      }
      const len = elem.value.length
      const selector = `label[for="${elem.id}"].message-count`
      /** @type {Element | null} */
      let countSpan = elem.parentElement.querySelector(selector)

      if (len < (maxlen / 2)) {
        if (countSpan) countSpan.remove()
        return
      }

      if (countSpan === null) {
        elem.insertAdjacentHTML(
          'beforebegin',
          // aria-hidden because the counter is updating too frequently to be bearable for
          // screen readers.
          `<label class="message-count" for="${elem.id}" aria-hidden="true">
            <span class="counter">${len}</span>/<span class="maxlength">${maxlen}</span>
          </label>
        `)
        countSpan = elem.previousElementSibling
      } else {
        /** @type {HTMLSpanElement} */
        const inner = countSpan.querySelector('.counter')
        inner.innerText = len.toString()
      }
      countSpan.classList.toggle('near-limit', len > (maxlen * 0.9))
    }
    form.querySelectorAll('input[maxlength],textarea[maxlength]').forEach(
      (elem) => elem.addEventListener('input', countHandler)
    )

    form.addEventListener('submit', e => {
      e.preventDefault()

      const href = form.action
      const email = emailField.value || '<no email set>'
      const successSelector = form.dataset.success
      const errorSelector = form.dataset.error
      /** @type {HTMLElement} */
      const errorText = document.querySelector(form.dataset.errorText)
      /** @type {MagnificPopup} */
      const magnificPopup = window['jQuery'].magnificPopup.instance

      gtag('event', 'submit', {
        event_category: 'contact',
        event_label: email,
        value: parseInt(soScore.value, 10)
      })

      /**
       * @param {string} errorMessage
       * @param {'exception'|'fail'} type
       */
      const errHandler = (errorMessage, type = 'fail') => {
        magnificPopup.close()

        let gtagEventSent = false
        gtag('event', type, {
          event_category: 'contact',
          event_label: email,
          description: `Contact form submission error: ${errorMessage}`,
          fatal: false,
          event_callback: () => { gtagEventSent = true }
        })
        const closeCallback = () => {
          if (!gtagEventSent) {
            // wait another 100ms before actually closing
            gtagEventSent = true
            window.setTimeout(closeCallback, 100)
            return
          }
          setReCaptcha('contactform_error_retry')
        }

        errorText.innerHTML = errorMessage
        magnificPopup.open({
          type: 'inline',
          items: { src: errorSelector },
          callbacks: { close: closeCallback }
        }, 0)
      }

      /**
       * @typedef {Object} FormCarryResponse
       * @property {number} code
       * @property {string} status
       * @property {string} title
       * @property {string[]} message
       */

      /** @param {FormCarryResponse} data */
      const formatFCResponseError = (data) => {
        const message = data.message.map((line) => `<p>${line}</p>`).join('\n')
        return `<h4>${data.title}</h4><p>(${data.code}) ${data.status}</p>${message}`
      }


      fetch(href, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
      .then((response) => {
        if (response.ok) return response.json()
        
        let usedResponseBody = false
        return response.json()
          .then((data) => {
            usedResponseBody = true
            throw new Error(formatFCResponseError(data))
          }).catch((err) => {
            if (usedResponseBody) throw err
            throw new Error(`Unexpected form server response: ${response.status} ${response.statusText}`)
          })
      })
      .then((/** @type {FormCarryResponse} */data) => {
          magnificPopup.close()
          if (data.code !== 200) {
            errHandler(formatFCResponseError(data))
            return
          }

          let gtagEventSent = false
          gtag('event', 'successful', {
            event_category: 'contact',
            event_label: email,
            value: parseInt(soScore.value, 10),
            event_callback: () => { gtagEventSent = true }
          })
          const closeCallback = () => {
            if (!gtagEventSent) {
              // wait another 100ms before actually closing
              gtagEventSent = true
              window.setTimeout(closeCallback, 100)
              return
            }
            document.location = '/'
          }
          magnificPopup.open({
            type: 'inline',
            items: { src: successSelector },
            callbacks: { close: closeCallback }
          }, 0)
        })
        .catch((error) => {
          if (error instanceof DOMException) { // user aborted the request
            return
          } else if (error instanceof TypeError) { // never got to contact a server
            errHandler('Failed to contact the form server (network error)', 'exception')
          } else if (error instanceof SyntaxError) { // server returned invalid JSON
            errHandler('Failed to contact the form server (invalid response)', 'exception')
          } else {
            errHandler(error.message, 'exception')
          }
        })
    })
  }
  
  ready.then(() => {
    /** @type {Gtag.Gtag} */
    const gtag = window['gtag'] || ((command, action, params) => {
      console.log('gtag()', command, action, params)
      if (command === 'event' && 'event_callback' in params) params.event_callback()
    })

    // Capture JS errors
    const origOnerror = window.onerror
    window.onerror = function (msg, file, line, col, error) {
      if (typeof StackTrace !== 'undefined') {
        StackTrace.fromError(error).then(stack => {
          const descr = { msg, file, line, col, stack }
          gtag('event', 'exception', { description: JSON.stringify(descr), fatal: true })
        }).catch(() => {
          try {
            gtag('event', 'exception', {
              description: `Failure to create stacktrace; ${file}:${line}:${col} ${msg} (${error})`,
              fatal: true
            })
          } catch (e) {
            console.log('Giving up on all error handling, bailing out', e, [msg, file, line, col, error])
          }
        })
      }
      if (typeof origOnerror === 'function') origOnerror(msg, file, line, col, error)
    }
  
    // Contact form handling
    /** @type {HTMLFormElement | null} */
    const contactForm = document.querySelector('.contactForm')
    if (contactForm !== null) handleForm(contactForm, gtag)

    // Outgoing link tracking
    const hostname = document.location.hostname
    /** @type {HTMLAnchorElement[]} */
    const external = Array.from(/** @type {NodeListOf<HTMLAnchorElement>} */(document.querySelectorAll('a[href]')))
      .filter((a) => a.hostname !== hostname)

    external.forEach((a) => a.addEventListener('click', (/** @type {MouseEvent & { target: HTMLAnchorElement }} */e) => {
      // Record outbound links as events, but only if it'll update this window.
      // detection based on https://github.com/googleanalytics/autotrack/blob/master/lib/plugins/outbound-link-tracker.js
      const url = /** @type {HTMLAnchorElement} */(e.target.closest('a[href]')).href
      const newtab = (e.target.target === '_blank') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button > 1)
      const callback = newtab ? () => {} : () => { document.location = url }
      if (!newtab) { e.preventDefault() }
      window.setTimeout(callback, 1000)
      gtag('event', 'click', {
        event_category: 'outbound',
        event_label: url,
        transport_type: 'beacon',
        event_callback: callback
      })
    }))

    /** Minimal JWT parsing
     * @param {string} t
     * @returns {{ r?: string }}
    */
    const parseToken = (t) => {
      try { return JSON.parse(atob(t.split('.')[1])) }
      catch (e) { return {} }
    }

    // Meeting page
    const meetingDiv = document.querySelector('.online-meeting')
    if (meetingDiv !== null) {
      const callFrame = /** @type {import('@daily-co/daily-js').DailyCallFactory} */(window['DailyIframe']).wrap(
        /** @type {HTMLIFrameElement} */(document.getElementById('daily-call-frame'))
      )
      const params = new URLSearchParams(document.location.search)
      const token = params.get('t')
      const tokenData = token ? parseToken(token) : {}
      const room = tokenData.r || params.get('r') || 'meeting'
      const meetingContext = { room: room, token: token, tokenData: tokenData }

      /**
       * @typedef {import('@daily-co/daily-js').DailyEventObjectNetworkQualityEvent} DailyEventObjectNetworkQualityEvent
       * @typedef {import('@daily-co/daily-js').DailyEventObjectNoPayload} DailyEventObjectNoPayload
       * @typedef {import('@daily-co/daily-js').DailyEventObjectParticipant} DailyEventObjectParticipant
       * @typedef {import('@daily-co/daily-js').DailyEventObjectParticipantLeft} DailyEventObjectParticipantLeft
       * @typedef {import('@daily-co/daily-js').DailyEventObjectParticipants} DailyEventObjectParticipants
       * @param {DailyEventObjectNetworkQualityEvent|DailyEventObjectNoPayload|DailyEventObjectParticipant|DailyEventObjectParticipantLeft|DailyEventObjectParticipants} e
       */
      const trackEvent = (e) => {
        gtag('event', 'meeting', {
          event_category: e.action,
          event_label: JSON.stringify({
            ...meetingContext,
            event: e
          })
        })
      }
      const joinConfig = {
        url: `https://zopatista.daily.co/${room}`,
        showFullscreenButton: true,
        showLeaveButton: true
      }
      if (token) joinConfig.token = token
      callFrame.join(joinConfig)
      callFrame
        .on('joining-meeting', trackEvent)
        .on('joined-meeting', trackEvent)
        .on('participant-joined', trackEvent)
        .on('participant-updated', trackEvent)
        .on('participant-left', trackEvent)
        .on('network-quality-change', trackEvent)
        .on('left-meeting', (e) => {
          gtag('event', 'meeting', {
            event_category: 'left-meeting',
            event_label: JSON.stringify({
              ...meetingContext,
              event: e,
              participants: callFrame.participants()
            }),
            event_callback: () => { document.location = '/' }
          })
        })
        .on('error', (e) => {
          gtag('event', 'exception', {
            description: JSON.stringify({
              ...meetingContext,
              error: e
            }),
            fatal: false
          })
        })
    }
  })
})(window, document)
