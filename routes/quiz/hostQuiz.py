from flask import session,request,flash,redirect,url_for,Blueprint,render_template,abort
from utils.db import database
from utils.functions import isInt
from utils.routes import URI_KEYS

app=Blueprint("hostQuiz",__name__)

@app.route("/host")
@app.route("/host/<code>")
def HostQuizPage(code=""):
    if(code!="" and not isInt(code)): #doing this so that when they go to host/quiz or host/randompage they should see 404
        abort(404)
    if(not session.get("Uid")): #is not logged in
        return redirect(url_for(URI_KEYS.get("AUTH").get("LOGIN"),redirect=url_for(URI_KEYS.get("QUIZ").get("HOST"))))

    if code.strip() =="":
        code=None

    if(
        code==None
        and isInt(request.args.get("code"))
    ): # if code is passed in request.args
        code=request.args.get("code")

    if (isInt(code)):
        quizRef=database.collection(code).document("Host").get()
        if not (quizRef.exists and  quizRef.to_dict().get("Host")==session.get("Uid")):
            code=None #set it to none, host.html will show error message and form again
            flash("The code provided is invalid (If you have entered the right code, try changing accounts)")

    return render_template("host.html",code=code)
