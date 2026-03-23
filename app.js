const fullscreen = document.getElementById("fullscreen");
const fullscreenImg = document.getElementById("fullscreen-img");
const closeBtn = document.querySelector(".fullscreen-close");

document.querySelectorAll(".item img").forEach(img => {
    img.addEventListener("click", () => {
        fullscreenImg.src = img.src;
        fullscreen.classList.add("active");
    });
});

closeBtn.addEventListener("click", () => {
    fullscreen.classList.remove("active");
    fullscreenImg.src = "";
});

fullscreen.addEventListener("click", (e) => {
    if (e.target === fullscreen) {
        fullscreen.classList.remove("active");
        fullscreenImg.src = "";
    }
});
