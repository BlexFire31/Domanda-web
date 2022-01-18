from routes.api.make.validateQuizData import validateQuizData
from routes.api.make.makeQuiz import setQuizInFirebase
from utils.db import database
from flask import Blueprint, session, request
from utils.functions import runAsyncTask


api = Blueprint("createQuiz", __name__)


@api.route("/create", methods=["POST"])
def create():
    if session.get("Uid") == None:  # checks whether user is signed in

        return {
            "inProgress": False,
            "error": "You are not signed in"
        }

    success, data = validateQuizData(request.form.get("data"))

    if(success):
        code = database.collection("DATA").document(
            "quiz-code").get().to_dict().get("number")+1
        # we update the count incase a new question is created by another client | The client knows when their question has been created when questionLength gets a value
        database.collection("DATA").document(
            "quiz-code").update({"number": code})
        runAsyncTask(setQuizInFirebase, data, session.get("Uid"), code)

        return {
            "inProgress": True,
            "code": code
        }
    else:
        return {
            "inProgress": False,
            "error": "The Data passed is invalid"
        }
