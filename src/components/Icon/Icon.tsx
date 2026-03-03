import "./Icon.css"

type IconProps = {
  name: string
  size?: number
  className?: string
}

export function Icon({ name, size, className }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded ${className ?? ""}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
