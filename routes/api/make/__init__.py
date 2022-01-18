from flask import Blueprint
from routes.api.make.createQuiz import api as createQuizApi
from routes.api.make.editQuiz import api as editQuizApi

app = Blueprint("ApiMake", __name__)
app.register_blueprint(createQuizApi)
app.register_blueprint(editQuizApi)
