# formcarry.com mock to test AJAX form
#
# Run with:
#
#     FLASK_ENV=development FLASK_APP=form_mock.py flask run
#
# then configure form action attribute to point to
# http://localhost:5000/{success,reject,error} routes.

from flask import Flask, jsonify, request
from pprint import pformat


app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    # formcarry.com CORS policy
    response.headers.extend({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": 
            "DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,"
            "If-Modified-Since,Cache-Control,Content-Type",
        "Access-Control-Max-Age": "1728000",
    })
    return response


def handle_form(response):
    print("Received:", pformat(request.form.to_dict()))
    resp = jsonify(response)
    return resp


@app.route("/success", methods=["POST"])
def success():
    return handle_form(
        {
            "status": "success",
            "title": "Thank you!",
            "message": "Your message has been received",
        }
    )


@app.route("/reject", methods=["POST"])
def reject():
    return handle_form(
        {
            "status": "error",
            "title": "Sorry!",
            "message": "Your message has been rejected",
        }
    )


@app.route("/error", methods=["POST"])
def error():
    handle_form({})
    return "Not a valid request, forbidden", 405
