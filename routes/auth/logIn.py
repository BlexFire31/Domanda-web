
from flask import session, request, flash, redirect, url_for, Blueprint, render_template
from utils.db import auth
from utils.routes import URI_KEYS

app = Blueprint("logIn", __name__)


@app.route("/login", methods=["POST", "GET"])
def LoginPage():
    if(session.get("Uid") != None):
        flash("You're already signed in")
        return redirect(url_for(URI_KEYS.get("HOME")))

    if request.method == "POST":
        try:
            # Checking whether user is valid
            auth.get_user(request.form.get("account-uid"))
        except:
            flash("This account doesn't exist")
        else:
            session["Email"] = request.form.get("account-email")
            session["Name"] = request.form.get("account-name").strip()
            session["Photourl"] = request.form.get("account-photo")
            session["Uid"] = request.form.get("account-uid")

            return redirect(
                request.form.get("redirect")
                if request.form.get("redirect") != None
                else url_for(URI_KEYS.get("HOME"))
            )
    return render_template(
        "login.html",
        redirect=request.args.get("redirect")
        if request.args.get("redirect") != None
        else url_for(URI_KEYS.get("HOME"))
    )
