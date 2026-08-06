
export default function getingStarted(){
    return(
        <div>
        <h1>Getting Started</h1>
        <p>You can play around with the synth all you want, but to Work together, Save, and Share,
            you have to Register an account.
        </p>
        
        <h4>How use Sequencer</h4>
        <p> The Sequencer has 4 tacks.  
            To start pick an instrament from the drop down menu.
            Currently only 1 instrument per track. 
            Next click the time stamp (1-16) to highlight when the instraument will play.
            You can ajust the BPM (beats/minute) with the slider.
            Hit play to hear your beat, or Clear to start over.
            </p>
        <h4>General info</h4>
        <p> once you are registered you can see a list and return to your saved projects to keep working! </p>
        <Button onClick="location.href='another-page.html'">Start Here</Button>
        </div>
    )
}