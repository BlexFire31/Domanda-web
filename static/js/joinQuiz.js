class joinQuiz {
  #token;
  #name;
  #quizCode;
  #lobbyListener;
  #answers = new Map();
  #CONTENT_TYPE_URL_ENCODED = {
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
  };
  #questionsToBeDisplayed = [];
  #questionsBank = []; // array of cached questions (emptied when quiz gets edited and attemptAllQuestions is called)

  constructor(token, quizCode, name) {
    /**
     * set function parameter variables
     * listen to the activeQuestion of the quiz from firebase
     * start refreshTokenLoop (refreshes token every 45 minutes)
     */
    this.#name = name;
    this.#token = token;
    this.#quizCode = quizCode;
    this.#refreshTokenLoop();
    /**
     * lobbyListener listens to the active question on firebase
     * if it is a string, it does not allow the user to join the quiz
     * if it is an integer, it allows the user to join the quiz
     */
    this.#lobbyListener = firestore
      .collection(this.#quizCode)
      .doc("Questions")
      .onSnapshot((value) => {
        if (typeof value.data().activeQuestion == "string") {
          /**
           * If the activeQuestion is a string
           * the quiz is inactive
           * and then we show as a status "Waiting for the host to start the quiz"
           */
          this.#setElementStatusText(
            "center",
            "Waiting for the host to start the quiz"
          );
        } else {
          /**
           * If the quiz is active (activeQuestion is an integer)
           * then we create a join button
           * set the child of the center element to that join button
           * on clicking join button, run this.#joinQuiz
           */
          let joinButton = this.#createElement("button");
          joinButton.style.marginTop = "1%";
          joinButton.textContent = "Join the quiz";
          this.#setChildOf("center", joinButton);
          joinButton.onclick = (ev) => this.#joinTheQuiz();
        }
      });
  }
  #joinTheQuiz() {
    /**
     * When the join button is pressed
     * we send a request to URI_KEYS.API.JOIN.JOIN
     * once it succeeds we execute loadQuiz
     */
    this.#setParentChildToLoading("center");
    fetch(URI_KEYS.API.JOIN.JOIN, {
      method: "POST",
      headers: this.#CONTENT_TYPE_URL_ENCODED,
      body: this.#objectToUrlEncoded({
        code: this.#quizCode,
        token: this.#token,
      }),
    }).then(async (response) => {
      let returnData = JSON.parse(await response.text());
      if (returnData.success == false) return alert(returnData.error);

      window.onbeforeunload = () => ""; // set window.onbeforeunload to return a string to warn user before leaving page
      this.#loadQuiz();
    });
  }

  #refreshTokenLoop() {
    /**
     * function fetches url URI_KEYS.API.JOIN.REFRESH_TOKEN
     * passes in current token
     * sets token to token received from api
     * schedules this task to run after 45 minutes
     */
    setTimeout(() => {
      fetch(URI_KEYS.API.JOIN.REFRESH_TOKEN, {
        method: "POST",
        headers: this.#CONTENT_TYPE_URL_ENCODED,
        body: this.#objectToUrlEncoded({
          token: this.#token,
        }),
      }).then(async (response) => {
        let returnData = JSON.parse(await response.text());
        if (returnData.success == false) return alert(returnData.error);
        /**
         * On fetching token, set this.#token to the new token
         * schedule this task agin
         */
        this.#token = returnData.token;
        this.#refreshTokenLoop();
      });
    }, 2700 * 1000 /* 45 minutes in milliseconds */);
  }
  #sanitize(text = "") {
    if (text == "" || text == null) return null;
    let sanitizer = document.createElement("div");
    sanitizer.textContent = text;
    return sanitizer.innerHTML;
  }
  #setParentChildToLoading(parent) {
    document.querySelector(
      parent
    ).innerHTML = `<img src="${URI_KEYS.LOADING}" class="center-loading"/>`;
  }
  #setElementStatusText(parent, text) {
    document.querySelector(parent).innerHTML = `<h3>${text}</h3>`;
  }
  #setChildOf(parent, element) {
    document.querySelector(parent).replaceChildren(element);
  }
  #createElement(tag, id = "", classes = "") {
    let element = document.createElement(tag);
    element.id = id;
    element.className = classes;
    return element;
  }
  #objectToUrlEncoded(obj) {
    /**
     * Converts an object to url encoded string
     *
     * for each property create a key value pair
     * encode the key and value
     * Append that to the result
     * return result
     */
    let urlencoded = "";
    Object.keys(obj).forEach((key) => {
      let keyValuePair = `${encodeURIComponent(key)}=${encodeURIComponent(
        obj[key]
      )}&`;
      urlencoded += keyValuePair;
    });
    urlencoded = urlencoded.substring(0, urlencoded.length - 1); //Remove the last ampersand
    return urlencoded;
  }
  #displayQuestion(parent, data) {
    // don't touch, it works
    let question = document.createElement("fieldset");
    question.id = "question";
    let legend = document.createElement("legend");
    legend.style.color = "var(--input-foreground)";
    legend.textContent = "Question " + data.id;
    question.appendChild(legend);
    let questionTitleCenter = document.createElement("center");
    let questionTitle = document.createElement("h2");
    questionTitle.textContent = data.title;
    questionTitle.id = "q-title";
    questionTitleCenter.appendChild(questionTitle);
    question.appendChild(questionTitleCenter);

    /* Question Options */
    Object.keys(data.options)
      .sort()
      .forEach((option) => {
        let questionOption = document.createElement("div");
        questionOption.id = "option";
        questionOption.style.textAlign = "start";
        questionOption.style.marginLeft = "0%";
        questionOption.style.marginBottom = "2%";

        questionOption.onclick = (ev) => {
          questionOption.querySelector("input[type=radio]").checked = true;
        };

        if (data.correctAnswer != null) {
          if (this.#answers.get(data.id.toString()) == option)
            questionOption.className = "redOption";
          if (data.correctAnswer == option)
            questionOption.className = "greenOption";
        }
        questionOption.setAttribute(
          "optionId",
          data.options[option].replace("option", "")
        );
        questionOption.innerHTML = `<h2>${option.replace(
          "option",
          ""
        )}</h2> <input style="font-size:140%;" type="radio" name="${
          data.id
        }" value="${option.replace("option", "")}">${this.#sanitize(
          data.options[option]
        )}</input>`;
        question.appendChild(questionOption);
      });
    if (data.correctAnswer == null) {
      let submitButton = document.createElement("button");
      submitButton.type = "button";
      submitButton.onclick = (event) => {
        let optionList = question.querySelectorAll("#option>input");
        let selected;
        for (let i = 0; i < optionList.length; i++) {
          if (optionList[i].checked) selected = optionList[i];
        }
        if (selected == null)
          return alert(
            `Please select an option before submitting (Q${data.id})`
          );
        submitButton.disabled = true;
        submitButton.innerHTML = `<img src="${URI_KEYS.LOADING}" style="width:2rem;height:2rem"/>`;
        fetch(URI_KEYS.API.JOIN.SET, {
          method: "POST",
          headers: this.#CONTENT_TYPE_URL_ENCODED,
          body: this.#objectToUrlEncoded({
            code: this.#quizCode,
            question: data.id,
            option: "option" + selected.value,
            token: this.#token,
          }),
        }).then(async (response) => {
          const returnData = JSON.parse(await response.text());
          if (!returnData.success) {
            submitButton.innerHTML = "Submit";
            submitButton.disabled = false;
            return alert(returnData.error);
          }

          submitButton.innerHTML = "Submitted";
          submitButton.style.backgroundColor = "var(--success)";
          submitButton.style.color = "#FFF";

          this.#answers.set(data.id.toString(), "option" + selected.value);
        });
      };
      submitButton.innerHTML = "Submit";
      question.appendChild(submitButton);
    }
    parent.appendChild(question);
  }
  #loadQuiz() {
    /**
     * Unsubscribe the lobby listener, add loading in the center
     * listen for activeQuestion Changes
     */
    setTimeout(this.#lobbyListener, 0); // unsubscribe to the listener that listens to the active question while waiting for host to start the quiz
    this.#setParentChildToLoading("center");
    firestore
      .collection(this.#quizCode)
      .doc("Questions")
      .onSnapshot(async (activeQuestionValue) => {
        /**
         * When active question changes, show loading screen
         * clear this.#questionsToBeDisplayed and call updateQuestionsUI
         * if active question is -2, show status message that host is currently editing the quiz
         * if active question is -1, allow attempt of all questions
         * if active question is "0" reveal answers of attempted questions
         * if active question is a question number, allow attempt of that question
         */
        this.#setParentChildToLoading("center");

        this.#questionsToBeDisplayed = [];
        this.#updateQuestionsUI();

        let activeQuestionData = activeQuestionValue.data();
        switch (activeQuestionData.activeQuestion) {
          case -2:
            /**
             * active question is -2
             * host is editing quiz
             * show status message "The host is currently editing the quiz"
             * clear this.#questionsBank and this.#answers
             */
            this.#setElementStatusText(
              "center",
              "The host is currently editing the quiz"
            );
            this.#questionsBank = [];
            this.#answers = new Map();
            break;
          case -1:
            /**
             * active question is -1
             * set status message to ""
             * allow attempt of all questions
             */
            this.#setElementStatusText("center", "");
            this.#attemptAllQuestions(activeQuestionData.questionsLength);
            break;
          case "0":
            /**
             * active question is "0"
             * set status message to "The host has ended the quiz..."
             * reveal answers of attempted questions
             */
            this.#setElementStatusText(
              "center",
              "The host has ended the quiz <br> Correct answers of attempted questions will be revealed soon"
            );
            this.#revealAnswersOfAttemptedQuestions();
            break;
          default:
            /**
             * active question is a question number
             * set status message to ""
             * allow attempt of active question
             */
            this.#setElementStatusText("center", "");
            this.#attemptQuestion(activeQuestionData.activeQuestion);
            break;
        }
      });
  }
  #attemptQuestion(questionId) {
    firestore
      .collection(this.#quizCode)
      .doc("Questions")
      .collection(questionId.toString())
      .doc("QuestionData")
      .get()
      .then((questionDataSnapshot) => {
        let questionData = questionDataSnapshot.data();
        /**
         * Iterate through all the keys from the data
         * filter them, till we get all the ones that start with string "option"
         * filter out null options
         * map through them, return the key and value pair of the option
         * convert the keys and values to an object
         */
        let options = Object.keys(questionData)
          .filter((value) => value.startsWith("option"))
          .filter((value) => questionData[value] != null)
          .sort()
          .map((value) => {
            return { key: value, value: questionData[value] };
          })
          .reduce((currentObject, option) => {
            return { ...currentObject, [option.key]: option.value };
          }, {});
        /**
         * Push the question to this.#questionsToBeDisplayed and this.#questionsBank
         * call updateQuestionsUI
         */
        const questionObject = {
          id: questionId,
          title: questionData.title,
          options: options,
        };
        this.#questionsToBeDisplayed.push(questionObject);
        this.#questionsBank.push(questionObject);
        this.#updateQuestionsUI();
      });
  }
  #revealAnswersOfAttemptedQuestions() {
    let keys = Array(...this.#answers.keys());
    /**
     * if keys length is 0,
     * set status message to "The host has ended the quiz"
     */
    if (keys.length == 0)
      return this.#setElementStatusText(
        "center",
        "The host has ended the quiz <br> (You have attempted 0 questions)"
      );
    /**
     * iterate through this.#answers.keys()
     * fetch the correct answer from api
     * add the "correctAnswer" property to the question object
     * add the question Object to this.#questionsToBeDisplayed
     * call updateQuestionsUI with onlyQuestionsWithCorrectAnswer = true
     */
    for (let questionId of keys) {
      // For each question attempted, fetch correct answer
      fetch(URI_KEYS.API.JOIN.GET, {
        method: "POST",
        headers: this.#CONTENT_TYPE_URL_ENCODED,
        body: this.#objectToUrlEncoded({
          code: this.#quizCode,
          question: questionId,
          token: this.#token,
        }),
      }).then(async (response) => {
        const returnData = JSON.parse(await response.text());
        if (!returnData.success) return alert(returnData.error);
        /**
         * iterate through this.#questionsBank
         * if the id of the question is not the question we fetched the correct answer of, continue the loop
         * once we find the correct index, add the object to this.#questionsToBeDisplayed with the correctAnswer
         * call updateQuestionsUI with onlyQuestionsWithCorrectAnswer = true
         * break out of the loop
         */
        for (
          let questionIndex = 0;
          questionIndex < this.#questionsBank.length;
          questionIndex++
        ) {
          if (this.#questionsBank[questionIndex].id != questionId) continue;
          this.#questionsToBeDisplayed.push({
            ...this.#questionsBank[questionIndex],
            correctAnswer: returnData.data,
          });
          this.#updateQuestionsUI();
          break;
        }
      });
    }
  }
  #attemptAllQuestions(questionsLength) {
    /**
     * Get question data for each question from the range of questionsLength
     * Add that to array this.#questionsToBeDisplayed
     * call updateQuestionsUI
     */
    for (
      let questionIndex = 1;
      questionIndex <= questionsLength;
      questionIndex++
    ) {
      firestore
        .collection(this.#quizCode)
        .doc("Questions")
        .collection(questionIndex.toString())
        .doc("QuestionData")
        .get()
        .then((questionDataSnapshot) => {
          let questionData = questionDataSnapshot.data();
          /**
           * Iterate through all the keys from the data
           * filter them, till we get all the ones that start with string "option"
           * filter out null options
           * map through them, return the key and value pair of the option
           * convert the keys and values to an object
           */
          let options = Object.keys(questionData)
            .filter((value) => value.startsWith("option"))
            .filter((value) => questionData[value] != null)
            .sort()
            .map((value) => {
              return { key: value, value: questionData[value] };
            })
            .reduce((currentObject, option) => {
              return { ...currentObject, [option.key]: option.value };
            }, {});
          /**
           * Push the question to this.#questionsToBeDisplayed and this.#questionsBank
           * call updateQuestionsUI
           */
          const questionObject = {
            id: questionIndex,
            title: questionData.title,
            options: options,
          };
          this.#questionsToBeDisplayed.push(questionObject);
          this.#questionsBank.push(questionObject);
          this.#updateQuestionsUI();
        });
    }
  }
  #updateQuestionsUI() {
    let orderedList =
      document.querySelector("center>ol") ||
      this.#createElement("ol", "questions");
    orderedList.innerHTML = "";
    /**
     * create an ordered list with id=questions if it already does not exist
     * remove its children
     * iterate through this.#questionsToBeDisplayed
     * append them to the ordered list according to the question's ID
     */

    document.querySelector("center").appendChild(orderedList);

    /**
     * Iterate through this.#questionsToBeDisplayed
     * sort it according to the ID variable
     * display each question
     */
    this.#questionsToBeDisplayed
      .sort((element1, element2) => element1.id - element2.id)
      .forEach(({ title, id, options, correctAnswer }) => {
        this.#displayQuestion(orderedList, {
          title: title,
          id: id,
          options: options,
          correctAnswer: correctAnswer,
        });
      });
  }
}
