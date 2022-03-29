
import os
from flask import Blueprint, abort, flash, render_template, request
from requests import post
from utils.get_user_from_token import get_user_from_token
from routes.quiz import create
from routes.quiz import code
blueprint = Blueprint("quiz", __name__)


@blueprint.route("/")
@get_user_from_token
def index(user):
    # Get quizzes that user has access to
    data = {
        "session-cookie": request.cookies.get("session-cookie")
    }
    response = post(os.environ.get("API_URL") +
                    f"/user/accessible-quizzes", data=data)
    if not response.ok:
        return abort(response.status_code)

    result: dict[str, list[str]] = response.json().get("result")
    quizzes = list(result.keys())
    return render_template("quiz.jinja", user=user, quizzes=quizzes)
