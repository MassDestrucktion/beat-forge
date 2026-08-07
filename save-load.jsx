import Tone from "tone";
import axios from "axios";


const NUM_TRACKS = 4;
const NUM_STEPS = 16;

const track_name = "CoolBeats"
const trackConfig = [
    {type: "MembraneSyth", note:"A1", duration: "8n"},
    {type: "NoiseSynth", note: "1n"},
    {type: MetalSyth, note: "2n"},
    {type: Synth, note: "c4", "2n"}
];


//Save Functions:
export default function savePayloadBody() {
    return {
        name: track_name,
        savedAt: new Date().toISOString(),
         transport: {
            bpm: Tone.Transport.bpm.value,
            },
            tracks: grid.map((steps, trackIndex) => ({
                trackIndex: trackIndex,
                instrumentType: trackConfig[trackIndex].type,
                note: trackConfig[trackIndex].note,
                duration: trackConfig[trackIndex].duration,
                steps,
            })),

    };
};
export default async function SaveProject() {
    try{
    const response = await axios.post("/trackurl", savePayloadBody(), {
        headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
        }
        }
);
    console.log('Status:', response.status);
    console.log('Body:', response.data);
}
catch(error){
    if (error.responese){
        console.log(error.response.status)}
    else{
        console.log(error.message)
    }
}

};


// Load Functions:

const getSequence = () => {
    return {
        name: track_name,
        savedAt: new Date().toISOString(),
        transport: {
            bpm: Tone.Transport.bpm.value,
            },
     tracks: grid.map((steps, trackIndex) => ({
                trackIndex: trackIndex,
                instrumentType: trackConfig[trackIndex].type,
                note: trackConfig[trackIndex].note,
                duration: trackConfig[trackIndex].duration,
                steps,
            })),
        }
};

export default async function loadProject() {
    try{
    const response = axios.get("URL/:id" );
    console.log(response.data)
    }
    catch(error) {
        console.log(error)
    }
};