from datetime import datetime, timedelta
from flask import flash, make_response, redirect, render_template, request
from utils.firebase import auth

def page():
    if request.method=="POST":
        token = request.form.get("token")
        expires_in = timedelta(days=5)

        redirect_url = request.args.get("redirect")
        redirect_url = redirect_url if redirect_url is not None else ""

        session_cookie = auth.create_session_cookie(token, expires_in)
        response = make_response(redirect(redirect_url))
        response.set_cookie("session-cookie", session_cookie,
                            expires=datetime.now()+expires_in, httponly=True, secure=True)
        return response

    # Request method is "GET"
    try:
        auth.verify_session_cookie(request.cookies.get("session-cookie"))
    except:
        return render_template("log-in.jinja", redirect=request.args.get("redirect"))
    else:
        flash("You are already logged in")
        redirect_url = request.args.get("redirect")
        redirect_url = redirect_url if redirect_url is not None else ""
        return redirect(redirect_url)

