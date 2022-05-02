var AUD = document.createElement("audio");
AUD.preload = "auto";

var src = document.createElement("source");
src.src = "data/severed_head_120.mp3";
var tracks = [{
    selection: "music-selection-option-track-1",
    src: "data/severed_head_120.mp3",
    bpm: 120
}, {
    selection: "music-selection-option-track-2",
    src: "data/with_love_to_an_ex_76.mp3",
    bpm: 76
}];

AUD.appendChild(src);
AUD.onload = (e) => {
    AUD.currentTime = 0;
    AUD.pause();
}
AUD.load();
AUD.volume = 0.25;

function play(selection) {
    let track = tracks.find(track => track.selection === selection);
    if (track) {
        AUD.currentTime = 0.0;
        SHUFFLE = 1;
        playTrack(track);
        SYNC_OFFSET = -( T % TEMPO );
    }
}

function stop() {
    SHUFFLE = 0;
    SYNC_OFFSET = 0;
    AUD.currentTime = 0.00;
    AUD.pause();
}

function jamz(button) {
    let musicSelectionId = button.id;
    if (musicSelectionId === 'music-selection-option-off') {
        stop();
    } else {
        play(musicSelectionId);
    }
}

function playTrack(track) {
    src.src = track.src;
    setBPM(track.bpm);
    AUD.load();
    setTimeout(function() { AUD.play(); }, 1);
}

function setBPM(bpm, beatCount=4, beatDrop=0) {
    BPM = bpm;
    BEAT_COUNT = beatCount;
    BEAT_DROP = beatDrop;
    TEMPO = ( 60 * 1000 ) * BEAT_COUNT / BPM;
}
