function sanitize(text = "") {
  if (text == "" || text == null) return null;
  let sanitizer = document.createElement("div");
  sanitizer.textContent = text;
  return sanitizer.innerHTML;
}
function loadQuiz() {
  let id = window.join;
  document.querySelector(
    "center"
  ).innerHTML = `<img src="${URI_KEYS.LOADING}" class="center-loading"/>`;
  window.answers = new Map();
  window.questionListener = () => {};
  var allQuestionsData;
  firestore
    .collection(window.join)
    .doc("Questions")
    .onSnapshot(async (activeQuestionValue) => {
      questionListener(); //unsubscribe to previous question
      // Listen to the active question
      document.querySelector(
        "center"
      ).innerHTML = `<img src="${URI_KEYS.LOADING}" class="center-loading"/>`;
      let activeQuestion = activeQuestionValue.data().activeQuestion.toString();
      if (activeQuestion == -2) {
        document.querySelector(
          "center"
        ).innerHTML = `<h3>The host is currently editing the quiz</h3>`;
        return;
      }
      if (activeQuestion != 0) {
        if (activeQuestion != -1) {
          window.questionListener = await firestore
            .collection(window.join)
            .doc("Questions")
            .collection(activeQuestion.toString())
            .doc("QuestionData")
            .onSnapshot((questionValue) => {
              let question = questionValue.data();
              question.id = activeQuestion;
              let options = {};
              Object.keys(question)
                .sort()
                .forEach((key) => {
                  if (key.startsWith("option") && question[key] != null) {
                    options[key] = question[key];
                  }
                });
              let center = document.querySelector("center");
              center.innerHTML = '<ol id="questions"></ol>';
              center = center.children.item(0);
              if (question.finished) {
                if (window.answers.has(activeQuestion)) {
                  // if user has attempted the question, fetch correct answer
                  let xhr = new XMLHttpRequest();
                  xhr.open("POST", URI_KEYS.API.JOIN.GET, true);
                  xhr.setRequestHeader(
                    "content-type",
                    "application/x-www-form-urlencoded;charset=UTF-8"
                  );
                  xhr.send(
                    `code=${encodeURIComponent(
                      window.join
                    )}&question=${encodeURIComponent(
                      activeQuestion
                    )}&name=${encodeURIComponent(window.memberName)}`
                  );
                  xhr.onload = function () {
                    const returnData = JSON.parse(xhr.response);
                    if (!returnData.success) return alert(returnData.error);
                    // show question, correct answer,  and user's answer
                    displayQuestion(
                      center,
                      {
                        id: question.id,
                        options: options,
                        title: question.title,
                      },
                      returnData.data,
                      false
                    );
                  };
                } else {
                  document.querySelector("center").innerHTML =
                    "<h3>You didnt answer in time</h3>";
                }
              } else {
                displayQuestion(
                  center,
                  {
                    id: question.id,
                    options: options,
                    title: question.title,
                  },
                  null,
                  false
                );
              }
            });
        } else {
          let xhr = new XMLHttpRequest();
          xhr.open("POST", URI_KEYS.API.HOST.GET_STATUS, true);
          xhr.setRequestHeader(
            "content-type",
            "application/x-www-form-urlencoded;charset=UTF-8"
          );
          xhr.send(`code=${encodeURIComponent(window.join)}`);
          xhr.onload = function () {
            const returnData = JSON.parse(xhr.response);
            if (!returnData.success) return alert(returnData.error);
            allQuestionsData = returnData.data;

            let center = document.querySelector("center");
            center.innerHTML = '<ol id="questions"></ol>';
            center = center.children.item(0);
            for (
              let i = 1;
              i <= activeQuestionValue.data().questionsLength;
              i++
            ) {
              let question = allQuestionsData[i.toString()];
              let options = {};
              Object.keys(question)
                .sort()
                .forEach((key) => {
                  if (key.startsWith("option") && question[key] != null) {
                    options[key] = question[key];
                  }
                });
              displayQuestion(
                center,
                {
                  id: i,
                  title: question.title,
                  options: options,
                },
                null,
                true
              );
            }
          };
        }
      } else {
        // if user has attempted the questions, show their correct answers, otherwise show that host has stopped the quiz

        let center = document.querySelector("center");
        center.innerHTML =
          '<ol id="questions"><h3>The host has ended the quiz</h3></ol>';
        center = center.children.item(0);

        window.answers.forEach((value, key, map) => {
          let xhr = new XMLHttpRequest();
          xhr.open("POST", URI_KEYS.API.JOIN.GET, true);
          xhr.setRequestHeader(
            "content-type",
            "application/x-www-form-urlencoded;charset=UTF-8"
          );
          xhr.send(
            `code=${encodeURIComponent(
              window.join
            )}&question=${encodeURIComponent(key)}&name=${encodeURIComponent(
              window.memberName
            )}`
          );
          xhr.onload = function () {
            const returnData = JSON.parse(xhr.response);
            if (!returnData.success) return alert(returnData.error);
            let question = allQuestionsData[key];
            let options = {};
            Object.keys(question)
              .sort()
              .forEach((key) => {
                if (key.startsWith("option") && question[key] != null) {
                  options[key] = question[key];
                }
              });
            displayQuestion(
              center,
              {
                id: key,
                title: question.title,
                options: options,
              },
              returnData.data,
              true
            );
          };
        });
      }
    });
}

(async function () {
  if (window.join != null) {
    var lobbyListener = firestore
      .collection(window.join)
      .doc("Questions")
      .onSnapshot(function (value) {
        if (window.questionListener != null) return; // Unable to unsubscribe, so this will do
        if (typeof value.data().activeQuestion == "string") {
          document.querySelector("center").children.item(1).outerHTML =
            "<h3>You cannot join the quiz yet</h3>";
        } else {
          let joinButton = document.createElement("button");
          joinButton.textContent = "Join the quiz";
          joinButton.style.marginTop = "1%";
          document.querySelector("center").children.item(1).outerHTML =
            joinButton.outerHTML;
          document
            .querySelector("center>button")
            .addEventListener("click", async function (event) {
              let btn = document.querySelector("center>button");
              btn.disabled = true;
              btn.outerHTML = `<img src="${URI_KEYS.LOADING}" style="width:2rem;height:2rem"/>`;
              let xhr = new XMLHttpRequest();
              xhr.open("POST", URI_KEYS.API.JOIN.JOIN, true);
              xhr.setRequestHeader(
                "content-type",
                "application/x-www-form-urlencoded;charset=UTF-8"
              );
              xhr.send(
                `code=${encodeURIComponent(
                  window.join
                )}&name=${encodeURIComponent(window.memberName)}`
              );
              xhr.onload = function () {
                const returnData = JSON.parse(xhr.response);
                if (!returnData.success) return alert(returnData.error);
                lobbyListener(); //unsubscribe

                firestore
                  .collection(window.join)
                  .doc("Lobby")
                  .collection("Lobby")
                  .doc(window.memberName)
                  .delete(); //Remove from lobby and go to Members
                window.onbeforeunload = () => "";
                loadQuiz();
              };
            });
        }
      });
  }
})();
function displayQuestion(parent, data, ans, append = false) {
  if (!append) parent.innerHTML = "";
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

      if (ans != null) {
        if (window.answers.get(data.id.toString()) == option)
          questionOption.className = "redOption";
        if (ans == option) questionOption.className = "greenOption";
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
      }" value="${option.replace("option", "")}">${sanitize(
        data.options[option]
      )}</input>`;
      question.appendChild(questionOption);
    });
  if (ans == null) {
    let submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.onclick = function (event) {
      let optionList = question.querySelectorAll("#option>input");
      let selected;
      for (let i = 0; i < optionList.length; i++) {
        if (optionList[i].checked) selected = optionList[i];
      }
      if (selected == null)
        return alert(`Please select an option before submitting (Q${data.id})`);
      submitButton.disabled = true;
      submitButton.innerHTML = `<img src="${URI_KEYS.LOADING}" style="width:2rem;height:2rem"/>`;
      let xhr = new XMLHttpRequest();
      xhr.open("POST", URI_KEYS.API.JOIN.SET, true);
      xhr.setRequestHeader(
        "content-type",
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      xhr.send(
        `code=${encodeURIComponent(window.join)}&question=${encodeURIComponent(
          data.id
        )}&option=option${encodeURIComponent(selected.value)}&name=${
          window.memberName
        }`
      );
      xhr.onload = function () {
        const returnData = JSON.parse(xhr.response);
        if (!returnData.success) {
          submitButton.innerHTML = "Submit";
          submitButton.disabled = false;
          return alert(returnData.error);
        }

        submitButton.innerHTML = "Submitted";
        submitButton.style.backgroundColor = "var(--success)";
        submitButton.style.color = "#FFF";

        window.answers.set(data.id.toString(), "option" + selected.value);
      };
    };
    submitButton.innerHTML = "Submit";
    question.appendChild(submitButton);
  }
  parent.appendChild(question);
}
