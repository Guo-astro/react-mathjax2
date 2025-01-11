import { createContext, FC, useContext, useRef } from "react";
import { MathJax2Config, MathJax2Object } from "../MathJax2";
import { MathJax3Config, MathJax3Object } from "../MathJax3";
import {
  MathJaxBaseContextOverrideableProps,
  MathJaxBaseContextProps,
  MathJaxBaseContextSubscriberProps,
} from "./types";

interface WindowWithMathJax {
  MathJax?: MathJax2Object | MathJax3Object | MathJax2Config | MathJax3Config;
}

export const MathJaxBaseContext = createContext<
  MathJaxBaseContextSubscriberProps | undefined
>(undefined);

const DEFAULT_V2_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";
const DEFAULT_V3_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js";

let v2Promise: Promise<MathJax2Object>;
let v3Promise: Promise<MathJax3Object>;

const MathJaxBaseContextProvider: FC<MathJaxBaseContextProps> = ({
  config,
  version = 3,
  src = version === 2 ? DEFAULT_V2_SRC : DEFAULT_V3_SRC,
  onStartup,
  onLoad,
  onError,
  typesettingOptions,
  renderMode = "post",
  hideUntilTypeset,
  children,
}) => {
  const existingContext = useContext(MathJaxBaseContext);
  if (
    typeof existingContext?.version !== "undefined" &&
    existingContext?.version !== version
  ) {
    throw Error(
      "Cannot nest different MathJax versions. Use a single version in your app."
    );
  }

  if (
    (version === 2 && typeof v3Promise !== "undefined") ||
    (version === 3 && typeof v2Promise !== "undefined")
  ) {
    throw Error(
      "Cannot use MathJax versions 2 and 3 simultaneously. Stick to one version in your app."
    );
  }

  const contextRef = useRef<MathJaxBaseContextSubscriberProps | undefined>(
    existingContext
  );
  const initVersion = useRef<2 | 3 | null>(existingContext?.version || null);

  if (initVersion.current === null) {
    initVersion.current = version;
  } else if (initVersion.current !== version) {
    throw Error("Cannot change MathJax version after context has mounted.");
  }

  const usedSrc = src || (version === 2 ? DEFAULT_V2_SRC : DEFAULT_V3_SRC);

  // Separate injectors for v2 and v3
  function scriptInjectorV2(
    resolve: (value: MathJax2Object | PromiseLike<MathJax2Object>) => void,
    reject: (reason?: Event) => void
  ) {
    if (config) (window as WindowWithMathJax).MathJax = config;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = usedSrc;
    script.async = true;

    script.addEventListener("load", () => {
      const mathJax = (window as WindowWithMathJax).MathJax as MathJax2Object;
      // Use type assertion for onStartup when version is 2
      if (onStartup && version === 2) {
        (onStartup as (mj: MathJax2Object) => void)(mathJax);
      }
      resolve(mathJax);
      if (onLoad) onLoad();
    });
    script.addEventListener("error", (e) => reject(e));
    document.head.appendChild(script);
  }

  function scriptInjectorV3(
    resolve: (value: MathJax3Object | PromiseLike<MathJax3Object>) => void,
    reject: (reason?: Event) => void
  ) {
    if (config) (window as WindowWithMathJax).MathJax = config;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = usedSrc;
    script.async = true;

    script.addEventListener("load", () => {
      const mathJax = (window as WindowWithMathJax).MathJax as MathJax3Object;
      // Use type assertion for onStartup when version is 3
      if (onStartup && version === 3) {
        (onStartup as (mj: MathJax3Object) => void)(mathJax);
      }
      resolve(mathJax);
      if (onLoad) onLoad();
    });
    script.addEventListener("error", (e) => reject(e));
    document.head.appendChild(script);
  }

  if (typeof contextRef.current === "undefined") {
    const baseContext: MathJaxBaseContextOverrideableProps = {
      typesettingOptions,
      renderMode,
      hideUntilTypeset,
    };
    if (version === 2) {
      if (typeof v2Promise === "undefined") {
        if (typeof window !== "undefined") {
          v2Promise = new Promise<MathJax2Object>(scriptInjectorV2);
          v2Promise.catch((e) => {
            if (onError) onError(e as ErrorEvent);
            else {
              throw Error(
                `Failed to download MathJax 2 from '${usedSrc}': ${JSON.stringify(
                  e
                )}`
              );
            }
          });
        } else {
          v2Promise = Promise.reject();
          v2Promise.catch((e) => console.error(e));
        }
      }
      contextRef.current = {
        ...baseContext,
        version: 2 as const,
        promise: v2Promise,
      };
    } else {
      if (typeof v3Promise === "undefined") {
        if (typeof window !== "undefined") {
          v3Promise = new Promise<MathJax3Object>(scriptInjectorV3);
          v3Promise.catch((e) => {
            if (onError) onError(e as ErrorEvent);
            else {
              throw Error(
                `Failed to download MathJax 3 from '${usedSrc}': ${e}`
              );
            }
          });
        } else {
          v3Promise = Promise.reject();
          v3Promise.catch((e) => console.error(e));
        }
      }
      contextRef.current = {
        ...baseContext,
        version: 3 as const,
        promise: v3Promise,
      };
    }
  }

  return (
    <MathJaxBaseContext.Provider value={contextRef.current}>
      {children}
    </MathJaxBaseContext.Provider>
  );
};

export default MathJaxBaseContextProvider;
