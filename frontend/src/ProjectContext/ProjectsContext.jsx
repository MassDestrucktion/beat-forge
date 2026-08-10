import { createContext, useContext, useState } from "react";

const ProjectsContext = createContext();

export function ProjectProvider({children}) {
    const[featuredProjects, setFeaturedProjects] = useState({});


const value = {featuredProjects, setFeaturedProjects};

return (
    <ProjectsContext.Provider value={value} >
        {children}
    </ProjectsContext.Provider>
);
}

//Hook
export function userProjectsContext() {
    const context = useContext(ProjectsContext);
     if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

