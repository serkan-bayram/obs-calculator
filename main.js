const MIN_FINAL_GRADE = 50;
const MIN_AVERAGE = 45;

const getCourseName = (course) => {
  return course.querySelectorAll("td")[1].innerText.trim();
};

const getPercentage = (container) => {
  const percentage = container.querySelectorAll("td")[0].innerText;
  const indexOfPercentage = container.innerText.indexOf("%");

  // sınavın yüzdelik etkisi
  let number = "";

  for (let i = indexOfPercentage + 1; percentage[i] !== ")"; i++) {
    number += percentage[i];
  }

  return parseFloat(number);
};

const getExamName = (container) => {
  return container.querySelectorAll("td")[0].innerText.split("(")[0];
};

const getGrades = (course) => {
  const gradesContainer = course
    .querySelectorAll("td")[3]
    .querySelectorAll("tr");

  const array = [];

  gradesContainer.forEach((container, index) => {
    if (index === 0) return;

    const examName = getExamName(container);
    const grade = container.querySelectorAll("td")[1].innerText;
    const percentage = getPercentage(container);

    array.push({ examName: examName, percentage: percentage, grade: grade });
  });

  return array;
};

// Açıklanmayan sınavlardan toplamda kaç puan almamız gerektiğimizi söylüyor
// Yüzdeler dahil şekilde
const getWhatDoWeNeedToPass = (grades) => {
  let sum = 0;
  grades.forEach((grade) => {
    if (grade.grade.length > 0) {
      sum += (parseFloat(grade.grade) * grade.percentage) / 100;
    }
  });

  return MIN_AVERAGE - sum;
};

const calculate = (grades, whatDoWeNeedToPass) => {
  // notu girilmemiş dersler
  // bu iki dersin ortalaması whatDoWeNeedToPass den fazla olmalı veya eşit
  const notValuatedCourses = grades.filter((grade) => {
    return grade.grade.length === 0;
  });

  const calculations = [];

  if (notValuatedCourses.length === 1) {
    for (let final = 50; final <= 100; final++) {
      const eq = (notValuatedCourses[0].percentage * final) / 100;

      if (eq >= whatDoWeNeedToPass) {
        calculations.push({
          final: final,
          // diff: Math.floor(Math.abs(eq - whatDoWeNeedToPass)),
        });
      }
    }
  }

  // 2 tane girilmeyen ders varsa
  if (notValuatedCourses.length === 2) {
    for (let ex1 = 0; ex1 <= 100; ex1++) {
      for (let final = 50; final <= 100; final++) {
        const eq =
          (notValuatedCourses[0].percentage * ex1) / 100 +
          (notValuatedCourses[1].percentage * final) / 100;
        if (eq >= whatDoWeNeedToPass) {
          calculations.push({
            ex1: ex1,
            final: final,
            // diff: Math.floor(Math.abs(eq - whatDoWeNeedToPass)),
          });
        }
      }
    }
  }

  // 3 tane girilmeyen ders varsa bütün olasılıklar
  if (notValuatedCourses.length === 3) {
    for (let ex1 = 0; ex1 <= 100; ex1++) {
      for (let ex2 = 0; ex2 <= 100; ex2++) {
        for (let final = 50; final <= 100; final++) {
          const eq =
            (notValuatedCourses[0].percentage * ex1) / 100 +
            (notValuatedCourses[1].percentage * ex2) / 100 +
            (notValuatedCourses[2].percentage * final) / 100;
          if (eq >= whatDoWeNeedToPass) {
            calculations.push({
              ex1: ex1,
              ex2: ex2,
              final: final,
              // diff: Math.floor(Math.abs(eq - whatDoWeNeedToPass)),
            });
          }
        }
      }
    }
  }

  return calculations;
};

const getEmptyGrades = (course) => {
  const tbody = course.querySelector("tbody");
  const trs = tbody.querySelectorAll("tr");

  const emptyGrades = [];

  trs.forEach((tr, index) => {
    if (index === 0) return;

    const td = tr.querySelectorAll("td");

    if (td[1].innerText === "") emptyGrades.push(td[1]);
  });

  return emptyGrades;
};

// Her bir elaman bir dersin satırını temsil ediyor
// courses[0] -> Devre Teorisi
// courses[1] -> İşletim Sistemleri gibi
let courses = null;

function checkForCourses() {
  courses = document.querySelectorAll(
    "#SinavNotGoruntuleme > table > tbody > *"
  );

  if (courses.length > 0) {
    clearInterval(intervalId); // Stop the interval when courses are found
    main();
  }
}

// Check for courses every second
const intervalId = setInterval(checkForCourses, 1000);

const createPopup = (info) => {
  // diğer notları göstereceğimiz element
  const elem = document.createElement("div");
  elem.classList.add("none");

  elem.innerHTML += `${info.courseName} | Diğer Eşleşmeler<br/>`;

  // en düşük diğer 10 not
  for (let i = 1; i < 10; i++) {
    const grade = info.calculations[i];
    let pair = "";
    Object.keys(grade).forEach((g) => {
      pair += grade[g] + " ";
    });
    elem.innerHTML += `${pair}<br/>`;
  }

  document.body.appendChild(elem);

  return elem;
};

const infos = [];

const main = () => {
  courses.forEach((course) => {
    // dersin adı
    const courseName = getCourseName(course);

    // boş olan notların td'leri
    const emptyGrades = getEmptyGrades(course);

    // dersin tüm notları
    const grades = getGrades(course);

    // diğer sınavların toplamının whatDoWeNeedToPass olması lazım
    const whatDoWeNeedToPass = getWhatDoWeNeedToPass(grades);

    // olasılıkların hesaplamaları
    const calculations = calculate(grades, whatDoWeNeedToPass);

    const sortedByFinal = calculations.sort((a, b) => a.final - b.final);

    infos.push({
      course: course,
      courseName: courseName,
      grades: grades,
      whatDoWeNeedToPass: whatDoWeNeedToPass,
      calculations: sortedByFinal,
      emptyGrades: emptyGrades,
    });
  });

  infos.forEach((info) => {
    const lowestGrade = info.calculations[0];

    // ders elementi
    const course = info.course;

    // boş olan notlar üzerinde yapılacak işlemler
    info.emptyGrades.forEach((emptyGrade, index) => {
      emptyGrade.classList.add("empty-grade");

      // en düşük notu td'lere yazdırıyoruz
      emptyGrade.innerText = lowestGrade[Object.keys(lowestGrade)[index]];

      const elem = createPopup(info);

      course.addEventListener("mouseover", () => {
        elem.classList.remove("none");
        elem.classList.add("hover-item");
      });

      course.addEventListener("mouseleave", () => {
        elem.classList.add("none");
        elem.classList.remove("hover-item");
      });
    });
  });
};
