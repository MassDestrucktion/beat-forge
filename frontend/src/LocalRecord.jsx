import * as Tone from "tone";

export default async function recordSound() {
const recorder = new Tone.Recorder();

//Replace testSynth with output from our board
const testSynth = new Tone.Synth.connect(recorder)

recorder.start();

// testing synth Play notes
synth.triggerAttackRelease("C4", "0.5");
synth.triggerAttackRelease("E4", "0.5", "+0.5");
synth.triggerAttackRelease("G4", "0.5", "+1.0");

//Stop recording after 2 seconds and download
setTimeout(async () => {
    const recording = await recorder.stop();
    const url = URL.createObjectURL(recording);
    const anchor = document.createElement("a");
  anchor.download = "sound.webm";
  anchor.href = url;
  anchor.click();
}, 2000);
}