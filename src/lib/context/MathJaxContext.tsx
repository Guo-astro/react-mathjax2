// MathJaxContext.tsx
import { FC } from "react";
import { MathJaxBaseContextProps } from "./types";
import MathJaxBaseContextProvider from "./MathJaxBaseContext";

export const MathJaxContext: FC<MathJaxBaseContextProps> = (props) => {
  return <MathJaxBaseContextProvider {...props} />;
};
