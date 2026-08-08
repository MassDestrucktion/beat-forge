import { Link } from "react-router-dom";
import prototypeImg from './media/prototype-enclosure.jpeg';
import djPic from './media/Dj-pic.jpg';
import { NavLink } from "react-router-dom";

export default function LandingPage() {
  return (
    <div>
      <h1>BeatForge</h1>
      <h3>Beat synthesizer for creating collaborative groovs </h3>
      <div>
        <p> BeatForge is a dynamic web-based beat-creating appliacation that allows you to create, save, and share 16-step beat patterns.</p>
      </div>
      <div className="landingGrid">
        <NavLink to="/getting-started" className="landingItem1">
        <h3>Getting Started</h3>
        <img src={prototypeImg} alt="Prototype enclosure" height="200px" width="300" />
        </NavLink>
          <NavLink to="featuredprojects" className="landingItem2">
        <h3>Featured Tracks</h3>
        <img src={djPic} alt="DJ pic" height="200px" width="300"  />
        </NavLink>
      </div>
    </div>
  );
}
