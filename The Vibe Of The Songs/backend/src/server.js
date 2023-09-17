const express = require("express");
const cors = require("cors");
const nodeID3 = require("node-id3");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const rangeParser = require("range-parser");
const fs = require("fs");
const app = express();
app.use(cors());
app.use(express.json());

const AudioDir = path.join(__dirname, "../DB/Music/");

app.post("/getallsongs", async (req, res) => {
    const MusicsDir = "./DB/Music/";
    const IndexMusic = req.body.indexSong;

    fs.readdir(MusicsDir, async (err, files) => {
        if(err) console.error(err);
        if(files.length === IndexMusic){
            res.json({ break: true });
            return;
        }

        const filepatch = `${MusicsDir}${files[IndexMusic]}`;
        const tags = nodeID3.read(filepatch);
        const title = tags.title || "Título Desconhecido";
        const artist = tags.artist || "Artista Desconhecido";
        const coverImg = tags.image.imageBuffer || undefined;

        const data = {
            title: title,
            artist: artist,
            cover: coverImg,
            url: files[IndexMusic],
        }

        res.send(data);
    });
});

const sendAudioChunks = (req, res, audioPath) => {
    const totalSize = fs.statSync(audioPath).size;

    const ranges = rangeParser(totalSize, req.headers.range, { combine: true });
    if(ranges === -1) return;

    ffmpeg()
    .input(audioPath)
    .audioCodec("libmp3lame")
    .format("mp3")
    .outputOptions("-movflags frag_keyframe+empty_moov")
    .on("start", () => {
        const { start, end } = ranges[0];
        res.status(206).set({
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
            "Content-Type": "audio/mpeg",
        });
    })
    .pipe(res, { end: true });
}

app.post("/musicstreaming", (req, res) => {
    const musicSelected = req.body.musicSelected;
    const audioPath = path.join(AudioDir, `${musicSelected}`);

    if(fs.existsSync(audioPath)){
        if(req.headers.range){
            sendAudioChunks(req, res, audioPath);
        } else {
            res.sendFile(audioPath);

            app.post("/duration", (req, res) => {
                const selected = req.body.musicSelected;
                const dir = `./DB/Music/${selected}`;
                
                ffmpeg.ffprobe(dir, (err, data) => {
                    if(err) console.error(err);
                    const duration = data.format.duration;
                    res.json({ duration: duration });
                });
            });
        }
    } else {
        res.json({ error: "audio not found" });
    }
});

app.listen(1018, console.log("Server Running Port 1018"));