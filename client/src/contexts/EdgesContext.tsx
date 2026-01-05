import React, { createContext, useContext, ReactNode } from 'react';

interface EdgeData {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
}

interface EdgesContextType {
  edges: EdgeData[];
}

const EdgesContext = createContext<EdgesContextType>({ edges: [] });

export const useEdgesContext = () => useContext(EdgesContext);

interface EdgesProviderProps {
  edges: EdgeData[];
  children: ReactNode;
}

/**
 * Provider that makes edge data available to SpreadEdge components.
 * This allows SpreadEdge to work in different contexts:
 * - Main app (edges from store)
 * - Public viewer (edges from static data)
 * - Standalone viewer (edges from embedded data)
 */
export const EdgesProvider: React.FC<EdgesProviderProps> = ({ edges, children }) => {
  return (
    <EdgesContext.Provider value={{ edges }}>
      {children}
    </EdgesContext.Provider>
  );
};
