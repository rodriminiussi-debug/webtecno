import type { SVGProps } from 'react'

// Single icon family: 24px grid, 1.5 stroke, square caps. Drawn for MONO so the
// set stays consistent instead of mixing libraries.

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Icon>
)
export const BagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Icon>
)
export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
  </Icon>
)
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9h16M4 15h16" />
  </Icon>
)
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
)
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </Icon>
)
export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12H4m6-6-6 6 6 6" />
  </Icon>
)
export const ArrowUpRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Icon>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
)
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)
export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 7.5v9l7.5-4.5L9 7.5Z" fill="currentColor" stroke="none" />
  </Icon>
)
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />
  </Icon>
)
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </Icon>
)
export const EditIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
)
export const GripIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="6" r=".8" fill="currentColor" />
    <circle cx="15" cy="6" r=".8" fill="currentColor" />
    <circle cx="9" cy="12" r=".8" fill="currentColor" />
    <circle cx="15" cy="12" r=".8" fill="currentColor" />
    <circle cx="9" cy="18" r=".8" fill="currentColor" />
    <circle cx="15" cy="18" r=".8" fill="currentColor" />
  </Icon>
)
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)
export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4l16 16M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.3 7.7A16.4 16.4 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-1" />
  </Icon>
)
export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" />
  </Icon>
)
export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
  </Icon>
)
export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
  </Icon>
)

// --- Admin navigation --------------------------------------------------------
export const DashboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="7" height="9" rx="1" />
    <rect x="13" y="4" width="7" height="5" rx="1" />
    <rect x="13" y="11" width="7" height="9" rx="1" />
    <rect x="4" y="15" width="7" height="5" rx="1" />
  </Icon>
)
export const BoxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </Icon>
)
export const TagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5-8.5-8.5Z" />
    <circle cx="8" cy="8.5" r="1.3" />
  </Icon>
)
export const ReceiptIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
    <path d="M9 8h6M9 12h6" />
  </Icon>
)
export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3 3-5 6-5s5.4 2 6 5M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.8c1.8.6 3 2.3 3.5 4.7" />
  </Icon>
)
export const LayoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
    <path d="M4 9.5h16M9.5 9.5V20" />
  </Icon>
)
export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icon>
)
export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
)

// --- Benefits ----------------------------------------------------------------
export const ShippingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6.5h11v10H3zM14 10h4l3 3v3.5h-7" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </Icon>
)
export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.3-3 7.7-7 9-4-1.3-7-4.7-7-9V6l7-2.5Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
)
export const WarrantyIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="10" r="5.5" />
    <path d="m9 14.8-1.5 5.7L12 18.5l4.5 2-1.5-5.7" />
  </Icon>
)
export const ChatIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5.5h16v10.5H9.5L5 19.5V16H4V5.5Z" />
    <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth={2.2} />
  </Icon>
)
export const ReturnIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 7 5 11l4 4" />
    <path d="M5 11h9.5a4.5 4.5 0 0 1 0 9H11" />
  </Icon>
)
export const CardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="M3 10h18M7 15h3" />
  </Icon>
)

// --- Social ------------------------------------------------------------------
export const InstagramIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="16.8" cy="7.2" r=".6" fill="currentColor" />
  </Icon>
)
export const XIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4.5h3.5l10.5 15h-3.5L5 4.5ZM19 4.5l-6 6.8M5 19.5l6-6.8" />
  </Icon>
)
export const YoutubeIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="12" rx="3.5" />
    <path d="m10.5 9.5 4 2.5-4 2.5v-5Z" fill="currentColor" />
  </Icon>
)
export const TiktokIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2 4 4.5 4.2" />
  </Icon>
)
export const LinkedinIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 10.5V16M8 7.8v.01M11.5 16v-3.2a2 2 0 0 1 4 0V16M11.5 10.5V16" />
  </Icon>
)
export const WhatsappIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8 18.4l-3.5 1.1Z" />
    <path d="M9 9.2c0 3 2.4 5.6 5.6 5.8l1-1.2-1.8-1-1 .8c-.9-.4-1.7-1.2-2-2l.7-1-1-1.8L9 9.2Z" />
  </Icon>
)
