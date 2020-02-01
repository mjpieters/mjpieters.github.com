---
title: Contact me
permalink: "/contact/"
layout: single
---

Got a question, or are looking to hire a mentor, architect or software engineer
for your project? Send me a message and I'll respond as soon as possible.

<form
  class="contactForm" action="https://formcarry.com/s/_gvUjmYMWuY"
  method="POST" accept-charset="UTF-8"
  data-success="#success-dialog"
  data-error="#error-dialog"
  data-error-text="#error-message">
  <label for="contact_name">Name
  <input type="text" id="contact_name" maxlength="false"
    required="required" name="name" autofocus="true">
    <i class="form-field-valid fas fa-check"></i></label>
  <label for="contact_email">Email address
  <input type="email" id="contact_email" maxlength="false"
    required="required" name="email">
    <i class="form-field-valid fas fa-check"></i></label>
  <label for="contact_message">Message
  <textarea minlength="20" maxlength="500" type="comment" cols="50" rows="4"
    id="contact_message" required="required"
    name="message"></textarea>
    <i class="form-field-valid fas fa-check"></i></label>
  <div id="stackoverflow_feedback" class="notice--warning">
    If you are trying to contact me about Stack Overflow moderation actions, please be aware that I <em>will only respond to these on Stack Overflow itself</em>. You can reply to moderator messages, use a custom flag on a post, use the <a href="https://stackoverflow.com/contact">Stack Overflow contact form</a> or use <a href="https://meta.stackoverflow.com/">Meta Stack Overflow</a>. 

    I ignore all such messages sent to me directly. Sorry!
  </div>
  <input type="hidden" name="_gotcha">
  <input type="hidden" id="contact_soscore" name="soscore" value="not scored">
  <input type="hidden" id="captchaResponse" name="g-recaptcha-response">
  <button type="submit" disabled="disabled">Send Message</button>
</form>

{:dialog: .form-dialog .mfp-hide}
{:success: dialog #success-dialog .notice--success}
{:error: dialog #error-dialog .notice--danger}

> ### Message sent
> 
> Thank you, I'll respond as soon as I can.
{: success}

> ### Oops?
> 
> Sorry, something seems to have gone wrong:  
>
> *error*{: #error-message}  
>
> Please close this dialog and try submitting again.
{: error}
