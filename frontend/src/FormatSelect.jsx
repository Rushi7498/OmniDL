import { Children, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function FormatSelect({
  value,
  onChange,
  children,
  disabled,
  id,
  ...props
}) {
  const options = Children.toArray(children).map((child) => ({
    value: child.props.value,
    label: child.props.children,
  }));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const listId = useId();
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  function choose(index) {
    onChange({ target: { value: options[index].value } });
    setOpen(false);
    root.current.querySelector("button").focus();
  }
  return (
    <div
      className="format-select"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        id={id}
        className="format-trigger"
        role="combobox"
        aria-label={props["aria-label"]}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => {
          setActive(selected);
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.preventDefault();
          } else if (
            ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
          ) {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : !open
                    ? selected
                    : (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        options.length) %
                      options.length,
            );
          } else if (open && ["Enter", " "].includes(event.key)) {
            event.preventDefault();
            choose(active);
          }
        }}
      >
        <span>{options[selected]?.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          id={listId}
          className="format-menu"
          role="listbox"
          aria-label={props["aria-label"] || "Available formats"}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={value === option.value}
              className={`format-option ${active === index ? "active" : ""}`}
              onPointerEnter={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={15} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
