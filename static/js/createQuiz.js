async function createQuiz(btn) {
  if (
    window.editMode != true && // TODO test
    !confirm(
      "Are you sure you want to publish this quiz (it can be hosted later)"
    )
  )
    return;

  let data = createDataForQuiz(true);
  if (!Array.isArray(data)) return;
  console.log("validation success");

  document.getElementById("questions").remove();
  document.querySelector(
    "center"
  ).innerHTML = `<img src="${URI_KEYS.LOADING}" class="center-loading"></img>`;

  if (auth.currentUser == null) {
    window.location = URI_KEYS.AUTH.LOGOUT;
  }

  let xhr = new XMLHttpRequest();
  xhr.open(
    "POST",
    window.editMode == true ? URI_KEYS.API.MAKE.EDIT : URI_KEYS.API.MAKE.CREATE
  );
  xhr.setRequestHeader(
    "content-type",
    "application/x-www-form-urlencoded;charset=UTF-8"
  );
  xhr.onload = function () {
    let res = JSON.parse(xhr.response);
    if (!res.inProgress) return alert(res.error);
    firestore
      .collection(res.code.toString())
      .doc("Questions")
      .onSnapshot((value) => {
        let data = value.data();
        if (data?.activeQuestion != null) {
          if (window.editMode != true) {
            setTimeout(() => {
              clearInterval(disabledInterval);
              onbeforeunload = () => null;
              window.location = `${URI_KEYS.QUIZ.HOST}/${res.code}`;
            }, 7000);
            alert(
              "Your quiz code is " +
                res.code +
                ", You will be redirected to host the quiz soon"
            );
          } else {
            setTimeout(() => {
              clearInterval(disabledInterval);
              onbeforeunload = () => null;
              window.location = `${URI_KEYS.QUIZ.HOST}/${res.code}`;
            }, 4000);
            alert("Your quiz has been updated");
          }
        }
      });
  };
  xhr.send(
    "data=" +
      encodeURIComponent(JSON.stringify(data)) +
      "&code=" +
      encodeURIComponent(window.code || "null") // if it is edit mode
  );
}
function createDataForQuiz(validate) {
  var data = [];
  let questions = document.querySelector("#questions").children;
  if (questions.length == 0 && validate == true)
    return alert("There should be at least 1 question in the quiz");
  for (let i = 0; i < questions.length; i++) {
    let question = questions[i];
    var questionData = {
      id: (i + 1).toString(),
      correctOption: question.querySelector("center select").value,
    };
    questionData["title"] = question.querySelector("#q-title").value;
    if (questionData.title.trim() == "" && validate == true)
      return alert(
        "Please Fill out the title for the question number " + (i + 1)
      );
    for (let j = 0; j < allowedOptions.length; j++) {
      let item = allowedOptions[j];
      let optionValue = null;
      optionValue = question.querySelector(`div[optionid=${item}]>input`).value;
      if (optionValue.trim() == "") optionValue = null;
      if (
        (item == "A" || item == "B") &&
        optionValue === null &&
        validate == true
      )
        return alert(
          `Option A and B are mandatory in question number ${i + 1}`
        );
      questionData[`option${item}`] = optionValue;
    }
    if (
      questionData[`${questionData.correctOption}`] == null &&
      validate == true
    )
      return alert(
        `The correct answer's value should not be empty in question ${i + 1}`
      );
    data.push(questionData);
  }

  return data;
}
function deleteAQuestion(legend) {
  legend.parentElement.remove();
}
function addAQuestion(data) {
  let questionsLength = (
    document.querySelector("#questions").children.length + 1
  ).toString();
  let question = document.createElement("fieldset");
  question.id = "question";

  let legend = document.createElement("legend");
  legend.innerHTML = "Question";
  question.appendChild(legend);
  /*question title*/
  let questionTitleCenter = document.createElement("center");
  let questionTitle = document.createElement("input");
  questionTitle.type = "text";
  questionTitle.id = "q-title";
  questionTitle.placeholder = "Question Title";
  questionTitle.value = data?.title || "";
  questionTitle.required = true;
  questionTitle.size = 50;
  questionTitle.maxLength = 250;
  questionTitleCenter.appendChild(questionTitle);
  question.appendChild(questionTitleCenter);
  /*Question options*/
  allowedOptions.forEach(function (item) {
    let questionOption;
    questionOption = document.createElement("div");
    questionOption.id = "option";
    questionOption.setAttribute("optionid", item);
    if (item == "A" || item == "B") {
      questionOption.innerHTML = `<h2>${item}</h2> <input type="text" required maxlength="50">`;
    } else {
      questionOption.innerHTML = `<h2>${item}</h2> <input type="text"  maxlength="50">`;
    }
    questionOption.querySelector("input").value = data?.[`option${item}`] || "";
    question.appendChild(questionOption);
  });
  let correctAnswerCenter = document.createElement("center");
  let correctAnswer = document.createElement("select");
  correctAnswer.name = "correctAnswer";
  allowedOptions.forEach((value) =>
    correctAnswer.add(
      new Option(
        value,
        "option" + value,
        data?.correctOption == `option${value}`,
        data?.correctOption == `option${value}`
      )
    )
  );
  correctAnswerCenter.innerHTML = "Correct answer:&nbsp;";
  correctAnswerCenter.appendChild(correctAnswer);

  correctAnswerCenter.style.margin = "1%";
  correctAnswerCenter.style.fontSize = "100%";
  question.appendChild(correctAnswerCenter);

  let deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.setAttribute("onclick", "deleteAQuestion(this);");
  deleteButton.innerHTML = "Delete";
  question.appendChild(deleteButton);
  document.getElementById("questions").appendChild(question);
}

function loadQuizFile() {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = ".dqcx";
  input.onchange = async (event) => {
    const files = event.target.files;
    let text;
    for (let file of files) {
      text = await file.text();
      try {
        loadQuestions(JSON.parse(text));
      } catch (e) {
        alert(`${file.name} contains invalid data`);
      }
    }
  };
  input.click();
}
function saveQuizFile() {
  let content = createDataForQuiz(false);
  let blob = new Blob([JSON.stringify(content)]);
  downloadFile(blob, "Quiz Data.dqcx");
}
function downloadFile(blob, filename) {
  let downloadElement = document.createElement("a");
  downloadElement.href = URL.createObjectURL(blob);
  downloadElement.download = filename;
  downloadElement.click();
}

function loadQuestions(questions) {
  for (let question of questions) {
    addAQuestion(question);
  }
}
