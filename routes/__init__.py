from flask import Blueprint
from routes.quiz import app as quizRoute
from routes.auth import app as authRoute
from routes.home import app as homeRoute

app = Blueprint("Main", __name__)
app.register_blueprint(authRoute, url_prefix="/auth")
app.register_blueprint(quizRoute, url_prefix="/quiz")
app.register_blueprint(homeRoute)
