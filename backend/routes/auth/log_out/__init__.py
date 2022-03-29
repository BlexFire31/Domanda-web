from flask import redirect, url_for, make_response


def page():
    response = make_response(redirect(url_for("routes.index")))
    response.delete_cookie("session-cookie")
    return response
