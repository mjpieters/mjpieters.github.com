(function($, window, document) {
  if ($(".contactForm").length) {
    var gtag = window.gtag || function() {};

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
          items: { src: selector },
          callbacks: { close: close_callback },
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
          items: { src: error_selector },
        }, 0);
      });

    });
  }
}(window.jQuery, window, document));
