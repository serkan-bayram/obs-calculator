const MIN_FINAL_GRADE = 50;
const MIN_AVERAGE = 45;

// Dersin adını verir
// course -> dersin ana container'ı
const getCourseName = (course) => {
  return course.querySelectorAll("td")[1].innerText.trim();
};

// Sınavın yüzdelik değerini verir
const getPercentage = (exam) => {
  const percentage = exam.querySelectorAll("td")[0].innerText;
  const indexOfPercentage = exam.innerText.indexOf("%");

  // sınavın yüzdelik etkisi
  let number = "";

  for (let i = indexOfPercentage + 1; percentage[i] !== ")"; i++) {
    number += percentage[i];
  }

  return parseFloat(number);
};

// Sınavın adını verir
const getExamName = (exam) => {
  return exam.querySelectorAll("td")[0].innerText.split("(")[0];
};

// Sınavın notunu döndürür
const getGrade = (exam) => {
  return exam.querySelectorAll("td")[1].innerText;
};

// Bir ders için
// Sınav isimlerini, yüzdeliklerini, ve notlarını
// Döndürür
const getExams = (course) => {
  const examsContainer = course
    .querySelectorAll("td")[3]
    .querySelectorAll("tr");

  const exams = [];

  examsContainer.forEach((exam, index) => {
    // İlk satır -> Tür, Not vs.
    if (index === 0) return;

    const examName = getExamName(exam);
    const grade = getGrade(exam);
    const percentage = getPercentage(exam);

    exams.push({
      exam: exam.querySelectorAll("td")[1],
      examName: examName,
      percentage: percentage,
      grade: grade,
      isEmpty: grade.length === 0,
      isFinal: examName.includes("Final"),
    });
  });

  return exams;
};

// Açıklanmayan sınavların toplamı (yüzdeler dahil şekilde)
// Bu fonksiyonun döndürdüğü değere eşit veya fazla olmalı
const getWhatDoWeNeedToPass = (exams) => {
  let sum = 0;
  exams.forEach((exam) => {
    if (!exam.isEmpty) {
      sum += (parseFloat(exam.grade) * exam.percentage) / 100;
    }
  });

  return MIN_AVERAGE - sum;
};

const calculate = (exams) => {
  // Notu girilmemiş dersler
  const emptyExams = exams.filter((exam) => {
    return exam.grade.length === 0;
  });

  const whatDoWeNeedToPass = getWhatDoWeNeedToPass(exams);

  const calculations = [];

  // Kaç tane girilmemiş not var?
  if (emptyExams.length === 1) {
    // Sınavın yüzdelik değeri
    const percentage = emptyExams[0].percentage;
    const isFinal = emptyExams[0].isFinal;

    for (let ex1 = isFinal ? 50 : 0; ex1 <= 100; ex1 += 0.5) {
      const eq = (percentage * ex1) / 100;

      if (eq >= whatDoWeNeedToPass) {
        calculations.push({
          emptyExam: [emptyExams[0]],
          calculation: [ex1.toFixed(2)],
        });
      }
    }
  }

  if (emptyExams.length === 2) {
    for (let ex1 = 0; ex1 <= 100; ex1 += 0.1) {
      for (let ex2 = emptyExams[1].isFinal ? 50 : 0; ex2 <= 100; ex2 += 0.5) {
        const eq =
          (emptyExams[0].percentage * ex1) / 100 +
          (emptyExams[1].percentage * ex2) / 100;
        if (eq >= whatDoWeNeedToPass) {
          calculations.push({
            emptyExam: [emptyExams[0], emptyExams[1]],
            calculation: [ex1.toFixed(2), ex2.toFixed(2)],
          });
        }
      }
    }
  }

  if (emptyExams.length === 3) {
    for (let ex1 = 0; ex1 <= 100; ex1 += 0.1) {
      for (let ex2 = 0; ex2 <= 100; ex2 += 0.1) {
        for (let ex3 = emptyExams[2].isFinal ? 50 : 0; ex3 <= 100; ex3 += 0.5) {
          const eq =
            (emptyExams[0].percentage * ex1) / 100 +
            (emptyExams[1].percentage * ex2) / 100 +
            (emptyExams[2].percentage * ex3) / 100;
          if (eq >= whatDoWeNeedToPass) {
            calculations.push({
              emptyExam: [emptyExams[0], emptyExams[1], emptyExams[2]],
              calculation: [ex1.toFixed(2), ex2.toFixed(2), ex3.toFixed(2)],
            });
          }
        }
      }
    }
  }

  // Final notuna göre sırala, önce en düşük
  return calculations.sort((a, b) => {
    const lastElementA = a.calculation[a.calculation.length - 1];
    const lastElementB = b.calculation[b.calculation.length - 1];

    return lastElementA - lastElementB;
  });
};

// Her bir elaman bir dersin satırını temsil ediyor
// courses[0] -> Devre Teorisi
// courses[1] -> İşletim Sistemleri gibi
let courses = null;

// courses element'i oluşana kadar bekle
const checkForCourses = () => {
  courses = document.querySelectorAll(
    "#SinavNotGoruntuleme > table > tbody > *"
  );

  if (courses.length > 0) {
    clearInterval(intervalId); // Stop the interval when courses are found
    main();
  }
};
const intervalId = setInterval(checkForCourses, 1000);

// Diğer notları göstereceğimiz element
const createPopup = (info) => {
  const popup = document.createElement("div");
  popup.classList.add("none");

  popup.innerHTML += `${info.courseName} | Diğer Eşleşmeler<br/>`;

  // en düşük diğer 10 not
  for (let i = 1; i < 10; i++) {
    const grades = info.calculations[i].calculation;
    let pair = "";
    grades.forEach((grade) => {
      pair += grade + " ";
    });
    popup.innerHTML += `${pair}<br/>`;
  }

  document.body.appendChild(popup);

  return popup;
};

// Girilmemiş notların yazıldığı input elementi
const createInput = (lowestGrade, infoIndex) => {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("empty-grade");
  input.value = lowestGrade;
  input.setAttribute("data-info-index", infoIndex);

  return input;
};

const infos = [];

const main = () => {
  courses.forEach((course, index) => {
    course.setAttribute("data-course-index", index);

    // Dersin Adı
    const courseName = getCourseName(course);

    // Bir dersin sınavları
    const exams = getExams(course);

    // Hesaplamalar
    const calculations = calculate(exams);

    infos.push({
      course: course,
      courseName: courseName,
      exams: exams,
      calculations: calculations,
    });
  });

  infos.forEach((info, infoIndex) => {
    const lowestCalculation = info.calculations[0];

    // Dersin element'i
    const course = info.course;

    // Girilmemiş notlar üzerinde yapılacak işlemler
    lowestCalculation.emptyExam.forEach((emptyExam, index) => {
      const lowestGrade = lowestCalculation.calculation[index];

      const input = createInput(lowestGrade, infoIndex);

      emptyExam.exam.appendChild(input);

      const popup = createPopup(info);

      course.addEventListener("mouseover", () => {
        popup.classList.remove("none");
        popup.classList.add("hover-item");
      });

      course.addEventListener("mouseleave", () => {
        popup.classList.add("none");
        popup.classList.remove("hover-item");
      });
    });
  });

  // Daha önce yarattığımız inputlar
  const inputs = document.querySelectorAll("[data-info-index]");

  inputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const relatedCourse = e.target.closest("[data-course-index]");
      let currentExam;
      let shouldBreak = false;

      const exams = getExams(relatedCourse);

      exams.forEach((exam) => {
        if (exam.exam === e.target.closest("td")) {
          if (exam.isFinal && e.target.value < 50) {
            alert("KALDIN!");
            shouldBreak = true;
          }

          exam.grade = e.target.value;
          exam.isEmpty = false;
          currentExam = exam;
        }
      });

      if (shouldBreak) {
        return;
      }

      const calculations = calculate(exams);

      // TODO: Burası 2 den fazla açıklanmayan sınav için sorun çıkaracak
      exams.forEach((exam, index) => {
        console.log(exam);
        if (exam.isEmpty) {
          exam.exam.querySelector("input").value =
            calculations[0].calculation[0];
        }
      });

      currentExam.isEmpty = true;
    });
  });
};
