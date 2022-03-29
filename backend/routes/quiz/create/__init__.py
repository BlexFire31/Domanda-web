from flask import render_template, request
from utils.get_user_from_token import get_user_from_token


@get_user_from_token
def page(user):
    return render_template("create.jinja", user=user, session_cookie=request.cookies.get("session-cookie"))
