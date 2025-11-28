
import React from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Plus,
  Calculator,
  FileText,
  Trello,
  Receipt,
  Users,
  Box,
  Store,
  Package,
  BarChart3,
  LogOut,
  Settings,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Clock,
  Camera,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  Pencil,
  AlertTriangle,
  Loader2,
  Search,
  UserPlus,
  Printer,
  Trash2,
  Folder,
  ArrowLeft,
  ShoppingCart,
  FileCheck,
  Star,
  MapPin,
  Image,
  Download,
  CalendarDays,
  BadgeCheck,
  Globe,
  Wrench,
  CreditCard,
  Building,
  Wand2,
  ScanEye,
  Diff,
  Sparkles,
  UploadCloud,
  FileSearch
} from 'lucide-react';

// Re-exporting Lucide icons with mapped names to match App usage
export const MenuIcon = Menu;
export const CloseIcon = X;
export const DashboardIcon = LayoutDashboard;
export const AddIcon = Plus;
export const CalculatorIcon = Calculator;
export const DocumentIcon = FileText;
export const KdsIcon = Trello;
export const ReceiptIcon = Receipt;
export const UsersIcon = Users;
export const BoxIcon = Box;
export const BuildingStorefrontIcon = Store;
export const InventoryIcon = Package;
export const SolidBoxIcon = Package;
export const FinanceIcon = BarChart3;
export const SolidFinanceIcon = TrendingUp;
export const ClientsIcon = Users;
export const LogoutIcon = LogOut;
export const Cog8ToothIcon = Settings;
export const CheckCircleIcon = CheckCircle2;
export const ArrowRightIcon = ArrowRight;
export const ShieldCheckIcon = ShieldCheck;
export const DollarIcon = DollarSign;
export const SolidDollarIcon = DollarSign;
export const ClockIcon = Clock;
export const SolidClockIcon = Clock;
export const CameraIcon = Camera;
export const ArrowUpIcon = ArrowUp;
export const ArrowDownIcon = ArrowDown;
export const PhoneIcon = Phone;
export const EnvelopeIcon = Mail;
export const PencilIcon = Pencil;
export const ExclamationTriangleIcon = AlertTriangle;
export const Loader2Icon = Loader2;
export const SearchIcon = Search;
export const UserPlusIcon = UserPlus;
export const PrinterIcon = Printer;
export const TrashIcon = Trash2;
export const FolderIcon = Folder;
export const ArrowLeftIcon = ArrowLeft;
export const ShoppingCartIcon = ShoppingCart;
export const DocumentCheckIcon = FileCheck;
export const StarIcon = Star;
export const MapPinIcon = MapPin;
export const PhotoIcon = Image;
export const ArrowDownTrayIcon = Download;
export const CalendarDaysIcon = CalendarDays;
export const CheckBadgeIcon = BadgeCheck;
export const GlobeAltIcon = Globe;
export const WrenchScrewdriverIcon = Wrench;
export const Wand2Icon = Wand2;
export const ScanEyeIcon = ScanEye;
export const DiffIcon = Diff;
export const SparklesIcon = Sparkles;
export const UploadCloudIcon = UploadCloud;
export const FileSearchIcon = FileSearch;

// Custom Icons

export const CordovaLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="10" y="20" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="6" />
    <path d="M25 40 H75" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <path d="M25 60 H55" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <circle cx="75" cy="60" r="5" fill="currentColor" />
  </svg>
);

export const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
