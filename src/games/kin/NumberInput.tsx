import { useId, useRef, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "step"> & {
  "aria-label": string;
  value: string | number;
  step?: number;
  onValueChange: (value: string) => void;
};

export function NumberInput({ onValueChange, id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const input = useRef<HTMLInputElement>(null);
  const value = props.value === "" ? NaN : Number(props.value);
  const unavailable = props.disabled || props.readOnly || (props.min !== undefined && props.max !== undefined && Number(props.min) > Number(props.max));
  const change = (direction: number) => {
    if (!input.current) return;
    if (direction > 0) input.current.stepUp();
    else input.current.stepDown();
    onValueChange(input.current.value);
    input.current.focus();
  };
  return <span className="kin-number">
    <input {...props} id={inputId} ref={input} type="number" onChange={event => onValueChange(event.target.value)} />
    <span className="kin-number-arrows">
      {([1, -1] as const).map(direction => <button
        key={direction}
        type="button"
        aria-label={`${direction > 0 ? "Increase" : "Decrease"} ${props["aria-label"]}`}
        aria-controls={inputId}
        disabled={unavailable || (direction > 0 ? props.max !== undefined && value >= Number(props.max) : props.min !== undefined && value <= Number(props.min))}
        onClick={() => change(direction)}
      >
        <svg viewBox="0 0 12 8" aria-hidden="true"><path d={direction > 0 ? "M2 6 6 2 10 6" : "M2 2 6 6 10 2"} /></svg>
      </button>)}
    </span>
  </span>;
}
