from flask import flash, redirect, url_for
from utils.functions import isInt, isNotEmptyString


def has_code(property_name, redirect_endpoint):
    def decorator(func):
        def to_run(*args, **kwargs):
            code = kwargs.get("code")
            if(not isNotEmptyString(code)):
                flash("Please provide quiz code")
                return redirect(url_for(redirect_endpoint))
            if(not isInt(code)):
                flash("Invalid quiz code")
                return redirect(url_for(redirect_endpoint))

            # Convert code to integer if above checks pass
            kwargs[property_name] = int(kwargs[property_name])
            return func(*args, **kwargs)

        to_run.__name__ = func.__name__
        return to_run
    return decorator
