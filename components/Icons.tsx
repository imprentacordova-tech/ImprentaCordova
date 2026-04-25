
import React from 'react';
import {
    ChevronRight, Clipboard, Lock, Unlock, Copy as CopyLucide, Key, Search,
    Plus, Trash2, Download, CheckCircle, Settings, Globe, ShieldCheck, Eye,
    EyeOff, AlertTriangle, Loader2, Phone, ArrowRight, ShoppingCart, Star,
    Filter, Heart, Monitor, DollarSign, Users, LogOut, Menu, Mic, X, Package,
    Box, FileText, Receipt, Store, LayoutDashboard, Calculator, Palette, Sun,
    Moon, ArrowLeft, Camera, ArrowUp, ArrowDown, Image, Clock, TrendingUp,
    Sparkles, Mail, Pencil, MessageCircle, Wallet, BadgeCheck, Send, Info,
    Upload, FileCheck, CalendarDays, Calendar, TrendingDown, Banknote,
    RefreshCcw, Scale, Wrench, Ruler, Table, Save, UserPlus, CircleDollarSign,
    Check, PhoneCall, FileDigit, Layout, MapPin, FileCheck2, Printer, Layers,
    FileStack, Folder, QrCode, Zap, CreditCard, Tag, Bell, Grid, Hash,
    BookOpen, Stamp, Ticket, ChevronDown, ChevronUp, ChevronLeft,
    BarChart2, PieChart, Activity, Briefcase, Clipboard as ClipboardCheck,
    Link, Share2, ExternalLink, FolderOpen, Archive, RefreshCw, RotateCw,
    SlidersHorizontal, ListFilter, MoreHorizontal, MoreVertical, Maximize2,
    Minimize2, ChevronRightSquare, Square, Circle, Triangle, Hexagon,
    GalleryHorizontal, Images, FileImage, Building2, Globe2, Shield,
    TruckIcon as Truck, Package2, Boxes, ScanLine, Rocket, Cpu, Flag,
    CloudUpload, Eraser, User, Database, Sliders, Layers as LayersLucide,
    TrendingUp as TrendingUpLucide, History, Server, Fingerprint, Command,
    Terminal, Headphones, Scissors, Hand
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM SVG ICONS  (no disponibles en lucide-react)
// ─────────────────────────────────────────────────────────────────────────────

/** Logo oficial de WhatsApp — verde brand real */
export const WhatsAppIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

/** Ícono de Instagram */
export const InstagramIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);

/** Ícono de Facebook */
export const FacebookIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

/** Ícono de TikTok */
export const TikTokIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.88 1.58V6.82a4.85 4.85 0 01-1.11-.13z" />
    </svg>
);

/** Logo Imprenta Córdova */
export const CordovaLogo = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="https://i.imgur.com/kzhXFkE.png"
        alt="Imprenta Córdova"
        className={`object-contain ${className}`}
        loading="lazy"
        {...props}
    />
);

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Navegación y Acciones
// ─────────────────────────────────────────────────────────────────────────────
export const ArrowRightIcon       = ArrowRight;
export const ArrowLeftIcon        = ArrowLeft;
export const ArrowUpIcon          = ArrowUp;
export const ArrowDownIcon        = ArrowDown;
export const ArrowDownTrayIcon    = Download;
export const DocumentArrowDownIcon = Download;
export const ChevronRightIcon     = ChevronRight;
export const ChevronLeftIcon      = ChevronLeft;
export const ChevronDownIcon      = ChevronDown;
export const ChevronUpIcon        = ChevronUp;
export const ExternalLinkIcon     = ExternalLink;
export const LinkIcon             = Link;
export const ShareIcon            = Share2;
export const MenuIcon             = Menu;
export const CloseIcon            = X;
export const XIcon                = X;
export const XMarkIcon            = X;
export const MoreHorizontalIcon   = MoreHorizontal;
export const MoreVerticalIcon     = MoreVertical;
export const Maximize2Icon        = Maximize2;
export const Minimize2Icon        = Minimize2;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Estado y Feedback
// ─────────────────────────────────────────────────────────────────────────────
export const CheckCircleIcon          = CheckCircle;
export const CheckBadgeIcon           = BadgeCheck;
export const CheckIcon                = Check;
export const Loader2Icon              = Loader2;
export const ExclamationTriangleIcon  = AlertTriangle;
export const InfoIcon                 = Info;
export const SparklesIcon             = Sparkles;
export const BoltIcon                 = Zap;
export const StarIcon                 = Star;
export const HeartIcon                = Heart;
export const BellIcon                 = Bell;
export const ActivityIcon             = Activity;
export const TrendingUpIcon           = TrendingUp;
export const TrendingDownIcon         = TrendingDown;
export const HistoryIcon              = History;
export const ZapIcon                  = Zap;
export const LightningBoltIcon        = Zap;
export const ScanIcon                 = ScanLine;
export const ChartBarIcon             = BarChart2;
export const ArrowTrendingUpIcon      = TrendingUp;
export const ArrowTrendingDownIcon    = TrendingDown;
export const SolidFinanceIcon         = DollarSign;
export const RocketLaunchIcon         = Rocket;
export const CpuIcon                  = Cpu;
export const FlagIcon                 = Flag;
export const CloudArrowUpIcon         = CloudUpload;
export const PencilSquareIcon         = Pencil;
export const EraserIcon               = Eraser;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Usuarios y Seguridad
// ─────────────────────────────────────────────────────────────────────────────
export const UsersIcon        = Users;
export const UserPlusIcon     = UserPlus;
export const ClientsIcon      = Users;
export const LogoutIcon       = LogOut;
export const ShieldCheckIcon  = ShieldCheck;
export const LockIcon         = Lock;
export const LockClosedIcon   = Lock;
export const LockOpenIcon     = Unlock;
export const KeyIcon          = Key;
export const ServerIcon       = Server;
export const FingerPrintIcon  = Fingerprint;
export const EyeIcon          = Eye;
export const EyeSlashIcon     = EyeOff;
export const IdentificationIcon = CreditCard;
export const CreditCardIcon     = CreditCard;
export const UserIcon           = User;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Documentos y Archivos
// ─────────────────────────────────────────────────────────────────────────────
export const DocumentIcon       = FileText;
export const DocumentTextIcon   = FileText;
export const FileTextIcon       = FileText;
export const DocumentCheckIcon  = FileCheck2;
export const DocumentDuplicateIcon = CopyLucide;
export const FileStackIcon      = FileStack;
export const FolderIcon         = Folder;
export const FolderOpenIcon     = FolderOpen;
export const ArchiveIcon        = Archive;
export const ClipboardIcon      = Clipboard;
export const ClipboardCheckIcon = ClipboardCheck;
export const UploadIcon         = Upload;
export const PhotoIcon          = Image;
export const ImageIcon          = Image;
export const FileImageIcon      = FileImage;
export const ImagesIcon         = Images;
export const GalleryIcon        = GalleryHorizontal;
export const Copy               = CopyLucide;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Productos, Órdenes e Inventario
// ─────────────────────────────────────────────────────────────────────────────
export const BoxIcon          = Box;
export const SolidBoxIcon     = Box;
export const CubeIcon          = Box;
export const InventoryIcon    = Package;
export const Package2Icon     = Package2;
export const BoxesIcon        = Boxes;
export const ReceiptIcon      = Receipt;
export const ShoppingCartIcon = ShoppingCart;
export const TagIcon          = Tag;
export const TicketIcon       = Ticket;
export const StampIcon        = Stamp;
export const LayersIcon       = Layers;
export const QrCodeIcon       = QrCode;
export const ScanLineIcon     = ScanLine;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Finanzas y Facturación
// ─────────────────────────────────────────────────────────────────────────────
export const WalletIcon           = Wallet;
export const FinanceIcon          = DollarSign;
export const DollarIcon           = DollarSign;
export const SolidDollarIcon      = CircleDollarSign;
export const BanknotesIcon        = Banknote;
export const CalculatorIcon       = Calculator;
export const ScaleIcon            = Scale;
export const BarChart2Icon        = BarChart2;
export const PieChartIcon         = PieChart;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — UI / Layout
// ─────────────────────────────────────────────────────────────────────────────
export const DashboardIcon    = LayoutDashboard;
export const LayoutDashboardIcon = LayoutDashboard;
export const LayoutIcon       = Layout;
export const GridIcon         = Grid;
export const HashIcon         = Hash;
export const FilterIcon       = Filter;
export const ListFilterIcon   = ListFilter;
export const SlidersIcon      = SlidersHorizontal;
export const SearchIcon       = Search;
export const AddIcon          = Plus;
export const PlusIcon         = Plus;
export const TrashIcon        = Trash2;
export const PencilIcon       = Pencil;
export const SaveIcon         = Save;
export const ArrowPathIcon    = RefreshCcw;
export const RefreshIcon      = RefreshCw;
export const RotateIcon       = RotateCw;
export const SunIcon          = Sun;
export const MoonIcon         = Moon;
export const MaximizeIcon     = Maximize2;
export const MinimizeIcon     = Minimize2;
export const CircleStackIcon  = Database;
export const AdjustmentsHorizontalIcon = Sliders;
export const CubeTransparentIcon = Box;
export const CommandIcon          = Command;
export const TerminalIcon         = Terminal;
export const ScissorsIcon         = Scissors;
export const HandRaisedIcon       = Hand;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Taller / Producción
// ─────────────────────────────────────────────────────────────────────────────
export const PrinterIcon          = Printer;
export const PaletteIcon          = Palette;
export const CameraIcon           = Camera;
export const WrenchScrewdriverIcon = Wrench;
export const RulerIcon            = Ruler;
export const TableIcon            = Table;
export const KdsIcon              = Monitor;
export const MonitorIcon          = Monitor;
export const BookOpenIcon         = BookOpen;
export const BriefcaseIcon        = Briefcase;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Contacto y Comunicación
// ─────────────────────────────────────────────────────────────────────────────
export const PhoneIcon        = Phone;
export const PhoneCallIcon    = PhoneCall;
export const EnvelopeIcon     = Mail;
export const MicIcon          = Mic;
export const MessageCircleIcon= MessageCircle;
export const SendIcon         = Send;
export const HeadphonesIcon   = Headphones;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Localización y Tiempo
// ─────────────────────────────────────────────────────────────────────────────
export const MapPinIcon       = MapPin;
export const GlobeAltIcon     = Globe;
export const CloudIcon        = Globe;
export const Building2Icon    = Building2;
export const Globe2Icon       = Globe2;
export const ShieldIcon       = Shield;
export const ClockIcon        = Clock;
export const SolidClockIcon   = Clock;
export const CalendarDaysIcon = CalendarDays;
export const CalendarIcon     = Calendar;
export const MagnifyingGlassIcon = Search;

// ─────────────────────────────────────────────────────────────────────────────
// LUCIDE ALIASES — Logística
// ─────────────────────────────────────────────────────────────────────────────
export const TruckIcon            = Truck;
export const BuildingStorefrontIcon = Store;

// ─────────────────────────────────────────────────────────────────────────────
// MISC / LEGACY (mantener compatibilidad con el resto del proyecto)
// ─────────────────────────────────────────────────────────────────────────────
export const SettingsIcon        = Settings;
export const Cog8ToothIcon        = Settings;
export const HeartIconSolid       = Heart;
export const FileDigitIcon        = FileDigit;
export { FileText, Search, ShoppingCart, CheckCircle, Star, Filter, Menu, X, ArrowDown, Box, Receipt, Plus, Check, Printer, Sparkles };
