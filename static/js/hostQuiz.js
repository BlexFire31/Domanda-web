if (window.code != null) {
  window.membersListener = () => {};
  window.lobbyListener = () => {};
  window.responseListeners = [];

  var actions = document.getElementById("host-actions");
  window.start = async function (type) {
    actions.innerHTML = `<img src="${URI_KEYS.LOADING}" class="center-loading"/>`;
    let xhr = new XMLHttpRequest();

    xhr.onload = function () {
      const response = JSON.parse(xhr.response);
      if (!response.success) {
        alert(response.error);
        window.location.reload();
      }
    };
    if (type == "all") {
      xhr.open("POST", URI_KEYS.API.HOST.ALL, true);
      xhr.setRequestHeader(
        "content-type",
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      xhr.send(
        `method=START&code=${encodeURIComponent(
          window.code
        )}&token=${encodeURIComponent(await auth.currentUser.getIdToken())}`
      );
    } else if (type == "single") {
      xhr.open("POST", URI_KEYS.API.HOST.SINGLE, true);
      xhr.setRequestHeader(
        "content-type",
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      const startQuestion = prompt("Enter question number");
      if (startQuestion != null) {
        xhr.send(
          `method=START&code=${encodeURIComponent(
            window.code
          )}&question=${encodeURIComponent(
            startQuestion.trim()
          )}&token=${encodeURIComponent(await auth.currentUser.getIdToken())}`
        );
      } else {
        window.location.reload();
      }
    }
  };
  window.finish = async function (type) {
    actions.innerHTML = `<img src="${URI_KEYS.LOADING}" class="center-loading"/>`;
    let xhr = new XMLHttpRequest();

    xhr.onload = function () {
      const response = JSON.parse(xhr.response);
      if (!response.success) {
        alert(response.error);
        window.location.reload();
      }
      makeDisplayLobbyMembers();
    };
    if (type == "all") {
      xhr.open("POST", URI_KEYS.API.HOST.ALL, true);
      xhr.setRequestHeader(
        "content-type",
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      xhr.send(
        `method=FINISH&code=${encodeURIComponent(
          window.code
        )}&token=${encodeURIComponent(await auth.currentUser.getIdToken())}`
      );
    } else if (type == "single") {
      xhr.open("POST", URI_KEYS.API.HOST.SINGLE, true);
      xhr.setRequestHeader(
        "content-type",
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      xhr.send(
        `method=FINISH&code=${encodeURIComponent(
          window.code
        )}&token=${encodeURIComponent(await auth.currentUser.getIdToken())}`
      );
    }
  };

  firestore
    .collection(window.code)
    .doc("Questions")
    .onSnapshot(async (value) => {
      let data = value.data();
      console.log(data);

      if (data.activeQuestion == -1) {
        makeDisplayActiveQuestionResponses(
          data.activeQuestion,
          data.questionsLength
        );
        actions.innerHTML = `<button onclick="window.finish('all')">Stop all questions</button>`;
      } else if (data.activeQuestion == 0) {
        makeDisplayLobbyMembers();
        actions.innerHTML = `<button onclick="window.start('all')">Start all questions</button> <button onclick="window.start('single')">Start a single question</button> <button onclick="window.location.href='${URI_KEYS.QUIZ.EDIT}/${window.code}'">Edit this quiz</button>`;
      } else {
        if (typeof data.activeQuestion == "number") {
          makeDisplayActiveQuestionResponses(
            data.activeQuestion,
            data.questionsLength
          );
          // Question is active
          actions.innerHTML = `<button onclick="window.finish('single')">Stop running active question (${data.activeQuestion}) </button>`;
        } else {
          makeDisplayLobbyMembers();
          // Question is inactive
          actions.innerHTML = `<button onclick="window.start('all')">Start all questions</button> <button onclick="window.start('single')">Start a single question</button> <button onclick="window.location.href='${URI_KEYS.QUIZ.EDIT}/${window.code}'">Edit this quiz</button>`;
        }
      }
    });

  async function displayLobbyMembers(parent) {
    let membersList = await firestore
      .collection(window.code)
      .doc("Members")
      .collection("Members")
      .get()
      .then((value) => value.docs.map((doc) => doc.id));
    let lobbyList = await firestore
      .collection(window.code)
      .doc("Lobby")
      .collection("Lobby")
      .get()
      .then((value) => value.docs.map((doc) => doc.id));

    window.membersListener = firestore
      .collection(window.code)
      .doc("Members")
      .collection("Members")
      .onSnapshot(({ docs }) => {
        membersList = docs.map((doc) => doc.id);
        parent.innerHTML = membersList
          .concat(lobbyList)
          .map((name) => `<span>${name}</span>`)
          .join(" ");
      });
    window.lobbyListener = firestore
      .collection(window.code)
      .doc("Lobby")
      .collection("Lobby")
      .onSnapshot(({ docs }) => {
        lobbyList = docs.map((doc) => doc.id);
        parent.innerHTML = membersList
          .concat(lobbyList)
          .map((name) => `<span>${name}</span>`)
          .join(" ");
      });
  }
  async function displayActiveQuestionResponses(
    parent,
    activeQuestion,
    questionsLength
  ) {
    if (activeQuestion == -1) {
      let membersAndResponses = {}; // structure: {memberName:['optionA',,,'optionC']}
      let listener;
      let correctAnswers = [];
      for (let i = 1; i <= questionsLength; i++)
        correctAnswers.push(
          await firestore
            .collection(window.code)
            .doc("Questions")
            .collection(i.toString())
            .doc("CorrectAnswer")
            .get()
            .then((v) => v.data().option)
        );
      let updateTable = () => {
        let table = document.createElement("table");
        table.cellPadding = table.cellSpacing = "10";
        let thead = document.createElement("thead");
        let trh = document.createElement("tr");
        //Table head
        trh.innerHTML = `<th>Name</th>\n`;

        for (let i = 1; i <= questionsLength; i++)
          trh.innerHTML += `<th>${i}:${correctAnswers[i - 1].replace(
            "option",
            ""
          )}</th>\n`;

        trh.innerHTML += "<th>Correct</th>\n";
        thead.appendChild(trh);
        table.appendChild(thead);
        // Answers of each
        Object.keys(membersAndResponses)
          .sort()
          .forEach((member) => {
            let responses = 0;
            let correct = 0;
            let row = "\n<tr>";
            row += `<td>${member}</td>\n`;
            for (let i = 0; i < questionsLength; i++) {
              const res = membersAndResponses[member][i];
              row += `<td>${
                res != null ? res.replace("option", "") : "..."
              }</td>\n`;
              res && responses++;
              if (res == correctAnswers[i]) correct++;
            }
            row += `<td>${correct}/${responses}</td></tr>`;
            table.innerHTML += row;
          });
        parent.innerHTML = "";
        parent.appendChild(table);
      };
      // Make listeners
      for (let q = 1; q <= questionsLength; q++) {
        // Cycle through each question and create a listener for each
        listener = firestore
          .collection(window.code)
          .doc("Questions")
          .collection(q.toString())
          .doc("Answers")
          .collection("Answers")
          .onSnapshot(({ docs }) => {
            docs.forEach((member) => {
              if (membersAndResponses[member.id] == null) {
                membersAndResponses[member.id] = [];
              }
              membersAndResponses[member.id][q - 1] = member.data().option;
            });
            updateTable();
          });
        window.responseListeners.push(listener);
      }
    } else {
      const correctAnswer = await firestore
        .collection(window.code)
        .doc("Questions")
        .collection(activeQuestion.toString())
        .doc("CorrectAnswer")
        .get()
        .then((v) => v.data().option);
      let table = document.createElement("table");
      table.cellPadding = table.cellSpacing = "10";
      await firestore
        .collection(window.code)
        .doc("Questions")
        .collection(activeQuestion.toString())
        .doc("Answers")
        .collection("Answers")
        .get()
        .then(({ docs }) => {
          table.innerHTML = `<thead>
            <th>Name</th>
            <th>Answer</th>
            <th>Correct</th>
          </thead>`;
          let answers = {};
          window.docs = docs;
          docs.forEach((doc) => {
            answers[doc.id] = doc.data().option;
          });
          table.innerHTML += Object.keys(answers)
            .sort()
            .map(
              (person) => `<tr>
            <td>${person}</td>
            <td>${answers[person].replace("option", "")}</td>
            <td>${answers[person] == correctAnswer ? "Yes" : "No"}</td>
          </tr>`
            )
            .join("\n");

          table.innerHTML += `<tr>
          <td colspan="3">
            <h1>
              <center>Correct answer: ${correctAnswer.replace(
                "option",
                ""
              )}</center>
            </h1>
          </td>
        </tr>`;

          parent.appendChild(table); // Get data, then display, then allow listeners to update
        });
      const listener = firestore
        .collection(window.code)
        .doc("Questions")
        .collection(activeQuestion.toString())
        .doc("Answers")
        .collection("Answers")
        .onSnapshot(({ docs }) => {
          table.innerHTML = `<thead>
          <th>Name</th>
          <th>Answer</th>
          <th>Correct</th>
          </thead>`;
          let answers = {};
          docs.forEach((doc) => {
            answers[doc.id] = doc.data().option;
          });
          table.innerHTML += Object.keys(answers)
            .sort()
            .map(
              (person) => `<tr>
          <td>${person}</td>
          <td>${answers[person].replace("option", "")}</td>
          <td>${answers[person] == correctAnswer ? "Yes" : "No"}</td>
          </tr>`
            )
            .join("\n");

          table.innerHTML += `<tr>
            <td colspan="3">
              <h1>
                <center>Correct answer: ${correctAnswer.replace(
                  "option",
                  ""
                )}</center>
            </h1>
            </td>
          </tr>`;
        });
      window.responseListeners.push(listener);
    }
  }
  function makeDisplayLobbyMembers() {
    window.lobbyListener();
    window.membersListener();
    window.responseListeners.forEach((listener) => listener.call());
    window.responseListeners = [];
    document.querySelector("center.members")?.remove?.();
    document.querySelector("center.answers")?.remove?.();
    let membersElement = document.createElement("center");
    membersElement.className = "members";
    document.body.appendChild(membersElement);
    displayLobbyMembers(membersElement);
  }
  function makeDisplayActiveQuestionResponses(activeQuestion, questionsLength) {
    window.lobbyListener();
    window.membersListener();
    window.responseListeners.forEach((listener) => listener.call());
    window.responseListeners = [];
    document.querySelector("center.members")?.remove?.();
    document.querySelector("center.answers")?.remove?.();
    let answersElement = document.createElement("center");
    answersElement.className = "answers";
    document.body.appendChild(answersElement);
    displayActiveQuestionResponses(
      answersElement,
      activeQuestion,
      questionsLength
    );
  }
}
