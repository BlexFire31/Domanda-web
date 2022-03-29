from flask import redirect, request, url_for, current_app
from utils.firebase import auth


def get_user_from_token(route):
    def func(*args, **kwargs):
        session_cookie = "gibberish)"
        try:
            user = auth.verify_session_cookie(session_cookie=session_cookie)
        except:
            return redirect(url_for("routes.auth.log_in", redirect_endpoint=request.url))
        kwargs["user"] = user
        return route(*args, **kwargs)
    func.__name__ = route.__name__
    return func
