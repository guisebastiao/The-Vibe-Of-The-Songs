const pausePlayPlaying = document.querySelector("#pause-play-playing");
const inicialContainer = document.querySelector(".container-inicial");
const boxPlayingMusic = document.querySelector(".box-playing-music");
const musicContainer = document.querySelector(".container-music");
const containerMusics = document.querySelector(".container-musics");
const searchMusic = document.querySelector("#search-music");
const currentTime = document.querySelector("#current-time");
const timeLineRange = document.querySelector("#timeline");
const endTime = document.querySelector("#end-time");
let IndexSongs = 0, MusicPlayingIndex = 0, PausePlay = false, repeat = false, random = false, minCurrent = 0, segCurrent = 0, min = 0, seg = 0, TimelineTime;
const MusicsTemp = [];
const Player = new Audio();
Player.volume = 0.5;

const PanelFunctions = () => {
    (function() {
        const imgChildren = pausePlayPlaying.children;
        imgChildren[0].classList.add("active");
    
        pausePlayPlaying.addEventListener("click", () => {
            if(imgChildren[0].classList.contains("active")){
                imgChildren[0].classList.remove("active");
                imgChildren[1].classList.add("active");
            } else {
                imgChildren[1].classList.remove("active");
                imgChildren[0].classList.add("active");
            }
        });
    })();

    (function() {
        const pausePlay = document.querySelector("#pause-play");
        const imgChildren = pausePlay.children;
        imgChildren[0].classList.add("active");
    
        pausePlay.addEventListener("click", () => {
            if(imgChildren[0].classList.contains("active")){
                imgChildren[0].classList.remove("active");
                imgChildren[1].classList.add("active");
            } else {
                imgChildren[1].classList.remove("active");
                imgChildren[0].classList.add("active");
            }
        });
    })();
    
    (function() {
        const close = document.querySelector("#close");
    
        document.addEventListener("click", (el) => {
            if(el.target.closest("button")) return;
            const temp = el.target.closest(".box-playing-music")
            if(temp){
                inicialContainer.classList.remove("active");
                boxPlayingMusic.classList.remove("active");
                musicContainer.classList.add("active");
            }
        });
    
        close.addEventListener("click", () => {
            inicialContainer.classList.add("active");
            boxPlayingMusic.classList.add("active");
            musicContainer.classList.remove("active");
        });
    })();
}

const GetAllSongs = async () => {
    fetch(`http://localhost:1018/getallsongs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ indexSong: IndexSongs })
    })
    .then(res => res.json())
    .then(async data => {
        if(data.break != true){
            IndexSongs++
            GetAllSongs();
            AddMusicsContainer(data);
        }
    })
    .catch(err => console.error(err));
}

const AddMusicsContainer = (musics) => {
    const name = musics.title;
    const author = musics.artist;
    const url = musics.url;
    if(musics.cover === undefined) {
        const banner = "./img/cover-undefined.png";
        CreateMusicBox(name, author, banner, url);
        return;
    }
    const buffer = new Uint8Array(musics.cover.data);
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const banner = URL.createObjectURL(blob);
    CreateMusicBox(name, author, banner, url);
}

const CreateMusicBox = (name, author, banner, url) => {
    const music = document.createElement("div");
    music.setAttribute("class", "music");
    music.setAttribute("data-MusicUrl", `${url}`);
    music.setAttribute("data-MusicName", `${name}`);
    music.setAttribute("data-MusicAuthor", `${author}`);
    music.setAttribute("data-MusicID", `${IndexSongs - 1}`);
    const coverDiv = document.createElement("div");
    coverDiv.setAttribute("class", "cover-div");
    const coverMusic = document.createElement("img");
    coverMusic.setAttribute("id", "cover-music");
    coverMusic.src = banner;
    const playHover = document.createElement("img");
    playHover.setAttribute("id", "play-hover");
    playHover.src = "./img/play.png";
    const nameAuthorMusic = document.createElement("div");
    nameAuthorMusic.setAttribute("class", "name-author-music");
    const nameMusic = document.createElement("span");
    nameMusic.setAttribute("class", "name-music");
    nameMusic.innerHTML = name;
    const authorMusic = document.createElement("span");
    authorMusic.setAttribute("class", "author-music");
    authorMusic.innerHTML = author;
    const currentDiv = document.createElement("div");
    currentDiv.setAttribute("class", "current-div");
    const current = document.createElement("img");
    current.setAttribute("class", "current");
    current.src = "./img/current.gif";
    music.appendChild(coverDiv);
    coverDiv.appendChild(coverMusic);
    coverDiv.appendChild(playHover);
    music.appendChild(nameAuthorMusic);
    nameAuthorMusic.appendChild(nameMusic);
    nameAuthorMusic.appendChild(authorMusic);
    music.appendChild(currentDiv);
    currentDiv.appendChild(current);
    containerMusics.append(music);
    MusicsTemp.push(music);
}

const chosenMusic = () => {
    document.addEventListener("click", (element) => {
        const musicElement = element.target.closest(".music")

        searchMusic.value = "";
        if(containerMusics.children.length < MusicsTemp.length){
            const musics = document.querySelectorAll(".music");
            musics.forEach(el => { containerMusics.removeChild(el) });
            MusicsTemp.forEach(item => {
                const name = item.dataset.musicname;
                const author = item.dataset.musicauthor;
                const banner = item.children[0].children[0].src;
                const url = item.dataset.musicurl;
                const id = item.dataset.musicid;
                CreateMusicSearch(name, author, banner, url, id);
            });
        }

        if(musicElement){
            const url = musicElement.dataset.musicurl;
            const ID = +musicElement.dataset.musicid;
            MusicPlayingIndex = ID;
            clearInterval(TimelineTime);
            GetMusic(url, musicElement);
        }
    });
}

const GetMusic = (url, musicElement) => {
    const current = document.querySelectorAll(".current");
    const nameMusic = document.querySelectorAll(".name-music");

    fetch(`http://localhost:1018/musicstreaming`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ musicSelected: url })
    })
    .then(res => res.blob())
    .then(async data => {
        const urlBlob = URL.createObjectURL(data);
        fetch(`http://localhost:1018/duration`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ musicSelected: url })
        })
        .then(res => res.json())
        .then(async data2 => {
            const duration = await data2.duration;
            min = 0;
            seg = 0;
            minCurrent = 0;
            segCurrent = 0;
            TimeLine(duration);
            PlayMusic(urlBlob, musicElement);
            current.forEach(el => { if(el.classList.contains("active")){ el.classList.remove("active") }});
            current[MusicPlayingIndex].classList.add("active");
            nameMusic.forEach(el => { if(el.classList.contains("active")){ el.classList.remove("active") }});
            nameMusic[MusicPlayingIndex].classList.add("active");
        })
        .catch(err => { console.error(err) });
    })
    .catch(err => console.error(err));
}

const PlayMusic = (urlBlob, musicElement) => {
    const imgPausePlay = document.querySelectorAll(".play-pause-playing-img");
    Player.src = urlBlob;
    if(musicContainer.classList.contains("active") === false) boxPlayingMusic.classList.add("active");
    BoxPlaying(musicElement);
    AddMusicScreen(musicElement);

    if(PausePlay === false){
        imgPausePlay[0].classList.add("active");
        imgPausePlay[1].classList.remove("active");
        Player.play();
    } else {
        imgPausePlay[0].classList.remove("active");
        imgPausePlay[1].classList.add("active");
        Player.pause();
    }
}

const BoxPlaying = (musicElement) => {
    const playingMusicCover = document.querySelector("#playing-music-cover");
    const playingName = document.querySelector("#playing-name");
    const playingAuthor = document.querySelector("#playing-author"); 
    const cover = musicElement.children[0].children[0].src;
    const name = musicElement.dataset.musicname;
    const author = musicElement.dataset.musicauthor;
    playingMusicCover.src = cover;
    playingName.innerHTML = name;
    playingAuthor.innerHTML = author;
}

const FunctionsBoxPlaying = () => {
    const pausePlayPlaying = document.querySelector("#pause-play-playing");
    const nextMusicPlaying = document.querySelector("#next-music-playing");
    const backMusicPlaying = document.querySelector("#back-music-playing");

    pausePlayPlaying.addEventListener("click", () => {
        if(PausePlay === false){
            Player.pause();
            PausePlay = true;
        } else {
            Player.play();
            PausePlay = false;
        }
    });

    nextMusicPlaying.addEventListener("click", () => {
        NextMusic();
    });

    backMusicPlaying.addEventListener("click", () => {
        BackMusic();
    });
}

const AddMusicScreen = (musicElement) => {
    const coverCurrent = document.querySelector("#cover-current");
    const nameCurrent = document.querySelector("#name-current");
    const authorCurrent = document.querySelector("#author-current"); 
    const cover = musicElement.children[0].children[0].src;
    const name = musicElement.dataset.musicname;
    const author = musicElement.dataset.musicauthor;
    coverCurrent.src = cover;
    nameCurrent.innerHTML = name;
    authorCurrent.innerHTML = author;
}

const FunctionMusicScreen = () => {
    const pausePlay = document.querySelector("#pause-play");
    const nextMusic= document.querySelector("#next-music");
    const backMusic = document.querySelector("#back-music");
    const randomMusic = document.querySelector("#random-music");
    const repeatMusic = document.querySelector("#repeat-music");
    const repeatMusicActiveImg = document.querySelector("#repeat-music-active-img");
    const repeatMusicImg = document.querySelector("#repeat-music-img");
    const randomMusicAtiveImg = document.querySelector("#random-music-active-img");
    const randomMusicImg = document.querySelector("#random-music-img");

    repeatMusicImg.classList.add("active");
    randomMusicImg.classList.add("active");

    pausePlay.addEventListener("click", () => {
        if(PausePlay === false){
            Player.pause();
            PausePlay = true;
        } else {
            Player.play();
            PausePlay = false;
        }
    });

    nextMusic.addEventListener("click", () => {
        NextMusic();
    });

    backMusic.addEventListener("click", () => {
        BackMusic();
    });

    randomMusic.addEventListener("click", () => {
        if(random === false){
            randomMusicAtiveImg.classList.add("active");
            repeatMusicActiveImg.classList.remove("active");
            randomMusicImg.classList.remove("active");
            repeatMusicImg.classList.add("active");
            random = true;
            repeat = false;
        } else {
            randomMusicAtiveImg.classList.remove("active");
            repeatMusicActiveImg.classList.remove("active");
            randomMusicImg.classList.add("active");
            random = false;
            repeat = false;
        }
    });

    repeatMusic.addEventListener("click", () => {
        if(repeat === false){
            repeatMusicActiveImg.classList.add("active");
            randomMusicAtiveImg.classList.remove("active");
            repeatMusicImg.classList.remove("active");
            randomMusicImg.classList.add("active");
            repeat = true;
            random = false;
        } else {
            repeatMusicActiveImg.classList.remove("active");
            randomMusicAtiveImg.classList.remove("active");
            repeatMusicImg.classList.add("active");
            repeat = false;
            random = false;
        }
    });
}


const TimeLine = (dtn) => {
    min = Math.floor(dtn / 60);
    seg = smallerTen(Math.trunc(dtn) % 60);
    endTime.innerHTML = `${min}:${seg}`;
    const maxRange = (+min * 60) + (+seg);
    timeLineRange.max = maxRange;

    TimelineTime = setInterval(() => {
        let current = Math.floor(Player.currentTime);

        const functions = () => {
            minCurrent = Math.floor(current / 60);
            current >= 60 ? segCurrent = smallerTen(current - (minCurrent * 60)) : segCurrent = smallerTen(current);
            currentTime.innerHTML = `${minCurrent}:${segCurrent}`;
            timeLineRange.value = current;
            const currentTimeLine = (current / maxRange) * 100;
            timeLineRange.style.background = `linear-gradient(90deg, #fff 0%, #fff ${currentTimeLine}%, #383868 ${currentTimeLine}%, #383868 100%)`;
        }

        functions();

        timeLineRange.addEventListener("input", () => {
            current = timeLineRange.value;
            Player.currentTime = current;
            functions();
        });

        if(current === maxRange){
            if(repeat === true){
                Player.play();
            } else if(random === true){
                const musics = document.querySelectorAll(".music")
                const sort = Math.floor(Math.random() * musics.length);
                MusicPlayingIndex = sort;
                const url = musics[sort].dataset.musicurl;
                clearInterval(TimelineTime);
                GetMusic(url, musics[sort]);
            } else {
                NextMusic();
            }
        }
    }, 1000);
}

const smallerTen = (number) => {
    return number < 10 ? number = `0${number}` : number;
}

const NextMusic = () => {
    try {
        clearInterval(TimelineTime);
        const musicElement = document.querySelectorAll(".music");
        MusicPlayingIndex > musicElement.length ? MusicPlayingIndex = 0 : MusicPlayingIndex++;
        const currentTime = document.querySelector("#current-time");
        const musicElementTemp = musicElement[MusicPlayingIndex];
        const musicUrl = musicElement[MusicPlayingIndex].dataset.musicurl;
        GetMusic(musicUrl, musicElementTemp);
        timeLineRange.style.background = `linear-gradient(90deg, #fff 0%, #fff 0%, #383868 0%, #383868 100%)`;
        timeLineRange.value = 0;
        currentTime.innerHTML = "0:00";
    } catch(err){ return }
}

const BackMusic = () => {
    try {
        clearInterval(TimelineTime);
        const musicElement = document.querySelectorAll(".music");
        MusicPlayingIndex < 0 ? MusicPlayingIndex = 0 : MusicPlayingIndex--;
        const musicElementTemp = musicElement[MusicPlayingIndex];
        const musicUrl = musicElement[MusicPlayingIndex].dataset.musicurl;
        GetMusic(musicUrl, musicElementTemp);
        timeLineRange.style.background = `linear-gradient(90deg, #fff 0%, #fff 0%, #383868 0%, #383868 100%)`;
        timeLineRange.value = 0;
        currentTime.innerHTML = "0:00";
    } catch(err){ return }
}


searchMusic.oninput = () => {
    const musics = document.querySelectorAll(".music");
    musics.forEach(el => containerMusics.removeChild(el));

    MusicsTemp.forEach(item => {
        const musicName = removeAccentuation(item.dataset.musicname.toLowerCase());
        const inputValue = removeAccentuation(searchMusic.value.toLowerCase());

        if(musicName.includes(inputValue)){
            const name = item.dataset.musicname;
            const author = item.dataset.musicauthor;
            const banner = item.children[0].children[0].src;
            const url = item.dataset.musicurl;
            const id = item.dataset.musicid;
            CreateMusicSearch(name, author, banner, url, id);
        }
    });
}

function removeAccentuation(txt) {
    return txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const CreateMusicSearch = (name, author, banner, url, id) => {
    const music = document.createElement("div");
    music.setAttribute("class", "music");
    music.setAttribute("data-MusicUrl", `${url}`);
    music.setAttribute("data-MusicName", `${name}`);
    music.setAttribute("data-MusicAuthor", `${author}`);
    music.setAttribute("data-MusicID", `${id}`);
    const coverDiv = document.createElement("div");
    coverDiv.setAttribute("class", "cover-div");
    const coverMusic = document.createElement("img");
    coverMusic.setAttribute("id", "cover-music");
    coverMusic.src = banner;
    const playHover = document.createElement("img");
    playHover.setAttribute("id", "play-hover");
    playHover.src = "./img/play.png";
    const nameAuthorMusic = document.createElement("div");
    nameAuthorMusic.setAttribute("class", "name-author-music");
    const nameMusic = document.createElement("span");
    nameMusic.setAttribute("class", "name-music");
    nameMusic.innerHTML = name;
    const authorMusic = document.createElement("span");
    authorMusic.setAttribute("class", "author-music");
    authorMusic.innerHTML = author;
    const currentDiv = document.createElement("div");
    currentDiv.setAttribute("class", "current-div");
    const current = document.createElement("img");
    current.setAttribute("class", "current");
    current.src = "./img/current.gif";
    music.append(coverDiv);
    coverDiv.append(coverMusic);
    coverDiv.append(playHover);
    music.append(nameAuthorMusic);
    nameAuthorMusic.append(nameMusic);
    nameAuthorMusic.append(authorMusic);
    music.append(currentDiv);
    currentDiv.append(current);
    containerMusics.append(music);
}

GetAllSongs();
chosenMusic();
PanelFunctions();
FunctionsBoxPlaying();
FunctionMusicScreen();