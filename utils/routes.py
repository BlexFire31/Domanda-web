

URI_KEYS = {
    "HOME": 'Main.home.HomePage',
    "AUTH": {
        "LOGIN": 'Main.RouteAuth.logIn.LoginPage',
        "LOGOUT": 'Main.RouteAuth.logOut.LogoutPage',
    },
    "QUIZ": {
        "CREATE": 'Main.RouteQuiz.createQuiz.CreateQuizPage',
        "HOST": 'Main.RouteQuiz.hostQuiz.HostQuizPage',
        "JOIN": 'Main.RouteQuiz.joinQuiz.JoinQuizPage',
        "EDIT": 'Main.RouteQuiz.editQuiz.EditQuizPage'
    },
    "API": {
        "JOIN": {
            "GET": 'Main.RouteApi.ApiJoin.getAnswer.getCorrectAnswer',
            "JOIN": 'Main.RouteApi.ApiJoin.addMember.addMember',
            "SET": 'Main.RouteApi.ApiJoin.setAnswer.setAnswer'
        },
        "MAKE": {
            "CREATE": 'Main.RouteApi.ApiMake.createQuiz.create',
            "EDIT": 'Main.RouteApi.ApiMake.editQuiz.edit',
        },
        "HOST": {
            "ALL": 'Main.RouteApi.ApiHost.hostAll.hostAll',
            "SINGLE": 'Main.RouteApi.ApiHost.hostSingle.hostSingle',
            "GET_STATUS": 'Main.RouteApi.ApiHost.getStatus.getStatus',
        }
    },
}
