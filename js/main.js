document.querySelectorAll(".most-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const job = btn.closest(".job");
    const isActive = job.classList.contains("green");

    document.querySelectorAll(".job").forEach((j) => {
      j.classList.remove("green");
      j.querySelector(".most-btn").textContent = "Most recent?";
    });

    if (!isActive) {
      job.classList.add("green");
      btn.textContent = "most recent";
    }
  });
});

document.querySelectorAll(".like-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const item = btn.closest(".education-item");
    const isLiked = item.classList.contains("liked");

    document
      .querySelectorAll(".education-item")
      .forEach((i) => i.classList.remove("liked"));

    if (!isLiked) {
      item.classList.add("liked");
    }
  });
});

function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${
    event.clientX - button.getBoundingClientRect().left - radius
  }px`;
  circle.style.top = `${
    event.clientY - button.getBoundingClientRect().top - radius
  }px`;
  circle.classList.add("ripple");

  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) ripple.remove();

  button.appendChild(circle);
}

document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", createRipple);
});

const editButton = document.getElementById("edit-resume");
const downloadButton = document.getElementById("download-pdf");
const editableElements = document.querySelectorAll("[data-editable]");
const container = document.querySelector(".container");

let isEditing = false;

editButton.addEventListener("click", () => {
  isEditing = !isEditing;

  if (isEditing) {
    container.classList.add("edit-mode");
    editButton.textContent = "Сохранить";

    editableElements.forEach((el) => {
      el.contentEditable = true;
    });
  } else {
    container.classList.remove("edit-mode");
    editButton.textContent = "Редактировать";

    saveChanges();

    editableElements.forEach((el) => {
      el.contentEditable = false;
      el.classList.add("highlight");
      setTimeout(() => el.classList.remove("highlight"), 1000);
    });
  }
});

function saveChanges() {
  editableElements.forEach((el) => {
    const key = el.getAttribute("data-editable");
    localStorage.setItem(key, el.textContent);
  });

  const mostRecentJob = document.querySelector(".job.green");
  if (mostRecentJob) {
    localStorage.setItem("mostRecentJob", mostRecentJob.dataset.id);
  }

  const likedItem = document.querySelector(".education-item.liked");
  if (likedItem) {
    localStorage.setItem("likedEducation", likedItem.dataset.id);
  }
}

function loadSavedData() {
  editableElements.forEach((el) => {
    const key = el.getAttribute("data-editable");
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
      el.textContent = savedValue;
    }
  });

  const mostRecentJobId = localStorage.getItem("mostRecentJob");
  if (mostRecentJobId) {
    const job = document.querySelector(`.job[data-id="${mostRecentJobId}"]`);
    if (job) {
      job.classList.add("green");
      job.querySelector(".most-btn").textContent = "Most recent";
    }
  }

  const likedEducationId = localStorage.getItem("likedEducation");
  if (likedEducationId) {
    const eduItem = document.querySelector(
      `.education-item[data-id="${likedEducationId}"]`
    );
    if (eduItem) {
      eduItem.classList.add("liked");
    }
  }
}

function forceEllipsisStyles() {
  const elements = document.querySelectorAll(`
    .job h3,
    .job .job-details,
    .education-item .year,
    .education-item .degree,
    .education-item .institution,
    .interests span
  `);

  elements.forEach((el) => {
    el.style.whiteSpace = "nowrap";
    el.style.overflow = "hidden";
    el.style.textOverflow = "ellipsis";
    el.style.display = "block";
  });
}

downloadButton.addEventListener("click", async () => {
  const button = document.getElementById("download-pdf");
  const originalButtonText = button.textContent;
  button.textContent = "Генерация PDF...";
  button.disabled = true;

  const actionButtons = document.querySelector(".action-buttons");
  const mostButtons = document.querySelectorAll(".most-btn");
  const likeButtons = document.querySelectorAll(".like-btn");

  try {
    const wasEditing = isEditing;

    if (isEditing) {
      isEditing = false;
      container.classList.remove("edit-mode");
      editButton.textContent = "Редактировать";
      saveChanges();
      editableElements.forEach((el) => {
        el.contentEditable = false;
      });
    }

    const originalContainerClasses = container.className;

    container.classList.add("force-ellipsis");
    container.classList.add("print-mode");

    const originalStyles = {
      position: container.style.position,
      top: container.style.top,
      left: container.style.left,
      width: container.style.width,
      height: container.style.height,
      zIndex: container.style.zIndex,
      boxShadow: container.style.boxShadow,
      transform: container.style.transform,
    };

    const originalActionVisibility = actionButtons.style.visibility;
    const originalMostVisibility = Array.from(mostButtons).map(
      (btn) => btn.style.visibility
    );
    const originalLikeVisibility = Array.from(likeButtons).map(
      (btn) => btn.style.visibility
    );

    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.zIndex = "10000";
    container.style.boxShadow = "none";
    container.style.transform = "none";

    actionButtons.style.visibility = "hidden";
    mostButtons.forEach((btn) => (btn.style.visibility = "hidden"));
    likeButtons.forEach((btn) => (btn.style.visibility = "hidden"));

    forceEllipsisStyles();

    await convertSvgsToDataUrls();

    await waitForImages();

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.querySelector(".container");
        if (clonedContainer) {
          clonedContainer.style.animation = "none";
          clonedContainer.classList.add("force-ellipsis");
        }
        clonedDoc.querySelectorAll(".job.green .most-btn").forEach((btn) => {
          btn.style.visibility = "visible";
        });
        clonedDoc
          .querySelectorAll(".education-item.liked .like-btn")
          .forEach((btn) => {
            btn.style.visibility = "visible";
          });
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("resume.pdf");

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error("Ошибка при генерации PDF:", error);
    alert("Произошла ошибка при генерации PDF. Пожалуйста, попробуйте снова.");
  } finally {
    Object.assign(container.style, {
      position: originalStyles.position || "",
      top: originalStyles.top || "",
      left: originalStyles.left || "",
      width: originalStyles.width || "",
      height: originalStyles.height || "",
      zIndex: originalStyles.zIndex || "",
      boxShadow: originalStyles.boxShadow || "",
      transform: originalStyles.transform || "",
    });

    container.className = originalContainerClasses;

    actionButtons.style.visibility = originalActionVisibility;
    mostButtons.forEach((btn, i) => {
      btn.style.visibility = originalMostVisibility[i] || "";
    });
    likeButtons.forEach((btn, i) => {
      btn.style.visibility = originalLikeVisibility[i] || "";
    });

    if (wasEditing) {
      isEditing = true;
      container.classList.add("edit-mode");
      editButton.textContent = "Сохранить";
      editableElements.forEach((el) => {
        el.contentEditable = true;
      });
    }

    button.textContent = originalButtonText;
    button.disabled = false;

    await restoreOriginalSvgs();
  }
});

async function restoreOriginalSvgs() {
  const svgImages = document.querySelectorAll('img[src$=".svg"]');

  const promises = Array.from(svgImages).map((img) => {
    return new Promise((resolve) => {
      if (img.dataset.originalSrc) {
        img.src = img.dataset.originalSrc;
        delete img.dataset.originalSrc;
      }
      resolve();
    });
  });

  await Promise.all(promises);
}

async function waitForImages() {
  return new Promise((resolve) => {
    const images = Array.from(document.querySelectorAll("img"));
    let loadedCount = 0;

    if (images.length === 0) {
      resolve();
      return;
    }

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= images.length) resolve();
    };

    images.forEach((img) => {
      if (img.complete) {
        checkComplete();
      } else {
        img.addEventListener("load", checkComplete);
        img.addEventListener("error", checkComplete);
      }
    });
  });
}

async function convertSvgsToDataUrls() {
  const svgImages = document.querySelectorAll('img[src$=".svg"]');

  const promises = Array.from(svgImages).map((img) => {
    return new Promise(async (resolve) => {
      try {
        img.dataset.originalSrc = img.src;
        const response = await fetch(img.src);
        if (!response.ok) throw new Error("Network error");
        const svgText = await response.text();
        const blob = new Blob([svgText], { type: "image/svg+xml" });
        img.src = URL.createObjectURL(blob);
      } catch (error) {
        console.warn("Не удалось конвертировать SVG:", img.src, error);
      } finally {
        resolve();
      }
    });
  });

  await Promise.all(promises);
  return new Promise((resolve) => setTimeout(resolve, 300));
}

window.addEventListener("DOMContentLoaded", loadSavedData);
