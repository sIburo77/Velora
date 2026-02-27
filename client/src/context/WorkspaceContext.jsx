import { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../services/api';

const WorkspaceContext = createContext(null);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  members: [],
  loading: false,
};

function workspaceReducer(state, action) {
  switch (action.type) {
    case 'SET_WORKSPACES':
      return { ...state, workspaces: action.payload, loading: false };
    case 'SET_CURRENT':
      return { ...state, currentWorkspace: action.payload };
    case 'SET_MEMBERS':
      return { ...state, members: action.payload };
    case 'ADD_WORKSPACE':
      return { ...state, workspaces: [...state.workspaces, action.payload] };
    case 'UPDATE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.map(w =>
          w.id === action.payload.id ? action.payload : w
        ),
        currentWorkspace:
          state.currentWorkspace?.id === action.payload.id
            ? action.payload
            : state.currentWorkspace,
      };
    case 'REMOVE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.filter(w => w.id !== action.payload),
        currentWorkspace:
          state.currentWorkspace?.id === action.payload ? null : state.currentWorkspace,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  const fetchWorkspaces = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const data = await api.getWorkspaces();
    dispatch({ type: 'SET_WORKSPACES', payload: data });
    if (data.length > 0 && !state.currentWorkspace) {
      const saved = localStorage.getItem('velora_workspace');
      const found = saved ? data.find(w => w.id === saved) : null;
      dispatch({ type: 'SET_CURRENT', payload: found || data[0] });
    }
  }, []);

  const selectWorkspace = useCallback((workspace) => {
    dispatch({ type: 'SET_CURRENT', payload: workspace });
    localStorage.setItem('velora_workspace', workspace.id);
  }, []);

  const createWorkspace = useCallback(async (data) => {
    const ws = await api.createWorkspace(data);
    dispatch({ type: 'ADD_WORKSPACE', payload: ws });
    dispatch({ type: 'SET_CURRENT', payload: ws });
    localStorage.setItem('velora_workspace', ws.id);
    return ws;
  }, []);

  const updateWorkspace = useCallback(async (id, data) => {
    const ws = await api.updateWorkspace(id, data);
    dispatch({ type: 'UPDATE_WORKSPACE', payload: ws });
    return ws;
  }, []);

  const deleteWorkspace = useCallback(async (id) => {
    await api.deleteWorkspace(id);
    dispatch({ type: 'REMOVE_WORKSPACE', payload: id });
  }, []);

  const fetchMembers = useCallback(async (wsId) => {
    const data = await api.getMembers(wsId);
    dispatch({ type: 'SET_MEMBERS', payload: data });
    return data;
  }, []);

  const removeMember = useCallback(async (wsId, userId) => {
    await api.removeMember(wsId, userId);
    dispatch({ type: 'SET_MEMBERS', payload: state.members.filter(m => m.user_id !== userId) });
  }, [state.members]);

  return (
    <WorkspaceContext.Provider
      value={{
        ...state,
        fetchWorkspaces,
        selectWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        fetchMembers,
        removeMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
};
