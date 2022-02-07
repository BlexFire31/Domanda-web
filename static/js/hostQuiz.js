class hostQuiz {
  #code;
  #responsesListeners = [];
  #membersListeners = [];
  #correctAnswers = {};
  #hostActions;
  #hostPanel;
  #CONTENT_TYPE_URL_ENCODED = {
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
  };
  constructor(code) {
    /**
     * Set local variables
     * fetch all the correct answers for this quiz
     * listen to the activeQuestion
     * on activeQuestion change, call updateHostActions and updateHostPanel
     */
    this.#code = code;
    this.#hostActions = document.getElementById("host-actions");
    this.#hostPanel = document.getElementById("host-panel");
    this.#getCorrectAnswers();
    firestore
      .collection(code)
      .doc("Questions")
      .onSnapshot((activeQuestionSnapshot) => {
        /**
         * When activeQuestion is updated
         * set hostPanel to loading
         * de activate the old listeners
         * If activeQuestion is string, display start buttons and members
         * If activeQuestion is number, display stop buttons and responses table
         */
        this.#setChildToLoading(this.#hostPanel);
        this.#deActivateListeners();
        const activeQuestionData = activeQuestionSnapshot.data();
        switch (typeof activeQuestionData.activeQuestion) {
          case "string": {
            this.#displayStartButtons(activeQuestionData.questionsLength);
            this.#displayMembers();
            break;
          }
          case "number": {
            this.#displayStopButtons();
            this.#displayResponsesTable(activeQuestionData);
            break;
          }
        }
      });
  }
  #deActivateListeners() {
    const call = (func) => {
      func.call();
    };
    /**
     * unsubscribe to all the listeners in #membersListeners and #responsesListeners
     * clear arrays #membersListeners and #responsesListeners
     */
    this.#membersListeners.forEach(call);
    this.#responsesListeners.forEach(call);
    this.#membersListeners = [];
    this.#responsesListeners = [];
  }
  async #getCorrectAnswers() {
    /**
     * Get the length of questions from firebase
     * for each question in range of questions length
     * fetch the correct answer
     * append the answers to this.#correctAnswers
     */
    let questionsLength = await firestore
      .collection(this.#code)
      .doc("Questions")
      .get()
      .then(
        (activeQuestionSnapshot) =>
          activeQuestionSnapshot.data().questionsLength
      );
    /**
     * Fetch the correct answer for each question
     * append it onto this.#correctAnswers
     */
    for (let i = 1; i <= questionsLength; i++) {
      firestore
        .collection(this.#code)
        .doc("Questions")
        .collection(i.toString())
        .doc("CorrectAnswer")
        .get()
        .then((correctAnswerSnapshot) => {
          this.#correctAnswers[i.toString()] = correctAnswerSnapshot
            .data()
            .option.replace("option", "");
        });
    }
  }
  async #startAll() {
    /* fetches URI_KEYS.API.HOST.START_ALL */
    this.#setChildToLoading(this.#hostActions);
    fetch(URI_KEYS.API.HOST.START_ALL, {
      method: "POST",
      body: this.#objectToUrlEncoded({
        code: this.#code,
        token: await auth.currentUser.getIdToken(),
      }),
      headers: this.#CONTENT_TYPE_URL_ENCODED,
    }).then(async (response) => {
      const returnData = JSON.parse(await response.text());
      if (!returnData.success) {
        /**
         * Alert user the error
         * show the start buttons
         */
        alert(returnData.error);
        this.#displayStartButtons();
      }
    });
  }

  #askUserForQuestion(questionsLength) {
    let selectQuestionPrompt = this.#createElement(
      "div",
      "select-question-prompt"
    );
    let formWrapper = this.#createElement("div", "", "form-wrapper");
    let heading = this.#createElement("h3");
    let questionInput = this.#createElement("input");
    let okButton = this.#createElement("button", "", "ok");
    let cancelButton = this.#createElement("button", "", "cancel");

    this.#updateChildrenOf(formWrapper, [
      heading,
      questionInput,
      okButton,
      cancelButton,
    ]);
    selectQuestionPrompt.appendChild(formWrapper);

    heading.textContent = `Enter in a number between 1 and ${questionsLength}`;
    okButton.textContent = "OK";
    cancelButton.textContent = "Cancel";
    questionInput.placeholder = "Question number";

    okButton.disabled = true;

    document.body.appendChild(selectQuestionPrompt);

    this.#hostPanel.style.display = "none";
    const okButtonDisabledInterval = setInterval(() => {
      let integerValue = parseInt(questionInput.value);
      okButton.disabled = integerValue > questionsLength || integerValue < 1 || isNaN(integerValue);
    }, 50);
    return new Promise((resolve, reject) => {
      okButton.onclick = () => {
        this.#hostPanel.style.display = "block";
        selectQuestionPrompt.remove();
        clearInterval(okButtonDisabledInterval);
        resolve(parseInt(questionInput.value).toString());
      };
      cancelButton.onclick = () => {
        this.#hostPanel.style.display = "block";
        selectQuestionPrompt.remove();
        clearInterval(okButtonDisabledInterval);
        resolve(null);
      };
    });
  }
  async #startSingle(questionsLength) {
    /**
     * fetches URI_KEYS.API.HOST.START_SINGLE
     * Asks user to select a question
     * if user presses cancel, break out of loop
     * otherwise fetches url
     */
    const selectedQuestion = await this.#askUserForQuestion(questionsLength);
    if (selectedQuestion == null) return;
    this.#setChildToLoading(this.#hostActions);
    fetch(URI_KEYS.API.HOST.START_SINGLE, {
      method: "POST",
      body: this.#objectToUrlEncoded({
        code: this.#code,
        token: await auth.currentUser.getIdToken(),
        question: selectedQuestion,
      }),
      headers: this.#CONTENT_TYPE_URL_ENCODED,
    }).then(async (response) => {
      const returnData = JSON.parse(await response.text());
      if (!returnData.success) {
        /**
         * Alert user the error
         * show the start buttons
         */
        alert(returnData.error);
        this.#displayStartButtons();
      }
    });
  }
  async #finish() {
    /* fetches URI_KEYS.API.HOST.FINISH */
    this.#setChildToLoading(this.#hostActions);
    fetch(URI_KEYS.API.HOST.FINISH, {
      method: "POST",
      body: this.#objectToUrlEncoded({
        code: this.#code,
        token: await auth.currentUser.getIdToken(),
      }),
      headers: this.#CONTENT_TYPE_URL_ENCODED,
    }).then(async (response) => {
      const returnData = JSON.parse(await response.text());
      if (!returnData.success) {
        /**
         * Alert user the error
         * show the stop buttons
         */
        alert(returnData.error);
        this.#displayStopButtons();
      }
    });
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
  #displayMembers() {
    let attendees = new Set();
    /**
     * If quiz is inactive
     * listen to Members and Lobby collection
     * show attendees on center.attendees
     */

    let updateAttendees = () => {
      let attendeesContainer = this.#createElement("center", "", "attendees");
      attendeesContainer.className = "attendees";
      const addAttendee = (name) => {
        let element = this.#createElement("span");
        element.textContent = name;
        attendeesContainer.appendChild(element);
      };
      Array(...attendees)
        .sort()
        .forEach(addAttendee);
      this.#updateChildrenOf(this.#hostPanel, [attendeesContainer]);
    };
    /**
     * when a listener updates
     * it adds all the members to the attendees set
     * and calls updateAttendees
     */
    // Members listener
    const membersListener = firestore
      .collection(this.#code)
      .doc("Members")
      .collection("Members")
      .onSnapshot(({ docs }) => {
        docs.forEach((documentSnapshot) => {
          attendees.add(documentSnapshot.id);
        });
        updateAttendees();
      });

    // Lobby listener
    const lobbyListener = firestore
      .collection(this.#code)
      .doc("Lobby")
      .collection("Lobby")
      .onSnapshot(({ docs }) => {
        docs.forEach((documentSnapshot) => {
          attendees.add(documentSnapshot.id);
        });
        updateAttendees();
      });

    this.#membersListeners = [lobbyListener, membersListener];
  }
  #createElement(tag, id = "", classes = "") {
    let element = document.createElement(tag);
    element.id = id;
    element.className = classes;
    return element;
  }
  #displayResponsesTable({ questionsLength, activeQuestion }) {
    /**
     * If quiz is active, display responses table
     * create listeners for each question
     * on member answer, add value to object responses
     * call updateTable
     */

    // Wrap in microTask to avoid bottle necks by waiting for correct answers
    const waitInterval = setInterval(() => {
      if (Object.keys(this.#correctAnswers).length != questionsLength) {
        return;
      } else {
        setTimeout(() => clearInterval(waitInterval), 10);
      }
      let responses = {}; // {"question":{"memberName":"option"}}

      let updateTable = () => {
        /**
         * on updateTable call
         * create new table
         * set header of table to questions (along with their correctAnswers)
         */
        let table = this.#createElement("table");
        table.cellPadding = table.cellSpacing = "10";

        /* TABLE HEADER */
        let tableHeader = "<tr><th>Name</th>";
        for (let questionId = 1; questionId <= questionsLength; questionId++) {
          // Add th tag with question number and correctAnswer of question
          tableHeader += `<th>${questionId}:${
            this.#correctAnswers[questionId.toString()]
          }</th>`;
        }
        tableHeader += "<th>Correct</th></tr>";
        table.innerHTML = tableHeader;
        /* RESPONDED MEMBERS */
        /**
         * create new set
         * cycle through each question
         * add responded member name to set
         * set will remove duplicates itself
         */
        let respondedMembers = new Set();
        for (let answers of Object.values(responses)) {
          Object.keys(answers).forEach((name) => respondedMembers.add(name));
        }

        /* RESPONSE ROWS */
        /**
         * for item of respondedMembers, create a row for their
         *  name
         *  answer of each question
         *  is correct answer
         */
        let responsesRows = "";
        for (let name of Array(...respondedMembers).sort()) {
          let attemptedQuestions = 0;
          let correctResponses = 0;
          responsesRows += `<tr><td>${name}</td>`;
          for (
            let questionId = 1;
            questionId <= questionsLength;
            questionId++
          ) {
            /**
             * Fetch user's response from responses
             * if response is null, set it to "..."
             * if not, increment attemptedQuestions
             *
             * if the response is correct, increment correctResponses
             *
             * append response to responsesRows
             */
            let response = responses[questionId.toString()][name];

            if (response == null) {
              response = "...";
            } else {
              attemptedQuestions++;
              response == this.#correctAnswers[questionId.toString()] &&
                correctResponses++; // if response is correct, increment correct responses
            }

            responsesRows += `<td>${response}</td>`;
          }

          /**
           * If activeQuestion is greater than 0 and correctResponses = 1
           * show yes
           *
           * If activeQuestion is greater than 0 and correctResponses = 0
           * show no
           *
           * otherwise show correctResponses/attemptedQuestions
           */

          if (activeQuestion > 0) {
            responsesRows += `<td>${
              !!correctResponses // convert integer to boolean (0=false 1=true)
                ? "Yes"
                : "No"
            }</td></tr>`;
          } else {
            responsesRows += `<td>${correctResponses}/${attemptedQuestions}</td></tr>`;
          }
        }
        /**
         * Finally set the rows of the table
         * create responsesContainer
         * add the table as a child
         * add the responsesContainer to hostPanel
         */
        table.innerHTML += responsesRows;
        let responsesContainer = this.#createElement("center", "", "responses");
        responsesContainer.appendChild(table);
        this.#updateChildrenOf(this.#hostPanel, [responsesContainer]);
      }; // END OF UPDATE TABLE

      switch (activeQuestion) {
        case -1: {
          /**
           * If all questions are started
           * set the value of the question in responses to an empty object
           * create a listener for each question
           * when the listener updates, set the responses of the attendees in the responses object
           * then call updateTable
           * append the unsubscribe function to #responsesListeners
           */
          for (
            let questionId = 1;
            questionId <= questionsLength;
            questionId++
          ) {
            responses[questionId.toString()] = {};
            let unsubscribeFunction = firestore
              .collection(this.#code)
              .doc("Questions")
              .collection(questionId.toString())
              .doc("Answers")
              .collection("Answers")
              .onSnapshot(({ docs }) => {
                for (let doc of docs) {
                  responses[questionId.toString()][doc.id] = doc
                    .data()
                    .option.replace("option", "");
                }
                updateTable();
              });
            this.#responsesListeners.push(unsubscribeFunction);
          }
          break;
        }
        default: {
          /**
           * if only a single question is started
           * set the value of the question in responses to an empty object
           * create a listener for that question
           * when the listener updates, set the responses of the attendees in the responses object
           * call updateTable
           * push the unsubscribe listener to #responsesListeners
           */
          responses[activeQuestion.toString()] = {};
          let unsubscribeFunction = firestore
            .collection(this.#code)
            .doc("Questions")
            .collection(activeQuestion.toString())
            .doc("Answers")
            .collection("Answers")
            .onSnapshot(({ docs }) => {
              for (let doc of docs) {
                responses[activeQuestion.toString()][doc.id] = doc
                  .data()
                  .option.replace("option", "");
              }
              updateTable();
            });
          this.#responsesListeners.push(unsubscribeFunction);
          break;
        }
      }
    }, 100);
  }
  #displayStartButtons(questionsLength) {
    /**
     * The quiz is inactive
     * display start all questions button, onclick run this.#startAll
     * display start a single question button, onclick run this.#start
     * display edit quiz button button, onclick redirect to edit quiz page
     */
    let startAllQuestionsButton = this.#createElement("button");
    let startSingleQuestionButton = this.#createElement("button");
    let editQuizButton = this.#createElement("button");

    startAllQuestionsButton.onclick = (event) => this.#startAll();
    startSingleQuestionButton.onclick = (event) =>
      this.#startSingle(questionsLength);
    editQuizButton.onclick = (event) =>
      (window.location.href = `${URI_KEYS.QUIZ.EDIT}/${this.#code}`);

    startAllQuestionsButton.textContent = "Start all questions";
    startSingleQuestionButton.textContent = "Start a single question";
    editQuizButton.textContent = "Edit this quiz";

    /* Set children of hostActions to the buttons */
    this.#updateChildrenOf(this.#hostActions, [
      startAllQuestionsButton,
      startSingleQuestionButton,
      editQuizButton,
    ]);
  }
  #displayStopButtons() {
    /**
     * If any question has been started
     * create stop questions button
     * set onclick event to this.#finish
     * set children of host actions to stopQuestions
     */
    let stopQuestions = this.#createElement("button");
    stopQuestions.textContent = "Stop the questions";
    stopQuestions.onclick = (ev) => this.#finish();
    this.#updateChildrenOf(this.#hostActions, [stopQuestions]);
  }
  #setChildToLoading(parent) {
    parent.innerHTML = `<img src="${URI_KEYS.LOADING}" class="center-loading"/>`;
  }
  #updateChildrenOf(parent, children) {
    parent.replaceChildren(...children);
  }
}
