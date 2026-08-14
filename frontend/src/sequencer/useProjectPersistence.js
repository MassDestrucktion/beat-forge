// src/sequencer/useProjectPersistence.js

import { useEffect, useState } from "react";

import * as Tone from "tone";

import { useSearchParams, useLocation } from "react-router";

import { useAuth } from "../AuthContext/AuthContext.jsx";

import { normalizeProject } from "./projectModel";

/**
 * Owns project metadata (name, description, id, share state, save
 * status) and all backend persistence:
 *
 * - loading projects from the URL (?projectId= / ?sharedId=)
 * - save / update
 * - share link generation
 * - manual load by project ID
 * - "Add to My Library" for shared projects
 *
 * Musical state (grid, settings, bpm, arrangement) stays in the
 * page; this hook receives the setters so applyProject() can load
 * a fetched project into the page.
 */
export function useProjectPersistence({
  bpm,
  grid,
  trackSettings,
  arrangement,

  setBpm,
  setGrid,
  setTrackSettings,
  setNumTracks,
  setArrangement,
}) {
  const { isAuthenticated, token, user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const location = useLocation();

  /**
   * -------------------------------------------------------
   * PROJECT METADATA STATE
   * -------------------------------------------------------
   */

  /**
   * This maps directly to projects.name.
   */
  const [projectName, setProjectName] = useState("");

  /**
   * This maps directly to projects.description.
   */
  const [projectDescription, setProjectDescription] = useState("");

  /**
   * This maps to projects.id.
   */
  const [projectId, setProjectId] = useState(null);

  const [saveStatus, setSaveStatus] = useState("");

  const [loadId, setLoadId] = useState("");

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  /**
   * Share state.
   *
   * shared_id comes from the project row.
   */
  const [sharedId, setSharedId] = useState(null);

  const [isSharedView, setIsSharedView] = useState(false);

  const [sharedBy, setSharedBy] = useState("");

  const [shareLink, setShareLink] = useState("");

  /**
   * -------------------------------------------------------
   * APPLY PROJECT
   * -------------------------------------------------------
   */

  const applyProject = (incomingProject) => {
    const project = normalizeProject(incomingProject);

    setProjectName(project.name);
    setProjectDescription(project.description);

    setProjectId(project.id || null);

    setBpm(project.tempo);

    Tone.Transport.bpm.value = project.tempo;

    setGrid(project.grid);

    setTrackSettings(project.track_settings);

    setNumTracks(project.grid.length);

    setArrangement(project.arrangement);

    setSharedId(project.shared_id || null);
  };

  /**
   * -------------------------------------------------------
   * LOAD PROJECT FROM URL
   * -------------------------------------------------------
   */

  useEffect(() => {
    const projectIdFromUrl = searchParams.get("projectId");

    const sharedIdFromUrl = searchParams.get("sharedId");

    if (!projectIdFromUrl && !sharedIdFromUrl) {
      return;
    }

    if (location.state?.fromCustomize) {
      return;
    }

    if (initialLoadDone) {
      return;
    }

    const loadProjectFromUrl = async () => {
      /**
       * SHARED PROJECT
       */

      if (sharedIdFromUrl && !projectIdFromUrl) {
        setSaveStatus("Loading shared project...");

        try {
          const response = await fetch(
            `/api/projects/shared/${sharedIdFromUrl}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            },
          );

          if (!response.ok) {
            const text = await response.text();

            throw new Error(text || "Failed to load shared project");
          }

          const project = normalizeProject(await response.json());

          applyProject(project);

          setIsSharedView(true);
          setSharedId(project.shared_id || sharedIdFromUrl);
          setSharedBy(project.username || "");
          setProjectId(null);

          setSaveStatus(`Loaded shared project "${project.name}"`);
        } catch (error) {
          setSaveStatus(`Load failed: ${error.message}`);
        } finally {
          setInitialLoadDone(true);
        }

        return;
      }

      /**
       * OWNED PROJECT
       */

      setSaveStatus("Loading project...");

      try {
        const response = await fetch(
          `/api/users/${user.id}/projects/${projectIdFromUrl}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        );

        if (!response.ok) {
          const text = await response.text();

          throw new Error(text || "Failed to load project");
        }

        const project = normalizeProject(await response.json());

        applyProject(project);

        setSharedId(project.shared_id || null);

        setSaveStatus(`Loaded "${project.name}"`);
      } catch (error) {
        setSaveStatus(`Load failed: ${error.message}`);
      } finally {
        setInitialLoadDone(true);
      }
    };

    loadProjectFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, token, initialLoadDone, location.state]);

  /**
   * -------------------------------------------------------
   * SAVE PROJECT
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * The frontend payload mirrors the projects table.
   *
   * We send:
   *
   *   name
   *   description
   *   tempo
   *   grid
   *   track_settings
   *   arrangement
   *
   * We do NOT send:
   *
   *   id
   *   user_id
   *   created_at
   *   updated_at
   *   shared_id
   *
   * Those belong to the backend/database.
   */

  const saveProject = async () => {
    if (!projectName.trim()) {
      setSaveStatus("Please enter a project name.");

      return;
    }

    if (!isAuthenticated) {
      setSaveStatus("Please log in to save your project.");

      return;
    }

    const payload = {
      name: projectName.trim(),

      description: projectDescription.trim() || null,

      tempo: bpm,

      grid,

      track_settings: trackSettings,

      arrangement,
    };

    const isUpdate = Boolean(projectId);

    try {
      const url = isUpdate
        ? `/api/users/${user.id}/projects/${projectId}`
        : `/api/users/${user.id}/projects`;

      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",

          Authorization: token ? `Bearer ${token}` : "",
        },

        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text();

        throw new Error(err || "Failed to save project");
      }

      const project = normalizeProject(await response.json());

      /**
       * Backend is authoritative after save.
       */
      setProjectId(project.id);

      setSharedId(project.shared_id || null);

      setProjectName(project.name);

      setProjectDescription(project.description);

      setSearchParams({
        projectId: String(project.id),
      });

      setInitialLoadDone(true);

      setSaveStatus(
        isUpdate ? `Updated "${project.name}"` : `Saved "${project.name}"`,
      );
    } catch (error) {
      setSaveStatus(`Save failed: ${error.message}`);
    }
  };

  /**
   * -------------------------------------------------------
   * SHARE PROJECT
   * -------------------------------------------------------
   */

  const shareProject = async () => {
    if (!projectId) {
      setSaveStatus("Please save your project first.");

      return;
    }

    if (!isAuthenticated) {
      setSaveStatus("Please log in to share your project.");

      return;
    }

    setSaveStatus("Generating share link...");

    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const err = await response.text();

        throw new Error(err || "Failed to share project");
      }

      const project = normalizeProject(await response.json());

      setSharedId(project.shared_id);

      const link = `${window.location.origin}/sequencer?sharedId=${project.shared_id}`;

      setShareLink(link);

      setSaveStatus("Project shared! Link copied to clipboard.");

      navigator.clipboard.writeText(link);
    } catch (error) {
      setSaveStatus(`Share failed: ${error.message}`);
    }
  };

  /**
   * -------------------------------------------------------
   * ADD TO MY LIBRARY
   * -------------------------------------------------------
   */

  const addToMyLibrary = () => {
    setIsSharedView(false);

    setSharedId(null);

    setSharedBy("");

    setProjectId(null);

    setProjectName(`Copy of ${projectName}`);

    setSaveStatus(
      "Edit your copy, then click 'Save Project' to add it to your library.",
    );

    setSearchParams({});
  };

  /**
   * -------------------------------------------------------
   * MANUAL LOAD
   * -------------------------------------------------------
   */

  const loadProject = async () => {
    if (!loadId.trim()) {
      setSaveStatus("Please enter a project ID to load.");

      return;
    }

    if (!isAuthenticated) {
      setSaveStatus("Please log in to load your project.");

      return;
    }

    try {
      const response = await fetch(
        `/api/users/${user.id}/projects/${loadId.trim()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      if (!response.ok) {
        const err = await response.text();

        throw new Error(err || "Failed to load project");
      }

      const project = normalizeProject(await response.json());

      applyProject(project);

      setSharedId(project.shared_id || null);

      setIsSharedView(false);

      setSharedBy("");

      setInitialLoadDone(true);

      setSearchParams({
        projectId: String(project.id),
      });

      setSaveStatus(`Loaded "${project.name}"`);
    } catch (error) {
      setSaveStatus(`Load failed: ${error.message}`);
    }
  };

  return {
    projectName,
    setProjectName,

    projectDescription,
    setProjectDescription,

    projectId,
    setProjectId,

    saveStatus,
    setSaveStatus,

    loadId,
    setLoadId,

    initialLoadDone,
    setInitialLoadDone,

    sharedId,
    setSharedId,

    isSharedView,
    setIsSharedView,

    sharedBy,
    setSharedBy,

    shareLink,
    setShareLink,

    setSearchParams,

    applyProject,
    saveProject,
    shareProject,
    loadProject,
    addToMyLibrary,
  };
}
