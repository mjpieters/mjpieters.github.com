(function($, window, document) {
    $(function() {
        var gtag = window.gtag || function(command, action, config) { 
            console.log('gtag()', arguments);
            if (command == 'event' && 'event_callback' in config) {
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
                    success_selector = form.data("success"),
                    error_selector = form.data("error"),
                    error_text = $(form.data("error-text")),
                    magnificPopup = $.magnificPopup.instance;

                gtag('event', 'submit', {
                    'event_category': 'contact',
                    'event_label': 'Visitor submitted the contact form'
                });

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: href,
                    data: $(this).serialize()
                })

                .done(function(response) {
                    var selector, close_callback = null;
                    magnificPopup.close();
                    if (response.status == "success") {
                        gtag('event', 'successful', {
                            'event_category': 'contact',
                            'event_label': 'Contact form successfully sent'
                        });
                        selector = success_selector;
                        close_callback = function() {
                            form.find('input:text,input[type="email"],textarea').val('');
                            document.location.reload();
                        }
                    } else {
                        gtag('event', 'error', {
                            'event_category': 'contact',
                            'event_label': 'Contact form error response'
                        });
                        selector = error_selector;
                        error_text.text(response.message);
                    }
                    magnificPopup.open({
                        type: 'inline',
                        items: {
                            src: selector
                        },
                        callbacks: {
                            close: close_callback
                        },
                    }, 0);
                })

                .fail(function(xhr, status, error) {
                    magnificPopup.close();
                    gtag('event', 'fail', {
                        'event_category': 'contact',
                        'event_label': 'Contact form AJAX failure'
                    });
                    error_text.text(`(${xhr.status}) {status} {error}`);
                    magnificPopup.open({
                        type: 'inline',
                        items: {
                            src: error_selector
                        },
                    }, 0);
                });

            });
        }

        // Outgoing link tracking
        var hostname = document.location.hostname,
            external = $('a[href]').filter(function() { return this.hostname != hostname });

        external.click(function(e) {
            var url = $(this).attr('href'),
                newtab = window.navigator.platform.startsWith('Mac') ? e.metaKey : e.ctrlKey;
            console.log(newtab);
            e.preventDefault();
            gtag('event', 'click', {
                'event_category': 'outbound',
                'event_label': url,
                'transport_type': 'beacon',
                'event_callback': function() {
                    if (newtab) { window.open(url); }
                    else { document.location = url; }
                }
            });
        });
    });
}(window.jQuery, window, document));