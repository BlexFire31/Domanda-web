from flask import Blueprint
from routes.quiz.editQuiz import app as editQuizApp
from routes.quiz.createQuiz import app as createQuizApp
from routes.quiz.hostQuiz import app as hostQuizApp
from routes.quiz.joinQuiz import app as joinQuizApp

app = Blueprint("RouteQuiz", __name__)
app.register_blueprint(hostQuizApp)
app.register_blueprint(editQuizApp)
app.register_blueprint(createQuizApp)
app.register_blueprint(joinQuizApp)
