(function($, window, document) {
    $(function() {
        var gtag = window.gtag || function(command, action, params) {
            console.log('gtag()', arguments);
            if (command == 'event' && 'event_callback' in params) {
                config['event_callback']();
            }
        };

        // Contact form handling
        if ($(".contactForm").length) {
            grecaptcha.ready(function() {
                grecaptcha.execute("6LfT7JoUAAAAAOJeXkJp-_YhnKEvnz3DhEM-ni2n", {
                    action: "contactform"
                }).then(function(token) {
                    $(".contactForm #captchaResponse").val(token);
                });

            });

            $(".contactForm").submit(function(e) {
                e.preventDefault();

                var form = $(this),
                    href = form.attr("action"),
                    email = form.find('#contact_email').val() || '<no email set>',
                    success_selector = form.data("success"),
                    error_selector = form.data("error"),
                    error_text = $(form.data("error-text")),
                    magnificPopup = $.magnificPopup.instance;

                gtag('event', 'submit', {
                    'event_category': 'contact',
                    'event_label': email
                });

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: href,
                    data: $(this).serialize()
                })

                .done(function(response) {
                    var selector,
                        close_callback = null,
                        gtag_event_sent = false,
                        gtag_action = 'successful';

                    magnificPopup.close();

                    if (response.status == "success") {
                        selector = success_selector;
                        close_callback = function() {
                            if (!gtag_event_sent) {
                                // wait another 100ms before actually closing
                                gtag_event_sent = true;
                                window.setTimeout(close_callback, 100);
                            }
                            document.location = '/';
                        }
                    } else {
                        gtag_action = 'error'
                        selector = error_selector;
                        close_callback = function() {
                            if (!gtag_event_sent) {
                                // wait another 100ms before actually closing
                                gtag_event_sent = true;
                                window.setTimeout(close_callback, 100);
                            }
                            document.location.reload();
                        }
                        error_text.text(response.message);
                        gtag('event', 'exception', {
                            description: `Contact form submission error: ${JSON.stringify(response)}`,
                            fatal: false,
                        });
                    }
                    gtag('event', gtag_action, {
                        'event_category': 'contact',
                        'event_label': email,
                        'event_callback': function() { gtag_event_sent = true; },
                    });
                    magnificPopup.open({
                        type: 'inline',
                        items: { src: selector },
                        callbacks: { close: close_callback },
                    }, 0);
                })

                .fail(function(xhr, status, error) {
                    var error_message = `(${xhr.status}) ${status} ${error}`,
                        gtag_event_sent = false,
                        close_callback;

                    magnificPopup.close();

                    gtag('event', 'fail', {
                        'event_category': 'contact',
                        'event_label': email,
                        'event_callback': function() { gtag_event_sent = true; },
                    });
                    gtag('event', 'exception', {
                        description: `Contact form submission failure: ${error_message}`,
                        fatal: true,
                    });

                    close_callback = function() {
                        if (!gtag_event_sent) {
                            // wait another 100ms before actually closing
                            gtag_event_sent = true;
                            window.setTimeout(close_callback, 100);
                        }
                        document.location.reload();
                    }

                    error_text.text(error_message);
                    magnificPopup.open({
                        type: 'inline',
                        items: { src: error_selector },
                        callbacks: { close: close_callback }
                    }, 0);
                });
            });
        }

        // Outgoing link tracking
        var hostname = document.location.hostname,
            external = $('a[href]').filter(function() { return this.hostname != hostname });

        external.click(function(e) {
            // Record outbound links as events, but only if it'll update this window.
            // detection based on https://github.com/googleanalytics/autotrack/blob/master/lib/plugins/outbound-link-tracker.js
            var url = $(this).attr('href'),
                newtab = $(this).attr('target') === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.which > 1,
                callback = newtab ? function() {} : function() { document.location = url; };
            if (!newtab) { e.preventDefault(); }
            window.setTimeout(callback, 1000);
            gtag('event', 'click', {
                'event_category': 'outbound',
                'event_label': url,
                'transport_type': 'beacon',
                'event_callback': callback,
            });
        });
    });
}(window.jQuery, window, document));