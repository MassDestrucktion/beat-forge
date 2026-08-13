import * as Tone from "tone";
import { createPiano } from "./createPiano";

export async function testPiano() {
  await Tone.start();

  const piano = createPiano();

  piano.triggerAttackRelease(
    "C4",
    "2n",
    100
  );

  setTimeout(() => {
    piano.dispose();
  }, 5000);
}