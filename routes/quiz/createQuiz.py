
from flask import session,redirect,url_for,Blueprint,render_template

from utils.routes import URI_KEYS

app=Blueprint("createQuiz",__name__)

@app.route("/create")
def CreateQuizPage():
    if(not session.get("Uid")):
        return redirect(url_for(URI_KEYS.get("AUTH").get("LOGIN"),redirect=url_for(URI_KEYS.get("QUIZ").get("CREATE"))))
    return render_template("create.html")
