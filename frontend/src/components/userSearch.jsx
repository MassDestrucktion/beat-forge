import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import default_Pic from "../media/default_Pic.jpg";
import cool from "../media/cool.jpg";
import glasses from "../media/glasses.jpg";
import headphones from "../media/DarkHeadphones.jpg";
import gorilla from "../media/Gorilla.jpg";
import AVDreds from "../media/AVDreds.png";
import BlockParty from "../media/BlockParty.jpg";

const profilePictures = [
  { id: "default_pic", src: default_Pic },
  { id: "default_Pic", src: default_Pic },
  { id: "BlockParty", src: BlockParty },
  { id: "cool", src: cool },
  { id: "glasses", src: glasses },
  { id: "headphones", src: headphones },
  { id: "gorilla", src: gorilla },
  { id: "AVDreds", src: AVDreds },
];

function resolveAvatar(picurl) {
  return (
    profilePictures.find((picture) => picture.id === picurl)?.src || default_Pic
  );
}

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    async function searchUsers() {
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
        );

        if (!response.ok) return;

        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("User search failed:", error);
      }
    }

    searchUsers();
  }, [query]);

  return (
    <div className="userSearch">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Find Creators"
      />

      {searchResults.length > 0 && (
        <div className="searchResults">
          {searchResults.map((user) => (
            <div
              key={user.id}
              onClick={() => navigate(`/userPage/${user.id}`)}
              className="searchResult"
            >
              <img
                className="search-result-avatar"
                src={resolveAvatar(user.picurl)}
                alt={`${user.username}'s avatar`}
              />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
