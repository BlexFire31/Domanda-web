from flask import Blueprint
from routes.api.join.getAnswer import api as getAnswerApi
from routes.api.join.addMember import api as addMemberApi
from routes.api.join.setAnswer import api as setAnswerApi

app = Blueprint("ApiJoin",__name__)
app.register_blueprint(getAnswerApi)
app.register_blueprint(addMemberApi)
app.register_blueprint(setAnswerApi)