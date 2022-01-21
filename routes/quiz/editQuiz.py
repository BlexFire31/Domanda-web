
from flask import redirect, url_for, Blueprint, render_template, abort, request, flash
from google.cloud.firestore_v1.base_document import DocumentSnapshot
from utils.functions import isInt, runAsyncTask, verify_id_token
from utils.db import database
from google.cloud.firestore import CollectionReference
from utils.routes import URI_KEYS

app = Blueprint("editQuiz", __name__)


@app.route("/edit")
@app.route("/edit/<code>")
def EditQuizPage(code=""):
    # doing this so that when they go to edit/quiz or edit/randompage they should see 404
    if(code != "" and not isInt(code)):
        abort(404)
    user = verify_id_token(request.cookies.get("login-token"))
    if(request.cookies.get("login-token") == None or user == None):  # is not logged in
        return redirect(url_for(URI_KEYS.get("AUTH").get("LOGIN"), redirect=url_for(URI_KEYS.get("QUIZ").get("EDIT"))))

    if code.strip() == "":
        code = None

    if(
        code == None
        and isInt(request.args.get("code"))
    ):  # if code is passed in request.args
        code = request.args.get("code")

    quizData = {}
    if (isInt(code)):
        quizRef = database.collection(code).document("Host").get()
        if not (quizRef.exists and quizRef.to_dict().get("Host") == user["uid"]):
            code = None  # set it to none, host.html will show error message and form again
            flash(
                "The code provided is invalid (If you have entered the right code, try changing accounts)")
        else:
            def getQuestionData(collection: CollectionReference):
                fields: list[DocumentSnapshot] = [(doc) for doc in collection.get() if doc.id in [
                    "CorrectAnswer", "QuestionData"]]
                quizData[collection.id] = {}
                for field in fields:
                    if field.id == "CorrectAnswer":
                        quizData[collection.id]["correctOption"] = field.get(
                            "option")
                    else:
                        quizData[collection.id]["optionA"] = field.get(
                            "optionA")
                        quizData[collection.id]["optionB"] = field.get(
                            "optionB")
                        quizData[collection.id]["optionC"] = field.get(
                            "optionC")
                        quizData[collection.id]["optionD"] = field.get(
                            "optionD")
                        quizData[collection.id]["optionE"] = field.get(
                            "optionE")
                        quizData[collection.id]["optionF"] = field.get(
                            "optionF")
                        quizData[collection.id]["title"] = field.get("title")

            questionsLength = database.collection(code).document(
                "Questions").get().get("questionsLength")
            for questionNumber in range(1, questionsLength+1):
                runAsyncTask(getQuestionData, database.collection(
                    code).document("Questions").collection(str(questionNumber)))

            while True:
                if (
                    ({} not in list(quizData.values())) and
                    (len(list(quizData.keys())) == questionsLength)
                ):
                    break

    return render_template("edit.html", code=code, quizData=quizData,)
