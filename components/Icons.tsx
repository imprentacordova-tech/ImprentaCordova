
import React from 'react';
import { 
    ChevronRight, 
    Clipboard, 
    Lock, 
    Unlock, 
    Copy as CopyLucide, 
    Key, 
    Search, 
    Plus, 
    Trash2, 
    Download, 
    CheckCircle, 
    Settings, 
    Globe, 
    ShieldCheck, 
    Eye, 
    EyeOff, 
    AlertTriangle, 
    Loader2, 
    Phone, 
    ArrowRight, 
    ShoppingCart, 
    Star, 
    Filter, 
    Heart, 
    Monitor, 
    DollarSign, 
    Users, 
    LogOut, 
    Menu, 
    X, 
    Package, 
    Box, 
    FileText, 
    Receipt, 
    Store, 
    LayoutDashboard, 
    Calculator, 
    Palette, 
    Sun, 
    Moon, 
    ArrowLeft, 
    Camera, 
    ArrowUp, 
    ArrowDown, 
    Image, 
    Clock, 
    TrendingUp, 
    Sparkles, 
    Mail, 
    Pencil, 
    MessageCircle, 
    Wallet, 
    BadgeCheck, 
    Send, 
    Info, 
    Upload, 
    FileCheck, 
    CalendarDays, 
    Wrench, 
    Ruler, 
    Table, 
    Save,
    UserPlus,
    CircleDollarSign,
    Check,
    PhoneCall,
    FileDigit,
    Layout,
    MapPin,
    FileCheck2,
    // Add Printer to lucide-react imports to resolve missing PrinterIcon errors
    Printer
} from 'lucide-react';

// Common SVG props
type IconProps = React.SVGProps<SVGSVGElement>;

/**
 * Base Icons from Lucide re-exported with consistent naming conventions.
 */
export const ChevronRightIcon = ChevronRight;
export const ClipboardIcon = Clipboard;
export const LockClosedIcon = Lock;
export const LockOpenIcon = Unlock;
export const DocumentDuplicateIcon = CopyLucide;
export const KeyIcon = Key;
export const SearchIcon = Search;
export const AddIcon = Plus;
export const TrashIcon = Trash2;
export const ArrowDownTrayIcon = Download;
export const CheckCircleIcon = CheckCircle;
export const Cog8ToothIcon = Settings;
export const GlobeAltIcon = Globe;
export const ShieldCheckIcon = ShieldCheck;
export const EyeIcon = Eye;
export const EyeSlashIcon = EyeOff;
export const ExclamationTriangleIcon = AlertTriangle;
export const Loader2Icon = Loader2;
export const Copy = CopyLucide;

/**
 * Aliases and additional icons required by specific components in the ERP.
 */
export const WhatsAppIcon = MessageCircle;
export const ArrowRightIcon = ArrowRight;
export const HeartIcon = Heart;
export const KdsIcon = Monitor;
export const FinanceIcon = DollarSign;
export const ClientsIcon = Users;
export const LogoutIcon = LogOut;
export const MenuIcon = Menu;
export const CloseIcon = X;
export const InventoryIcon = Package;
export const BoxIcon = Box;
export const DocumentIcon = FileText;
export const UsersIcon = Users;
export const ReceiptIcon = Receipt;
export const BuildingStorefrontIcon = Store;
export const SolidBoxIcon = Box;
export const DashboardIcon = LayoutDashboard;
export const CalculatorIcon = Calculator;
export const PaletteIcon = Palette;
export const SunIcon = Sun;
export const MoonIcon = Moon;
export const ArrowLeftIcon = ArrowLeft;
export const SolidDollarIcon = CircleDollarSign;
export const CameraIcon = Camera;
export const ArrowUpIcon = ArrowUp;
export const ArrowDownIcon = ArrowDown;
export const FilterIcon = Filter;
export const PhotoIcon = Image;
export const DollarIcon = DollarSign;
export const ClockIcon = Clock;
export const SolidFinanceIcon = TrendingUp;
export const SparklesIcon = Sparkles;
export const PhoneIcon = Phone;
export const EnvelopeIcon = Mail;
export const PencilIcon = Pencil;
export const MessageCircleIcon = MessageCircle;
export const ShoppingCartIcon = ShoppingCart;
export const WalletIcon = Wallet;
export const StarIcon = Star;
export const CheckBadgeIcon = BadgeCheck;
export const SendIcon = Send;
export const FileTextIcon = FileText;
export const MonitorIcon = Monitor;
export const InfoIcon = Info;
export const DocumentTextIcon = FileText;
export const UploadIcon = Upload;
export const DocumentCheckIcon = FileCheck2;
export const CalendarDaysIcon = CalendarDays;
export const WrenchScrewdriverIcon = Wrench;
export const RulerIcon = Ruler;
export const TableIcon = Table;
export const SaveIcon = Save;
export const SolidClockIcon = Clock;
export const UserPlusIcon = UserPlus;
export const MapPinIcon = MapPin;
// Fix: Added PrinterIcon export used by multiple pages (Retiros, ReciboAbono, etc)
export const PrinterIcon = Printer;

// Exporting original lucide icons with original names for generic usage
// Fix: Explicitly export Printer and Sparkles to resolve naming collision and visibility errors
export { FileText, Search, ShoppingCart, CheckCircle, Star, Filter, Menu, X, ArrowDown, Box, Receipt, Plus, Check, Printer, Sparkles };

/**
 * Custom Logo component using an external image.
 */
export const CordovaLogo = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
        src="https://i.imgur.com/kzhXFkE.png"
        alt="Imprenta Córdova"
        className={`object-contain ${className}`}
        {...props}
    />
);
