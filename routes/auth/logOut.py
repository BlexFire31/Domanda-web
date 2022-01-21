from flask import Blueprint, redirect, url_for, make_response

from utils.routes import URI_KEYS

app = Blueprint("logOut", __name__)


@app.route("/logOut")
def LogoutPage():

    res = make_response(redirect(url_for(URI_KEYS.get("HOME"))))
    res.delete_cookie("login-token")
    return res
