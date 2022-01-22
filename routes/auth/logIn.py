
from flask import session, request, flash, redirect, url_for, Blueprint, render_template, make_response
from utils.db import auth
from utils.functions import verify_id_token
from utils.routes import URI_KEYS

app = Blueprint("logIn", __name__)


@app.route("/login", methods=["POST", "GET"])
def LoginPage():
    user = verify_id_token(request.cookies.get("login-token"))
    if(user != None):
        flash("You're already signed in")
        return redirect(url_for(URI_KEYS.get("HOME")))

    if request.method == "POST":
        try:
            # Checking whether user is valid
            user = auth.verify_id_token(request.form.get("account-token"))
        except:
            flash("This account doesn't exist"),
        else:
            session["Name"] = user["name"]

            res = make_response(redirect(
                request.form.get("redirect")
                if request.form.get("redirect") != None
                else url_for(URI_KEYS.get("HOME"))
            ))
            res.set_cookie("login-token", request.form.get("account-token"))
            return res
    return render_template(
        "login.html",
        redirect=request.args.get("redirect")
        if request.args.get("redirect") != None
        else url_for(URI_KEYS.get("HOME")),

    )
