
from flask import request, redirect, url_for, Blueprint, render_template
from utils.functions import verify_id_token

from utils.routes import URI_KEYS

app = Blueprint("createQuiz", __name__)


@app.route("/create")
def CreateQuizPage():
    user = verify_id_token(request.cookies.get("login-token"))
    if(request.cookies.get("login-token") == None or user == None):
        return redirect(url_for(URI_KEYS.get("AUTH").get("LOGIN"), redirect=url_for(URI_KEYS.get("QUIZ").get("CREATE"))))
    return render_template("create.html")
