// 馬の数を設定
const numHorses = 12;
const defaultPace = [
  "逃げ",
  "逃げ",
  "逃げ",
  "逃げ",
  "先行",
  "先行",
  "先行",
  "差し",
  "差し",
  "差し",
  "差し",
  "追込",
];
const paceValues = {
  大逃げ: 1.17,
  逃げ: 1.0,
  先行: 0.985,
  差し: 0.975,
  追込: 0.945,
};

// 馬の入力フォームを作成する関数
function createHorseInputs() {
  const container = document.getElementById("horseInputs");
  for (let i = 0; i < numHorses; i++) {
    const horseDiv = document.createElement("div");
    horseDiv.className = "horse-input card";
    horseDiv.innerHTML = `
      <h2>Horse ${i + 1}</h2>
      <label for="power${i}">補正パワー値:</label>
      <input type="number" id="power${i}" min="0" value="1300">
      <label for="track${i}">バ場適性:</label>
      <select id="track${i}">
        <option value="1.05">S</option>
        <option value="1">A</option>
        <option value="0.9">B</option>
        <option value="0.8">C</option>
        <option value="0.6">D</option>
        <option value="0.4">E</option>
        <option value="0.2">F</option>
        <option value="0.1">G</option>
      </select>
      <label for="distance${i}">距離適性:</label>
      <select id="distance${i}">
        <option value="1.0">S</option>
        <option value="1.0">A</option>
        <option value="1.0">B</option>
        <option value="1.0">C</option>
        <option value="1.0">D</option>
        <option value="0.6">E</option>
        <option value="0.5">F</option>
        <option value="0.4">G</option>
      </select>
      <label for="type${i}">脚質適性:</label>
      <select id="type${i}">
        <option value="1.17" ${
          defaultPace[i] === "大逃げ" ? "selected" : ""
        }>大逃げ</option>
        <option value="1.0" ${
          defaultPace[i] === "逃げ" ? "selected" : ""
        }>逃げ</option>
        <option value="0.985" ${
          defaultPace[i] === "先行" ? "selected" : ""
        }>先行</option>
        <option value="0.975" ${
          defaultPace[i] === "差し" ? "selected" : ""
        }>差し</option>
        <option value="0.945" ${
          defaultPace[i] === "追込" ? "selected" : ""
        }>追込</option>
      </select>
      <label for="concentration${i}">コンセントレーション:</label>
      <input type="checkbox" id="concentration${i}" onclick="handleCheckboxClick(${i}, 'concentration')">
      <label for="focus${i}">集中力:</label>
      <input type="checkbox" id="focus${i}" onclick="handleCheckboxClick(${i}, 'focus')">
      <label for="acceleration${i}">加速スキル (小数第2位まで):</label>
      <input type="number" step="0.01" id="acceleration${i}" min="0" value="0.00">
    `;
    container.appendChild(horseDiv);
  }
}

// チェックボックスの相互排他を管理する関数
function handleCheckboxClick(index, type) {
  const concentrationCheckbox = document.getElementById(
    `concentration${index}`
  );
  const focusCheckbox = document.getElementById(`focus${index}`);

  if (type === "concentration" && concentrationCheckbox.checked) {
    focusCheckbox.checked = false;
  } else if (type === "focus" && focusCheckbox.checked) {
    concentrationCheckbox.checked = false;
  }
}

// 各馬のK値を計算する関数
function getHorseK(index) {
  const power = parseFloat(document.getElementById(`power${index}`).value);
  const track = parseFloat(document.getElementById(`track${index}`).value);
  const distance = parseFloat(
    document.getElementById(`distance${index}`).value
  );
  const type = parseFloat(document.getElementById(`type${index}`).value);
  const accelerationSkill =
    parseFloat(document.getElementById(`acceleration${index}`).value) || 0;
  return (
    0.0006 * Math.sqrt(500.0 * power) * type * track * distance +
    24 +
    accelerationSkill
  );
}

// シミュレーションを実行する関数
function simulate() {
  const loadingElement = document.getElementById("loading");
  loadingElement.classList.remove("hidden");

  setTimeout(() => {
    const numSimulations = parseInt(
      document.getElementById("numSimulations").value,
      10
    );
    const timeInterval = 1 / 15;
    const initialSpeed = 3;
    const countValidRankings = new Array(numHorses).fill(0);
    let countranks = new Array(numHorses).fill(0);

    for (let i = 0; i < numSimulations; i++) {
      let results = [];
      for (let j = 0; j < numHorses; j++) {
        const K = getHorseK(j);
        let D = Math.random() * 0.1;

        if (document.getElementById(`concentration${j}`).checked) {
          D *= 0.4;
        } else if (document.getElementById(`focus${j}`).checked) {
          D *= 0.9;
        }

        let X = initialSpeed;
        let M1, M2, M3, M4, M5;

        if (D > timeInterval) {
          D -= timeInterval;
          M1 = 0;
        } else {
          M1 = X * (timeInterval - D);
          D = -1;
        }

        if (D === -1) {
          X += K * timeInterval;
          M2 = X * timeInterval + M1;
        } else {
          M2 = X * (timeInterval - D) + M1;
        }

        X += K * timeInterval;
        M3 = X * timeInterval + M2;
        X += K * timeInterval;
        M4 = X * timeInterval + M3;
        X += K * timeInterval;
        M5 = X * timeInterval + M4;

        results.push({
          M1: M1.toFixed(5),
          M2: M2.toFixed(5),
          M3: M3.toFixed(5),
          M4: M4.toFixed(5),
          M5: M5.toFixed(5),
        });
      }

      let M1Array = results.map((result, index) => ({
        M1: parseFloat(result.M1),
        index: index,
      }));
      M1Array.sort((a, b) => b.M1 - a.M1);
      let rank = 1;
      M1Array.forEach((item) => {
        if (item.M1 !== 0) {
          item.rank = rank++;
        }
      });

      let M2Array = results.map((result, index) => ({
        M2: parseFloat(result.M2),
        index: index,
      }));
      M2Array.sort((a, b) => b.M2 - a.M2);
      rank = 1;
      M2Array.forEach((item) => {
        const correspondingM1 = M1Array.find(
          (m1Item) => m1Item.index === item.index
        );

        if (item.M2 !== 0) {
          if (correspondingM1 && correspondingM1.M1 >= 1) {
            rank++;
          } else {
            item.rank = rank++;
          }
        }
      });

      let M3Array = results.map((result, index) => ({
        M3: parseFloat(result.M3),
        index: index,
      }));
      M3Array.sort((a, b) => b.M3 - a.M3);
      rank = 1;
      M3Array.forEach((item) => {
        const correspondingM2 = M2Array.find(
          (m2Item) => m2Item.index === item.index
        );

        if (item.M3 !== 0) {
          if (correspondingM2 && correspondingM2.M2 >= 1) {
            rank++;
          } else {
            item.rank = rank++;
          }
        }
      });

      let M4Array = results.map((result, index) => ({
        M4: parseFloat(result.M4),
        index: index,
      }));
      M4Array.sort((a, b) => b.M4 - a.M4);
      rank = 1;
      M4Array.forEach((item) => {
        const correspondingM3 = M3Array.find(
          (m3Item) => m3Item.index === item.index
        );

        if (item.M4 !== 0) {
          if (correspondingM3 && correspondingM3.M3 >= 1) {
            rank++;
          } else {
            item.rank = rank++;
          }
        }
      });

      let M5Array = results.map((result, index) => ({
        M5: parseFloat(result.M5),
        index: index,
      }));
      M5Array.sort((a, b) => b.M5 - a.M5);
      rank = 1;
      M5Array.forEach((item) => {
        const correspondingM4 = M4Array.find(
          (m4Item) => m4Item.index === item.index
        );

        if (item.M5 !== 0) {
          if (correspondingM4 && correspondingM4.M4 >= 1) {
            rank++;
          } else {
            item.rank = rank++;
          }
        }
      });

      for (let n = 0; n < numHorses; n++) {
        let ranks = [
          M1Array.find((item) => item.index === n)?.rank,
          M2Array.find((item) => item.index === n)?.rank,
          M3Array.find((item) => item.index === n)?.rank,
          M4Array.find((item) => item.index === n)?.rank,
          M5Array.find((item) => item.index === n)?.rank,
        ];

        if (ranks.some((rank) => [2, 3, 4, 5, 6].includes(rank))) {
          countranks[n]++;
        }
      }
    }

    const probability = countranks.map(
      (count) => (count / numSimulations) * 100
    );
    const resultText = probability
      .map(
        (prob, index) =>
          `馬 ${index + 1} が 2位から6位になる確率: ${prob.toFixed(2)}%`
      )
      .join("<br>");
    document.getElementById("result").innerHTML = resultText;

    alert("シミュレーションが終了しました。");
    loadingElement.classList.add("hidden");
  }, 100);
}

// ページロード時に馬の入力フォームを作成
createHorseInputs();
