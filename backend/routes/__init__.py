from flask import Blueprint, render_template
import routes.join
import routes.quiz
import routes.auth

blueprint = Blueprint("routes", __name__)


@blueprint.route("/")
def index():
    return render_template("index.jinja")


# Register all the routes
# /auth
routes.auth.blueprint.add_url_rule(
    "/log-out", "log_out", routes.auth.log_out.page)
routes.auth.blueprint.add_url_rule(
    "/log-in", "log_in", routes.auth.log_in.page)
blueprint.register_blueprint(routes.auth.blueprint, url_prefix="/auth")

# /quiz/<code>
routes.quiz.code.blueprint.add_url_rule(
    "/edit", "edit", routes.quiz.code.edit.page)
routes.quiz.code.blueprint.add_url_rule(
    "/manage_access", "manage_access", routes.quiz.code.manage_access.page)
# /quiz
routes.quiz.blueprint.add_url_rule(
    "/create", "create", routes.quiz.create.page)
routes.quiz.blueprint.register_blueprint(
    routes.quiz.code.blueprint, url_prefix="/<code>")
blueprint.register_blueprint(routes.quiz.blueprint, url_prefix="/quiz")

# /join
blueprint.add_url_rule("/join/<code>", "join", routes.join.page)
