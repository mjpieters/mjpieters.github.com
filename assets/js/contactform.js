(function($, window, document) {
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
          selector = success_selector;
          close_callback = function() {
            document.location.reload();
          }
        } else {
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
        error_text.text(`(${xhr.status}) {status} {error}`);
        magnificPopup.open({
          type: 'inline',
          items: { src: error_selector },
        }, 0);
      });

    });
  }
}(window.jQuery, window, document));
