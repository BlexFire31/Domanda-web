
import os
from flask import abort, flash, redirect, render_template, request, url_for
from utils.get_user_from_token import get_user_from_token
from utils.has_code import has_code
from requests import post


@get_user_from_token
@has_code(property_name="code", redirect_endpoint="routes.quiz")
def page(user, code):
    session_cookie = request.cookies.get("session-cookie")

    data = {
        "session-cookie":   session_cookie
    }
    response = post(os.environ.get("API_URL") +
                    f"/quiz/{code}/access-types-with-exists", data)
    if not response.ok:
        return abort(response.status_code)

    result: dict = response.json().get("result")
    exists: bool = result.get("exists")
    access_types: list[str] = result.get("access-types")

    if not exists:
        flash("This quiz does not exist")
        return redirect(url_for("routes.quiz"))
    if access_types is None:
        flash("You do not access to this quiz")
        return redirect(url_for("routes.quiz"))
    if "manage_access" not in access_types:
        flash("You do not have edit access for this quiz")
        return redirect(url_for("routes.quiz"))

    return render_template("edit.jinja", user=user, code=code, session_cookie=session_cookie)
