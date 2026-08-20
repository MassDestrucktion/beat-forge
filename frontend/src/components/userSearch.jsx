import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserSearch() {
  const [formData, setFormData] = useState("");
  const [searchResults, setSearchResults] = useState([]);
    const navigate = useNavigate();

  useEffect(() => {
    if (!formData.trim()) {
      setSearchResults([]);
      return;
    }

    async function searchUsers() {
      
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(formData)}`
        );

        const data = await response.json();

        console.log("SEARCH DATA:", data);

        setSearchResults(data);
      } catch (error) {
        console.error("User search failed:", error);
      }
    }

    searchUsers();
  }, [formData]);
  console.log("REACT SEARCH RESULTS:", searchResults);



  return (
    <div className="userSearch">
      <input
        type="search"
        value={formData}
        onChange={(event) => setFormData(event.target.value)}
        placeholder="Find Creators"
      />

      {searchResults.length > 0 && (
  <div className="searchResults">
    {searchResults.map((user) => (
      <div key={user.id}
      onClick={() => navigate(`/userPage/${user.id}` )}
      className="searchResult">
        {user.username}
      </div>
    ))}
    
  </div>
      )}
      </div>

);
}

