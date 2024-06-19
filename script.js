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
  const numSimulations = parseInt(
    document.getElementById("numSimulations").value,
    10
  ); // シミュレーションの回数を取得
  const timeInterval = 1 / 15; // 時間間隔 (1/15秒)
  const initialSpeed = 3; // 初期速度
  const countValidRankings = new Array(numHorses).fill(0); // 各馬の条件に合うランキングのカウント

  for (let i = 0; i < numSimulations; i++) {
    let results = [];
    for (let j = 0; j < numHorses; j++) {
      const K = getHorseK(j); // 馬の加速度Kを計算
      let D = Math.random() * 0.1; // 出遅れ時間をランダムに設定

      // コンセントレーションと集中力のチェック
      if (document.getElementById(`concentration${j}`).checked) {
        D *= 0.4;
      } else if (document.getElementById(`focus${j}`).checked) {
        D *= 0.9;
      }

      let X = initialSpeed; // 初期速度
      let M1, M2, M3, M4, M5; // 各Fの走行距離

      // 1F目の計算
      if (D < timeInterval) {
        M1 = X * (timeInterval - D);
        D = -1;
      } else {
        D -= timeInterval;
        M1 = 0;
      }

      // 2F目の計算
      if (D === -1) {
        X += K * timeInterval;
        M2 = X * timeInterval + M1;
      } else {
        M2 = X * (timeInterval - D) + M1;
      }

      // 3F目の計算
      X += K * timeInterval;
      M3 = X * timeInterval + M2;

      // 4F目の計算
      X += K * timeInterval;
      M4 = X * timeInterval + M3;

      // 5F目の計算
      X += K * timeInterval;
      M5 = X * timeInterval + M4;

      results.push({ M1, M2, M3, M4, M5 });
    }

    // 各馬の順位を計算してログに表示
    const ranks = { M1: [], M2: [], M3: [], M4: [], M5: [] };

    ["M1", "M2", "M3", "M4", "M5"].forEach((metric, index) => {
      results
        .map((result, i) => ({ value: result[metric], index: i }))
        .sort((a, b) => b.value - a.value)
        .forEach((result, rank) => {
          ranks[metric][result.index] = rank + 1;
        });
    });

    // 各馬のランキングをカウント
    results.forEach((_, horseIndex) => {
      if (
        (ranks.M1[horseIndex] >= 2 && ranks.M1[horseIndex] <= 6) ||
        (ranks.M2[horseIndex] >= 2 && ranks.M2[horseIndex] <= 6) ||
        (ranks.M3[horseIndex] >= 2 && ranks.M3[horseIndex] <= 6) ||
        (ranks.M4[horseIndex] >= 2 && ranks.M4[horseIndex] <= 6) ||
        (ranks.M5[horseIndex] >= 2 && ranks.M5[horseIndex] <= 6)
      ) {
        countValidRankings[horseIndex]++;
      }
    });
  }

  // 確率を計算して表示
  const probability = countValidRankings.map(
    (count) => (count / numSimulations) * 100
  );
  const resultText = probability
    .map(
      (prob, index) =>
        `馬 ${index + 1} が 2位から6位になる確率: ${prob.toFixed(2)}%`
    )
    .join("<br>");
  document.getElementById("result").innerHTML = resultText;

  // 処理完了メッセージをポップアップで表示
  alert("シミュレーションが終了しました。");
}

// ページロード時に馬の入力フォームを作成
createHorseInputs();
