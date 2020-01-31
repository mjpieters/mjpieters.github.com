/* global grecaptcha */
(($, window, document) => {
  const reCaptchaSiteKey = '6LfT7JoUAAAAAOJeXkJp-_YhnKEvnz3DhEM-ni2n'
  const reCaptchaTokenMaxAge = 2 * 60 * 1000 // ms, two minutes, see https://developers.google.com/recaptcha/docs/verify

  $(() => {
    const gtag = window.gtag || ((command, action, params) => {
      console.log('gtag()', command, action, params)
      if (command === 'event' && 'event_callback' in params) {
        params.event_callback()
      }
    })

    // Contact form handling
    if ($('.contactForm').length) {
      const setReCaptcha = (action) => {
        grecaptcha.ready(() => {
          grecaptcha.execute(reCaptchaSiteKey, {
            action: action
          }).then((token) => {
            $('.contactForm #captchaResponse').val(token)
          })
        })
      }
      setReCaptcha('contactform_load')
      // tokens are valid for a limited amount of time, so we want to refresh them periodically
      // in case someone takes longer between page load and submit. 90% of the maximum is a good
      // refresh point.
      window.setInterval(setReCaptcha, reCaptchaTokenMaxAge * 0.9, 'contactform_token_refresh')

      $('.contactForm').submit((e) => {
        e.preventDefault()

        const form = $(e.target)
        const href = form.attr('action')
        const email = form.find('#contact_email').val() || '<no email set>'
        const successSelector = form.data('success')
        const errorSelector = form.data('error')
        const errorText = $(form.data('error-text'))
        const magnificPopup = $.magnificPopup.instance

        gtag('event', 'submit', {
          event_category: 'contact',
          event_label: email
        })

        $.ajax({
          type: 'POST',
          dataType: 'json',
          url: href,
          data: form.serialize()
        })
          .done((response) => {
            let selector
            let closeCallback = null
            let gtagEventSent = false
            let gtagAction = 'successful'

            magnificPopup.close()

            if (response.status === 'success') {
              selector = successSelector
              closeCallback = () => {
                if (!gtagEventSent) {
                  // wait another 100ms before actually closing
                  gtagEventSent = true
                  window.setTimeout(closeCallback, 100)
                }
                document.location = '/'
              }
            } else {
              gtagAction = 'error'
              selector = errorSelector
              closeCallback = () => {
                if (!gtagEventSent) {
                  // wait another 100ms before actually closing
                  gtagEventSent = true
                  window.setTimeout(closeCallback, 100)
                }
                setReCaptcha('contactform_error_retry')
              }
              errorText.text(response.message)
              gtag('event', 'exception', {
                description: `Contact form submission error: ${JSON.stringify(response)}`,
                fatal: false
              })
            }
            gtag('event', gtagAction, {
              event_category: 'contact',
              event_label: email,
              event_callback: () => { gtagEventSent = true }
            })
            magnificPopup.open({
              type: 'inline',
              items: { src: selector },
              callbacks: { close: closeCallback }
            }, 0)
          })

          .fail((xhr, status, error) => {
            var errorMessage
            var gtagEventSent = false
            var closeCallback

            if (xhr.readyState < 2) { // never got to contact a server
              errorMessage = 'Failed to contact the form server (network error)'
            } else {
              errorMessage = `(${xhr.status}) ${status} ${error}`
              if (xhr.responseText) {
                errorMessage = `<p>${errorMessage}</p><p>${xhr.responseText}</p>`
              }
            }

            magnificPopup.close()

            gtag('event', 'fail', {
              event_category: 'contact',
              event_label: email,
              event_callback: () => { gtagEventSent = true }
            })
            gtag('event', 'exception', {
              description: `Contact form submission failure: ${errorMessage}`,
              fatal: true
            })

            closeCallback = () => {
              if (!gtagEventSent) {
                // wait another 100ms before actually closing
                gtagEventSent = true
                window.setTimeout(closeCallback, 100)
              }
              setReCaptcha('contactform_error_retry')
            }

            errorText.html(errorMessage)
            magnificPopup.open({
              type: 'inline',
              items: { src: errorSelector },
              callbacks: { close: closeCallback }
            }, 0)
          })
      })
    }

    // Outgoing link tracking
    const hostname = document.location.hostname
    const external = $('a[href]').filter((_, a) => { return a.hostname !== hostname })

    external.click((e) => {
      // Record outbound links as events, but only if it'll update this window.
      // detection based on https://github.com/googleanalytics/autotrack/blob/master/lib/plugins/outbound-link-tracker.js
      const url = $(e.target).attr('href')
      const newtab = $(e.target).attr('target') === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.which > 1
      const callback = newtab ? () => {} : () => { document.location = url }
      if (!newtab) { e.preventDefault() }
      window.setTimeout(callback, 1000)
      gtag('event', 'click', {
        event_category: 'outbound',
        event_label: url,
        transport_type: 'beacon',
        event_callback: callback
      })
    })
  })
})(window.jQuery, window, document)
