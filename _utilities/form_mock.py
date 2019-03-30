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


def handle_form(response):
    print("Received:", pformat(request.form.to_dict()))
    resp = jsonify(response)
    resp.headers.add("Access-Control-Allow-Origin", "*")
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
    return "Not a valid request, forbidden", 405, {"Access-Control-Allow-Origin": "*"}
