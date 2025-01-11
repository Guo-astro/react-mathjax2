// MathJax.tsx
import {
  ComponentPropsWithoutRef,
  FC,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { MathJaxBaseContextOverrideableProps } from "./context/types";
import { MathJaxBaseContext } from "./context/MathJaxBaseContext";

export interface MathJaxProps extends MathJaxBaseContextOverrideableProps {
  inline?: boolean;
  onInitTypeset?: () => void;
  onTypeset?: () => void;
  text?: string;
  dynamic?: boolean;
}

const typesettingFailed = (err: ErrorEvent) =>
  `Typesetting failed: ${
    typeof err.message !== "undefined" ? err.message : JSON.stringify(err)
  }`;

export const MathJax: FC<MathJaxProps & ComponentPropsWithoutRef<"span">> = ({
  inline = false,
  hideUntilTypeset,
  onInitTypeset,
  onTypeset,
  text,
  dynamic,
  typesettingOptions,
  renderMode,
  children,
  ...rest
}) => {
  const lastChildren = useRef<string>("");
  const ref = useRef<HTMLElement>(null);
  const mjContext = useContext(MathJaxBaseContext);

  const usedHideUntilTypeset = hideUntilTypeset ?? mjContext.hideUntilTypeset;
  const usedRenderMode = renderMode ?? mjContext.renderMode;
  const usedConversionOptions =
    typesettingOptions ?? mjContext.typesettingOptions;
  const usedDynamic =
    dynamic === false
      ? false
      : dynamic || process.env.NODE_ENV !== "production";

  const initLoad = useRef(false);
  const typesetting = useRef(false);

  const checkInitLoad = () => {
    if (!initLoad.current) {
      if (usedHideUntilTypeset === "first" && ref.current) {
        ref.current.style.visibility = "visible";
      }
      if (onInitTypeset) onInitTypeset();
      initLoad.current = true;
    }
  };

  const onTypesetDone = () => {
    if (
      usedHideUntilTypeset === "every" &&
      usedDynamic &&
      usedRenderMode === "post" &&
      ref.current
    ) {
      ref.current.style.visibility = rest.style?.visibility ?? "visible";
    }
    checkInitLoad();
    if (onTypeset) onTypeset();
    typesetting.current = false;
  };

  const validText = (inputText?: string) =>
    typeof inputText === "string" && inputText.length > 0;

  if (
    !typesetting.current &&
    ref.current &&
    usedDynamic &&
    usedHideUntilTypeset === "every" &&
    usedRenderMode === "post"
  ) {
    ref.current.style.visibility = "hidden";
  }

  const effectToUse =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;
  effectToUse(() => {
    if (usedDynamic || !initLoad.current) {
      if (ref.current) {
        if (!mjContext.promise) {
          throw Error(
            "MathJax was not loaded, did you use the MathJax component outside of a MathJaxContext?"
          );
        }
        if (usedRenderMode === "pre") {
          if (!validText(text))
            throw Error(
              `Render mode 'pre' requires text prop to be set and non-empty, which was currently "${text}"`
            );
          if (!typesettingOptions || !typesettingOptions.fn)
            throw Error(
              "Render mode 'pre' requires 'typesettingOptions' prop with 'fn' property to be set on MathJax element or in the MathJaxContext"
            );
          if (mjContext.version === 2)
            throw Error(
              "Render mode 'pre' only available with MathJax 3, and version 2 is currently in use"
            );
        }
        if (usedRenderMode === "post" || text !== lastChildren.current) {
          if (!typesetting.current) {
            typesetting.current = true;
            if (mjContext.version === 3) {
              mjContext.promise
                .then((mathJax) => {
                  if (usedRenderMode === "pre") {
                    const updateFn = (output: HTMLElement) => {
                      lastChildren.current = text!;
                      mathJax.startup.document.clear();
                      mathJax.startup.document.updateDocument();
                      if (ref.current) ref.current.innerHTML = output.outerHTML;
                      onTypesetDone();
                    };
                    if (usedConversionOptions!.fn.endsWith("Promise"))
                      mathJax.startup.promise
                        .then(() =>
                          mathJax[usedConversionOptions!.fn](text!, {
                            ...(usedConversionOptions?.options || {}),
                            display: !inline,
                          })
                        )
                        .then(updateFn)
                        .catch((err: ErrorEvent) => {
                          onTypesetDone();
                          throw Error(typesettingFailed(err));
                        });
                    else
                      mathJax.startup.promise
                        .then(() => {
                          const output = mathJax[usedConversionOptions!.fn](
                            text!,
                            {
                              ...(usedConversionOptions?.options || {}),
                              display: !inline,
                            }
                          );
                          updateFn(output);
                        })
                        .catch((err: ErrorEvent) => {
                          onTypesetDone();
                          throw Error(typesettingFailed(err));
                        });
                  } else {
                    mathJax.startup.promise
                      .then(() => {
                        if (ref.current) {
                          mathJax.typesetClear([ref.current]);
                          return mathJax.typesetPromise([ref.current]);
                        }
                      })
                      .then(onTypesetDone)
                      .catch((err: ErrorEvent) => {
                        onTypesetDone();
                        throw Error(typesettingFailed(err));
                      });
                  }
                })
                .catch((err) => {
                  onTypesetDone();
                  throw Error(typesettingFailed(err));
                });
            } else {
              // version 2 handling
              mjContext.promise
                .then((mathJax) => {
                  mathJax.Hub.Queue(["Typeset", mathJax.Hub, ref.current]);
                  mathJax.Hub.Queue(onTypesetDone);
                })
                .catch((err) => {
                  onTypesetDone();
                  throw Error(typesettingFailed(err));
                });
            }
          }
        }
      }
    }
  });

  return (
    <span
      {...rest}
      style={{
        display: inline ? "inline" : "block",
        ...rest.style,
        visibility: usedHideUntilTypeset ? "hidden" : rest.style?.visibility,
      }}
      ref={ref}
    >
      {children}
    </span>
  );
};
