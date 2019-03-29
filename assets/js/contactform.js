(function($, window, document) {

  $(".contactForm").submit(function(e) {
    e.preventDefault();
    var href = $(this).attr("action");
    var success_selector = $(this).data("success");
    var error_selector = $(this).data("error");
    var error_text = $($(this).data("error-text"));
    var magnificPopup = $.magnificPopup.instance;
    $.ajax({
      type: "POST",
      dataType: "json",
      url: href,
      data: $(this).serialize(),
      success: function(response) {
        var selector, close_callback = null;
        magnificPopup.close();
        if (response.status == "success") {
          selector = success_selector;
          close_callback = function() {
            $(this).find('input:text,textarea').val('');
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
      }
    });
  });

}(window.jQuery, window, document));
