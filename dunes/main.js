const musicGallery = document.getElementById("music-gallery");

// Example music data
const musicData = [
    { title: "1.wav", image: "assets/1.bmp", file: "assets/1.wav" },
    { title: "2.wav", image: "assets/2.bmp", file: "assets/2.wav" },
    { title: "3.wav", image: "assets/3.webp", file: "assets/3.wav" }
];

// Create the music player elements
musicData.forEach((music, index) => {
    const musicCard = document.createElement("div");
    musicCard.className = "music-card";

    const musicImage = document.createElement("img");
    musicImage.src = music.image;
    musicImage.alt = music.title;

    const musicTitle = document.createElement("p");
    musicTitle.textContent = music.title;

    const audio = new Audio(music.file);

    // Add click listener to toggle play/pause
    musicCard.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
            musicCard.classList.add("playing");
        } else {
            audio.pause();
            musicCard.classList.remove("playing");
        }
    });

    musicCard.appendChild(musicImage);
    musicCard.appendChild(musicTitle);
    musicGallery.appendChild(musicCard);
});
