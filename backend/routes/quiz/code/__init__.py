
from flask import Blueprint, flash, render_template
import os
from requests import post
from flask import abort, request
from utils.get_user_from_token import get_user_from_token
from utils.has_code import has_code
from routes.quiz.code import edit
from routes.quiz.code import manage_access


blueprint = Blueprint("code", __name__)


@blueprint.route("/")
@get_user_from_token
@has_code(property_name="code", redirect_endpoint="routes.quiz.index")
def page(code: int, user: dict):
    session_cookie = request.cookies.get("session-cookie")
    data = {
        "session-cookie": session_cookie
    }
    response = post(os.environ.get("API_URL") +
                    f"/quiz/{code}/host/access-types-with-exists", data=data)
    if not response.ok:
        return abort(response.status_code)

    result: dict = response.json().get("result")
    exists: bool = result.get("exists")
    access_types: list[str] = result.get("access-types")

    if not exists:
        flash("This quiz does not exist")
        return render_template("quiz.jinja", user=user)
    if access_types is None:
        flash("You do not have access to this quiz")
        return render_template("quiz.jinja", user=user)

    return render_template("host.jinja", user=user, session_cookie=session_cookie, access_types=access_types)
