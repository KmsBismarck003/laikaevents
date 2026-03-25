import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUtils";
import { Button, Badge, Accordion, Icon } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { useCart } from "../../context/CartContext";
import api from "../../services/api";
import VenueMapSVG from "../../components/VenueMapSVG";
import TicketPrinterOverlay from "../user/UserCart/TicketPrinterOverlay";
import "./EventDetail.css";

const MOCK_MERCH = [
  {
    id: 101, name: "Playera Oficial Tour", price: 450, type: "Playera",
    colors: [
      { name: "Negro", hex: "#111111", images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600"] },
      { name: "Blanco", hex: "#f5f5f5", images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600","https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600"] },
      { name: "Azul", hex: "#1e3a8a", images: ["https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600","https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600"] },
    ]
  },
  {
    id: 102, name: "Playera Vintage", price: 500, type: "Playera",
    colors: [
      { name: "Gris", hex: "#6b7280", images: ["https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600"] },
      { name: "Verde", hex: "#166534", images: ["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600"] },
    ]
  },
  {
    id: 103, name: "Gorra Bordada", price: 350, type: "Gorra",
    colors: [
      { name: "Negro", hex: "#111111", images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600","https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600"] },
      { name: "Beige", hex: "#d4b896", images: ["https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600","https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600"] },
    ]
  },
  {
    id: 104, name: "Taza Coleccionable", price: 200, type: "Taza",
    colors: [
      { name: "Blanco", hex: "#f5f5f5", images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600","https://images.unsplash.com/photo-1517256673644-36ad11246d21?w=600"] },
      { name: "Negro", hex: "#111111", images: ["https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600","https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600"] },
    ]
  },
  {
    id: 105, name: "Stickers Pack (x5)", price: 100, type: "Sticker",
    colors: [
      { name: "Mix", hex: "linear-gradient(135deg,#f43f5e,#8b5cf6,#3b82f6)", images: ["https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=600","https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600"] },
    ]
  },
  {
    id: 106, name: "Bufanda Oficial", price: 250, type: "Bufanda",
    colors: [
      { name: "Negro/Blanco", hex: "#374151", images: ["https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600"] },
      { name: "Rojo", hex: "#991b1b", images: ["https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=600"] },
    ]
  },
  {
    id: 107, name: "Hoodie Unisex", price: 750, type: "Hoodie",
    colors: [
      { name: "Negro", hex: "#111111", images: ["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"] },
      { name: "Gris", hex: "#9ca3af", images: ["https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600","https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600"] },
    ]
  },
  {
    id: 108, name: "Pulsera Oficial", price: 150, type: "Pulsera",
    colors: [
      { name: "Plata", hex: "#c0c0c0", images: ["https://images.unsplash.com/photo-1552343245-87eb1455f5c7?w=600"] },
      { name: "Dorado", hex: "#ca8a04", images: ["https://images.unsplash.com/photo-1573408301185-9519f94fcbb9?w=600"] },
    ]
  },
];

// Obtiene la imagen de portada del primer color de un producto
const getMerchCardImage = (item, colorIdx = 0) => item.colors[colorIdx]?.images[0] || '';

// Limpia el precio eliminando símbolos y comas para cálculos seguros (Evita NaN)
const cleanPrice = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const MerchProductCard = ({ item, onSelect }) => {
  const [cardColorIdx, setCardColorIdx] = React.useState(0);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const cardImg = item.colors[cardColorIdx]?.images[0] || '';

  return (
    <div
      className="merch-product-card"
      style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      onClick={() => onSelect(cardColorIdx)}
      onMouseOver={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.4)'}
      onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}
    >
      {/* Photo Container */}
      <div style={{ width: '100%', aspectRatio: '1/1', background: '#111', overflow: 'hidden', position: 'relative' }}>
        <img src={cardImg} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, transition: 'opacity 0.3s' }} />
        
        {/* NEW Badge */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#22c55e', color: '#000', fontSize: '0.4rem', fontWeight: 900, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          NEW
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
          style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', zIndex: 10 }}
        >
          <Icon name="heart" size={18} fill={isFavorite ? "#ff4444" : "none"} stroke={isFavorite ? "#ff4444" : "#fff"} style={{ opacity: 1, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />
        </button>
      </div>

      {/* Color swatches - below photo, aligned left */}
      <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-start', marginTop: '2px', paddingLeft: '2px' }} onClick={e => e.stopPropagation()}>
        {item.colors.map((c, ci) => (
          <button
            key={ci}
            title={c.name}
            onClick={e => { e.stopPropagation(); setCardColorIdx(ci); }}
            style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: c.hex.startsWith('linear') ? c.hex : c.hex,
              border: cardColorIdx === ci ? '1.5px solid #fff' : '1.5px solid #444',
              cursor: 'pointer', padding: 0, transition: 'border-color 0.15s', flexShrink: 0
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, textAlign: 'left', paddingLeft: '2px', marginBottom: '0.4rem' }}>
        <h4 style={{ fontSize: '0.48rem', color: '#fff', margin: 0, fontWeight: 700, lineHeight: 1.1 }}>{item.name}</h4>
        <span style={{ fontSize: '0.5rem', color: '#fff', fontWeight: 900 }}>${item.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
      </div>

      {/* AGREGAR Button */}
      <button
        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.42rem', fontWeight: 900, padding: '10px 0', textTransform: 'uppercase', letterSpacing: '1.5px', cursor: 'pointer', transition: 'all 0.2s', marginTop: 'auto', borderRadius: '6px', backdropFilter: 'blur(4px)' }}
        onMouseOver={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      >
        AGREGAR AL CARRITO
      </button>
    </div>
  );
};

const INITIAL_ZONES = [
  {
    id: "escenario",
    name: "ESCENARIO",
    type: "stage",
    points: [
      { x: 10, y: 150 }, { x: 130, y: 120 }, { x: 130, y: 480 }, { x: 10, y: 450 },
    ],
  },
  {
    id: "platino-vip",
    name: "PLATINO VIP",
    type: "seating",
    price: "$2,500",
    rows: 4, count: 80,
    points: [
      { x: 145, y: 190 }, { x: 265, y: 160 }, { x: 265, y: 440 }, { x: 145, y: 410 },
    ],
  },
  {
    id: "zona-platino",
    name: "ZONA PLATINO",
    type: "seating",
    price: "$1,800",
    rows: 6, count: 180,
    points: [
      { x: 275, y: 150 }, { x: 435, y: 100 }, { x: 435, y: 500 }, { x: 275, y: 450 },
    ],
  },
  {
    id: "general-bronce",
    name: "GENERAL BRONCE",
    type: "seating",
    price: "$900",
    rows: 10, count: 400,
    points: [
      { x: 445, y: 90 }, { x: 700, y: 20 }, { x: 700, y: 580 }, { x: 445, y: 510 },
    ],
  },
  {
    id: "plata-izq",
    name: "ZONA PLATA IZQ",
    type: "seating",
    price: "$1,200",
    rows: 10, count: 150,
    points: [
      { x: 145, y: 30 }, { x: 435, y: 10 }, { x: 435, y: 90 }, { x: 145, y: 180 },
    ],
  },
  {
    id: "plata-der",
    name: "ZONA PLATA DER",
    type: "seating",
    price: "$1,200",
    rows: 10, count: 150,
    points: [
      { x: 145, y: 420 }, { x: 435, y: 510 }, { x: 435, y: 590 }, { x: 145, y: 570 },
    ],
  },
];

const STADIUM_ZONES = [
  {
    id: "norte",
    name: "GRADA NORTE",
    type: "seating",
    price: "$600",
    rows: 8,
    count: 200,
    points: [
      { x: 150, y: 110 },
      { x: 650, y: 110 },
      { x: 700, y: 50 },
      { x: 100, y: 50 },
    ],
  },
  {
    id: "sur",
    name: "GRADA SUR",
    type: "seating",
    price: "$600",
    rows: 8,
    count: 200,
    points: [
      { x: 100, y: 450 },
      { x: 700, y: 450 },
      { x: 650, y: 390 },
      { x: 150, y: 390 },
    ],
  },
  {
    id: "oriente",
    name: "GRADA ORIENTE",
    type: "seating",
    price: "$1,200",
    rows: 10,
    count: 120,
    points: [
      { x: 680, y: 120 },
      { x: 780, y: 80 },
      { x: 780, y: 420 },
      { x: 680, y: 380 },
    ],
  },
  {
    id: "poniente",
    name: "GRADA PONIENTE",
    type: "seating",
    price: "$1,200",
    rows: 10,
    count: 120,
    points: [
      { x: 20, y: 80 },
      { x: 120, y: 120 },
      { x: 120, y: 380 },
      { x: 20, y: 420 },
    ],
  },
  {
    id: "cancha",
    name: "CANCHA / FIELD",
    type: "corridor",
    points: [
      { x: 160, y: 140 },
      { x: 640, y: 140 },
      { x: 640, y: 360 },
      { x: 160, y: 360 },
    ],
  },
  {
    id: "escenario",
    name: "ESCENARIO",
    type: "stage",
    points: [
      { x: 150, y: 10 },
      { x: 650, y: 10 },
      { x: 680, y: 120 },
      { x: 120, y: 120 },
    ],
  },
];

const SUMMER_EDITION_PRESET = [
  {
    id: "stage-main",
    name: "STAGE",
    type: "stage",
    points: [
      { x: 600, y: 200 },
      { x: 750, y: 200 },
      { x: 750, y: 400 },
      { x: 600, y: 400 },
    ],
  },
  {
    id: "stage-runway",
    name: "RUNWAY",
    type: "stage",
    points: [
      { x: 430, y: 280 },
      { x: 600, y: 280 },
      { x: 600, y: 320 },
      { x: 430, y: 320 },
    ],
  },
  {
    id: "stage-thrust",
    name: "THRUST",
    type: "stage",
    points: [
      { x: 360, y: 240 },
      { x: 430, y: 240 },
      { x: 430, y: 360 },
      { x: 360, y: 360 },
    ],
  },
  {
    id: "ga-blue",
    name: "GENERAL ADMISSION",
    type: "corridor",
    points: [
      { x: 60, y: 170 },
      { x: 340, y: 170 },
      { x: 340, y: 430 },
      { x: 60, y: 430 },
    ],
  },
  {
    id: "vip-red-top",
    name: "VIP FRONT B",
    type: "seating",
    price: "$2,500",
    rows: 6,
    count: 100,
    points: [
      { x: 360, y: 140 },
      { x: 580, y: 140 },
      { x: 580, y: 230 },
      { x: 440, y: 230 },
    ],
  },
  {
    id: "vip-red-bottom",
    name: "VIP FRONT B",
    type: "seating",
    price: "$2,500",
    rows: 6,
    count: 100,
    points: [
      { x: 360, y: 370 },
      { x: 580, y: 370 },
      { x: 580, y: 460 },
      { x: 440, y: 460 },
    ],
  },
  {
    id: "box-top-left",
    name: "BOX 1",
    type: "seating",
    price: "$1,500",
    rows: 2,
    count: 10,
    points: [
      { x: 200, y: 90 },
      { x: 350, y: 90 },
      { x: 350, y: 130 },
      { x: 200, y: 130 },
    ],
  },
  {
    id: "box-top-right",
    name: "BOX 2",
    type: "seating",
    price: "$1,500",
    rows: 2,
    count: 10,
    points: [
      { x: 370, y: 90 },
      { x: 520, y: 90 },
      { x: 520, y: 130 },
      { x: 370, y: 130 },
    ],
  },
  {
    id: "box-bottom-left",
    name: "BOX 3",
    type: "seating",
    price: "$1,500",
    rows: 2,
    count: 10,
    points: [
      { x: 200, y: 470 },
      { x: 350, y: 470 },
      { x: 350, y: 510 },
      { x: 200, y: 510 },
    ],
  },
  {
    id: "box-bottom-right",
    name: "BOX 4",
    type: "seating",
    price: "$1,500",
    rows: 2,
    count: 10,
    points: [
      { x: 370, y: 470 },
      { x: 520, y: 470 },
      { x: 520, y: 510 },
      { x: 370, y: 510 },
    ],
  },
  {
    id: "tier-inner-blue",
    name: "TIER INNER BLUE",
    type: "seating",
    price: "$1,200",
    rows: 10,
    count: 200,
    points: [
      { x: 10, y: 120 },
      { x: 180, y: 80 },
      { x: 180, y: 520 },
      { x: 10, y: 480 },
    ],
  },
  {
    id: "tier-middle-red",
    name: "TIER MIDDLE RED",
    type: "seating",
    price: "$800",
    rows: 12,
    count: 300,
    points: [
      { x: 190, y: 20 },
      { x: 550, y: 20 },
      { x: 550, y: 70 },
      { x: 190, y: 70 },
    ],
  },
  {
    id: "tier-outer-yellow",
    name: "TIER OUTER YELLOW",
    type: "seating",
    price: "$400",
    rows: 15,
    count: 500,
    points: [
      { x: 570, y: 20 },
      { x: 780, y: 20 },
      { x: 780, y: 180 },
      { x: 570, y: 100 },
    ],
  },
  {
    id: "tier-outer-yellow-2",
    name: "TIER OUTER YELLOW 2",
    type: "seating",
    price: "$400",
    rows: 15,
    count: 500,
    points: [
      { x: 570, y: 500 },
      { x: 780, y: 420 },
      { x: 780, y: 580 },
      { x: 570, y: 580 },
    ],
  },
];

const EXPERIENCE_MOCK = [];
const REVIEWS_MOCK = [];
const RELATED_EVENTS_MOCK = [];

const EventDetail = () => {
  const { id } = useParams();
  const [customTicketDesign, setCustomTicketDesign] = useState(null);
  const [showPrinter, setShowPrinter] = useState(false);
  const [printingData, setPrintingData] = useState(null);
  const [isPrinterProcessing, setIsPrinterProcessing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('laika_ticket_design');
    if (saved) {
      try {
        setCustomTicketDesign(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading ticket design:", e);
      }
    }
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  // Configuración dinámica de Lucky Seat
  const [luckyConfig, setLuckyConfig] = useState(() => {
    const saved = localStorage.getItem('laika_lucky_config');
    return saved ? JSON.parse(saved) : {
      probs: { platinum: 15, gold: 25, general: 60 },
      themes: { bronze: '#cd7f32', silver: '#cbd5e1', gold: '#EAB308', platinum: '#ffffff' },
      pointsRate: { earnPerDollar: 0.1, luckySeatCost: 40, attendanceBonus: 50 }
    };
  });

  const { addToCart, openCart } = useCart();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showQtyDropdown, setShowQtyDropdown] = useState(false);
  const [zones, setZones] = useState(INITIAL_ZONES);

  // State for selected function (date/time/venue)
  const [selectedFunction, setSelectedFunction] = useState(null);
  // State for selected ticket section
  const [selectedSection, setSelectedSection] = useState(null);
  // State for sorting tickets
  const [activeTab, setActiveTab] = useState("lowest"); // 'lowest' or 'best'

  // Map Interaction State
  const [mapScale, setMapScale] = useState(0.6);
  const [mapPos, setMapPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Seat Selection State
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Lucky Roulette State
  const [isRouletteActive, setIsRouletteActive] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState(null);
  const [showProbModal, setShowProbModal] = useState(false);
  const [winningSeatId, setWinningSeatId] = useState(null);
  const [showRoulettePayment, setShowRoulettePayment] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showCrownTransition, setShowCrownTransition] = useState(false);
  const [winningSeatInfo, setWinningSeatInfo] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [busySeats, setBusySeats] = useState([]);
  const [activeScannerZoneId, setActiveScannerZoneId] = useState(null);
  const [activeScannerSeatId, setActiveScannerSeatId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  // Merch Modal State
  const [selectedMerchItem, setSelectedMerchItem] = useState(null);

  // Estados para Compra Directa de Boletos
  const [showDirectPayment, setShowDirectPayment] = useState(false);
  const [directTicketData, setDirectTicketData] = useState(null);
  const [showSuccessTicket, setShowSuccessTicket] = useState(false);
  const [merchSize, setMerchSize] = useState('M');
  const [merchQty, setMerchQty] = useState(1);
  const [merchColorIdx, setMerchColorIdx] = useState(0);
  const [merchGalleryIdx, setMerchGalleryIdx] = useState(0);



  const getDashboardLink = () => {
    if (!user?.role) return "/profile";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "gestor":
        return "/events/manage";
      case "operador":
        return "/staff";
      default:
        return "/profile";
    }
  };

  // Sort sections based on active tab - Fixed parsing for formatted price strings
  const sortedSections = React.useMemo(() => {
    if (!event) return [];

    // Helper globally defined at file scope (line 72 approx)

    // If no sections, create a full range of mock sections (General, Bronce, Plata, Platino, VIP)
    let sections = [];
    if (event.sections && event.sections.length > 0) {
      sections = [...event.sections];
    }

    if (activeTab === "lowest") {
      // Precio más bajo: De menor a mayor
      return sections.sort((a, b) => cleanPrice(a.price) - cleanPrice(b.price));
    } else {
      // Mejores asientos: De mayor a menor (Premium arriba)
      return sections.sort((a, b) => cleanPrice(b.price) - cleanPrice(a.price));
    }
  }, [event, activeTab]);

  // Sincronizar zonas del mapa con los precios y nombres reales de las secciones
  const synchronizedZones = React.useMemo(() => {
    if (!zones || !sortedSections) return zones;
    return zones.map((z) => {
      // Intentar encontrar una sección que coincida por nombre o ID base
      const match = sortedSections.find((s) => {
        const zoneName = String(z.name || "").toUpperCase();
        const sectionName = String(s.name || "").toUpperCase();
        const sid = String(s.id || "");
        const zid = String(z.id || "");
        return (
          sectionName === zoneName ||
          sectionName.includes(zoneName) ||
          zoneName.includes(sectionName) ||
          sid === zid ||
          zid === sid.replace("-mock", "")
        );
      });

      if (match) {
        return {
          ...z,
          id: match.id, // Alineamos el ID para que toggleSeat lo encuentre
          price: `$${cleanPrice(match.price).toLocaleString("es-MX")}`,
          name: match.name, // Alineamos el nombre
        };
      }
      return z;
    });
  }, [zones, sortedSections]);

  const toggleSeat = (seatId) => {
    const isRemoving = selectedSeats.includes(seatId);
    
    if (isRemoving) {
      setSelectedSeats([]);
    } else {
      // SELECCIÓN ÚNICA: Reemplazamos cualquier selección anterior
      const sectionIdFromSeat = String(seatId).split('-')[0];
      const zone = sortedSections.find(s => String(s.id) === sectionIdFromSeat);
      if (zone) {
          setSelectedSection(zone);
          setQuantity(1); // Bloqueamos a 1 boleto para ese asiento específico
      }
      setSelectedSeats([seatId]);
    }
  };

  useEffect(() => {
    fetchEventDetail();
    const interval = setInterval(() => fetchEventDetail(true), 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (event) {
      const recentlyViewed = JSON.parse(
        localStorage.getItem("recently_viewed") || "[]",
      );
      const newItem = {
        id: event.id,
        name: event.name,
        image: event.image_url || event.image,
        venue: event.venue || event.location,
      };

      // Remove if already exists and add to front (max 5)
      const updated = [
        newItem,
        ...recentlyViewed.filter((item) => item.id !== event.id),
      ].slice(0, 5);
      localStorage.setItem("recently_viewed", JSON.stringify(updated));

      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event("recentlyViewedUpdated"));
    }
  }, [event]);

  // Carga de Geometría Persistente (Admin Sync)
  useEffect(() => {
    if (!id) return;
    const storageKey = `laika_map_zones_event_${id}`;
    const savedZones = localStorage.getItem(storageKey);
    if (savedZones) {
      try {
        setZones(JSON.parse(savedZones));
      } catch (e) {
        console.error("Error al cargar zonas guardadas", e);
        setZones(INITIAL_ZONES);
      }
    } else {
      // Fallbacks dinámicos
      if (id === "2") setZones(SUMMER_EDITION_PRESET);
      else if (id === "3" || id === "4") setZones(STADIUM_ZONES);
      else setZones(INITIAL_ZONES);
    }
  }, [id]);

  const fetchEventDetail = async (background = false) => {
    if (!background) setLoading(true);
    try {
      // 1. Cargar evento y asientos ocupados EN PARALELO para ahorrar tiempo
      const [response, busy] = await Promise.all([
        api.event.getById(id),
        api.ticket.getBusySeats(id).catch(() => [])
      ]);
      
      setEvent(response);
      setBusySeats(busy || []);

      // Auto-select first function if not selected and available
      if (
        !selectedFunction &&
        response.functions &&
        response.functions.length > 0
      ) {
        setSelectedFunction(response.functions[0]);
      }

      // Sincronizar sección seleccionada para mantenerla viva tras el refresco
      if (selectedSection) {
        const matchingSec = response.sections?.find(s => String(s.id) === String(selectedSection.id));
        if (matchingSec) {
          setSelectedSection(matchingSec);
        }
      }
    } catch (error) {
      if (!background) {
        showError("Evento no encontrado o no disponible");
        navigate("/");
      }
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      showError("Debes iniciar sesión para comprar boletos");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (!event || event.available_tickets < quantity) {
      showError("No hay suficientes boletos disponibles");
      return;
    }

    // Logic for function selection
    let functionData = null;
    if (event.functions && event.functions.length > 0) {
      if (!selectedFunction) {
        showError("Por favor selecciona una fecha");
        return;
      }
      functionData = selectedFunction;
    }

    // Pass event, quantity, and functionData (contains functionId, date, venue)
    if (selectedSeats && selectedSeats.length > 0) {
      // Si hay asientos seleccionados, agregamos cada uno con su ID
      selectedSeats.forEach(seatId => {
        addToCart(event, 1, functionData, {
          ...selectedSection,
          seatId: seatId,
          name: `${selectedSection?.name || 'ASIENTO'} ${seatId.split('-').slice(-2).join('-')}`
        });
      });
      success(`${selectedSeats.length} asientos agregados al carrito`);
      setSelectedSeats([]);
    } else {
      addToCart(event, quantity, functionData, selectedSection);
    }

    // ACTUAR DE FORMA DIRECTA: Abrir pago rápido de boleto
    setDirectTicketData({
      event: event,
      quantity: quantity,
      section: selectedSection,
      functionData: functionData,
      seats: selectedSeats
    });
    setShowDirectPayment(true);
  };

  const handleLuckySeat = () => {
    if (!user) {
      showError("Debes iniciar sesión para jugar a la ruleta");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    // Asegurar que empezamos sin estado de "procesando" para ver las opciones
    setIsProcessingPayment(false); 
    setShowRoulettePayment(true);
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const confirmDirectPayment = async (method) => {
    setIsProcessingPayment(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay dramático

      const payload = {
        event_id: id,
        quantity: directTicketData?.quantity || quantity,
        price: cleanPrice(directTicketData?.section?.price || selectedSection?.price),
        ticket_type: directTicketData?.section?.id === 'platino-vip' ? 'vip' : 'general',
        payment_method: method === 'oxxo' ? 'oxxo' : 'card',
        function_id: directTicketData?.functionData?.id || selectedFunction?.id,
        seats: directTicketData?.seats || selectedSeats
      };

      let response;
      try {
        response = await api.ticket.purchase(payload);
      } catch (err) {
        console.warn("Direct Purchase API failed, using mock:", err);
        response = { success: true, id: "mock-" + Date.now() };
      }

      if (response.success || response.id) {
        setShowDirectPayment(false);
        setPrintingData({
          eventName: directTicketData?.event?.name || event.name,
          date: formatDate(directTicketData?.functionData?.date || selectedFunction?.date || displayDate),
          time: formatTime(directTicketData?.functionData?.time || selectedFunction?.time || displayTime),
          venueName: event.venue?.name || "LAIKA ARENA",
          sectionName: directTicketData?.section?.name || selectedSection?.name || "GENERAL",
          seat: directTicketData?.seats?.length > 0 ? directTicketData.seats.map(s => s.split('-').slice(-2).join('-')).join(', ') : "General",
          total: cleanPrice(directTicketData?.section?.price || selectedSection?.price) * (directTicketData?.quantity || 1),
          ticketBg: getImageUrl(directTicketData?.event?.image_url || event.image_url)
        });
        
        // ACTIVAR ANIMACIÓN LÁSER PREVIA A LA IMPRESIÓN 🎬
        setShowPrinter(true);
        setIsPrinterProcessing(true);
        
        setTimeout(() => {
          setIsPrinterProcessing(false); // <--- Cambia a revelado del boleto
        }, 15000); // 15 Segundos de Láser Cinemático (Restaurado)
        
        if (directTicketData?.seats?.length > 0) setSelectedSeats([]);
      } else {
        showError(response.message || "Error al procesar el boleto.");
      }
    } catch (err) {
      console.error("Direct Purchase Error:", err);
      showError("Fallo en la conexión. No se pudo completar la compra.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const confirmRoulettePayment = async (method) => {
    setIsProcessingPayment(true);
    try {
      // Simulación de delay de red / procesamiento bancario (3s de tensión inicial)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      let response;
      try {
        response = await api.ticket.luckySeatAssign(id, {
          payment_method: method,
          function_id: selectedFunction?.id,
        });
      } catch (err) {
        console.warn("Lucky Seat API failed, using mock:", err);
        // Generar un asiento mock válido de una zona real para la animación
        const availableZones = synchronizedZones.filter(z => z.type === 'seating');
        const randomZone = availableZones[Math.floor(Math.random() * availableZones.length)] || { id: 'platino-vip', name: 'PLATINO VIP' };
        response = {
          success: true,
          seatId: `${randomZone.id}-2-4`,
          seat_label: `ASIENTO 2-4`,
          section_name: randomZone.name
        };
      }

      if (response.success) {
        success(
          `Pago con ${method === "card" ? "Tarjeta" : "Créditos"} aprobado. ¡Buscando tu asiento!`,
        );
        setShowRoulettePayment(false);

        // Guardar el resultado para el modal final
        setRouletteWinner(response);
        // ID que el SVG usará para frenar la animación en el punto exacto
        setWinningSeatId(response.seatId || 'platino-vip-1-1');
        
        setWinningSeatInfo({
          id: response.seatId,
          name: response.seat_label || `ASIENTO ${response.seatId.split("-").slice(-2).join("-")}`,
          zoneName: response.section_name || "ZONA PREMIADA",
          price: 400.0,
          category: "LUCKY SEAT",
        });

        // ACTIVAR RULETA
        setIsRouletteActive(true);
      } else {
        showError(response.message || "Error al procesar el pago de la ruleta.");
      }
    } catch (err) {
      console.error("Lucky Seat Payment Error:", err);
      showError("Fallo en la conexión. No se pudo procesar el pago.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Lógica de Animación de Ruleta (Fase 1: Zonas, Fase 2: Asientos)
  useEffect(() => {
    if (!isRouletteActive || !winningSeatId || !synchronizedZones.length) {
        setActiveScannerZoneId(null);
        return;
    }

    const DURATION_ZONES = 4500;
    const DURATION_SEATS = 4500;
    const startTime = Date.now();
    const winnerZoneId = winningSeatId.split('-')[0];
    let timerId;

    const runScan = () => {
        const elapsed = Date.now() - startTime;

        if (elapsed < DURATION_ZONES) {
            // FASE 1: Escaneo rápido de zonas
            const availableZones = synchronizedZones.filter(z => z.type === 'seating');
            const randomZone = availableZones[Math.floor(Math.random() * availableZones.length)];
            setActiveScannerZoneId(randomZone.id);
            setActiveScannerSeatId(null);
            timerId = setTimeout(runScan, 100);
        } 
        else if (elapsed < DURATION_ZONES + DURATION_SEATS) {
            // FASE 2: Escaneo de asientos en la zona ganadora
            setActiveScannerZoneId(winnerZoneId);
            
            // Generar una secuencia "barrido" de asientos
            const seatsInZone = [];
            for(let r=0; r<5; r++) for(let c=0; c<8; c++) seatsInZone.push(`${winnerZoneId}-${r}-${c}`);
            
            const subElapsed = elapsed - DURATION_ZONES;
            const progress = subElapsed / DURATION_SEATS;
            const seatIdx = Math.floor(progress * seatsInZone.length);
            setActiveScannerSeatId(seatsInZone[Math.min(seatIdx, seatsInZone.length - 1)]);

            timerId = setTimeout(runScan, 50);
        }
        else {
            // FASE 3: Corona y Final
            setActiveScannerSeatId(winningSeatId);
            setShowCrownTransition(true);
            setTimeout(() => {
                setShowCrownTransition(false);
                handleRouletteComplete();
            }, 3000); // 3 segundos de corona
        }
    };

    runScan();
    return () => clearTimeout(timerId);
  }, [isRouletteActive, winningSeatId, synchronizedZones]);

  const handleRouletteComplete = () => {
    // La ruleta terminó tras el drama. Mostramos el modal de Ganador WOW.
    setShowWinnerModal(true);
    setIsRouletteActive(false);
    setActiveScannerZoneId(null);
    // IMPORTANTE: No limpiamos winningSeatId aquí para que se vea en el mapa de fondo
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return new Date(dateString).toLocaleDateString("es-MX", options);
  };

  const formatTime = (time) => {
    if (!time) return "";
    const str = String(time);
    if (str.includes(":")) return str.substring(0, 5);
    return str;
  };

  if (loading || !event) {
    // Implementación Skeleton Premium para EventDetail
    return (
      <div className="event-detail-page app-skeleton">
        <div className="event-detail-container">
          {/* Botón Volver */}
          <div className="skeleton" style={{ width: "80px", height: "30px", borderRadius: "6px", marginBottom: "1.5rem" }} />

          <div className="event-detail-content layout-dual-column">
            {/* COLUMNA IZQUIERDA SKELETON (Mapa y Metadatos) */}
            <div className="event-left-column" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Poster Skeleton con Header Superpuesto */}
              <div style={{
                width: "100%",
                height: "380px",
                position: "relative",
                border: "1px solid rgba(0,0,0,0.08)",
                marginBottom: "1rem",
                overflow: "hidden"
              }}>
                {/* Fondo poster skeleton */}
                <div className="skeleton" style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
                
                {/* Barra inferior Glassmorphism Skeleton */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "1.25rem 2rem",
                  background: "rgba(255,255,255,0.85)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ width: "60%" }}>
                    <div className="skeleton" style={{ width: "80%", height: "35px", borderRadius: "4px", marginBottom: "0.8rem", background: "rgba(0,0,0,0.1)" }} />
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div className="skeleton" style={{ width: "30%", height: "18px", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }} />
                      <div className="skeleton" style={{ width: "40%", height: "18px", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }} />
                    </div>
                  </div>
                  
                  {/* Redes Sociales Skeleton inline */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: "50px", height: "12px", borderRadius: "2px", background: "rgba(0,0,0,0.1)" }} />
                    <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(0,0,0,0.1)" }} />
                    <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(0,0,0,0.1)" }} />
                    <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(0,0,0,0.1)" }} />
                  </div>
                </div>
              </div>

              {/* Mapa de Asientos Skeleton */}
              <div className="event-map">
                <div className="skeleton" style={{ width: "250px", height: "24px", borderRadius: "4px", marginBottom: "1rem" }} />
                <div className="skeleton" style={{ width: "100%", height: "450px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              {/* Ubicación Exacta Skeleton */}
              <div className="location-section">
                <div className="skeleton" style={{ width: "200px", height: "24px", borderRadius: "4px", marginBottom: "1rem" }} />
                <div className="skeleton" style={{ width: "100%", height: "300px", borderRadius: "0", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "1rem" }} />
                <div className="skeleton" style={{ width: "200px", height: "40px", borderRadius: "6px" }} /> /* Botón GPS */
              </div>

              {/* Descripción Skeleton */}
              <div className="event-description">
                <div className="skeleton" style={{ width: "150px", height: "28px", borderRadius: "4px", marginBottom: "1rem" }} />
                <div className="skeleton" style={{ width: "100%", height: "16px", borderRadius: "4px", marginBottom: "0.5rem" }} />
                <div className="skeleton" style={{ width: "95%", height: "16px", borderRadius: "4px", marginBottom: "0.5rem" }} />
                <div className="skeleton" style={{ width: "90%", height: "16px", borderRadius: "4px", marginBottom: "0.5rem" }} />
                <div className="skeleton" style={{ width: "60%", height: "16px", borderRadius: "4px" }} />
              </div>
            </div>

            {/* COLUMNA DERECHA SKELETON (Selector de Boletos) */}
            <div className="event-right-column">
              <div className="ticket-selection-panel" style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
                
                {/* Fechas Skeleton */}
                <div className="skeleton" style={{ width: "150px", height: "16px", borderRadius: "4px", marginBottom: "0.8rem" }} />
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <div className="skeleton" style={{ width: "120px", height: "36px", borderRadius: "20px" }} />
                  <div className="skeleton" style={{ width: "120px", height: "36px", borderRadius: "20px" }} />
                </div>

                {/* Filtros Skeleton */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div className="skeleton" style={{ width: "100px", height: "20px", borderRadius: "4px" }} />
                    <div className="skeleton" style={{ width: "120px", height: "20px", borderRadius: "4px" }} />
                  </div>
                  <div className="skeleton" style={{ width: "140px", height: "24px", borderRadius: "12px" }} />
                </div>

                {/* Lista de Boletos (Opciones de Filas) */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", padding: "1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", background: "rgba(255,255,255,0.02)" }}>
                      <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "4px", marginRight: "1rem" }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ width: "60%", height: "16px", borderRadius: "4px", marginBottom: "0.5rem" }} />
                        <div className="skeleton" style={{ width: "40%", height: "12px", borderRadius: "4px" }} />
                      </div>
                      <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                    </div>
                  ))}
                </div>

                {/* Compra Inferior Skeleton (Sticky Bottom) */}
                <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div className="skeleton" style={{ width: "80px", height: "16px", borderRadius: "4px" }} />
                    <div className="skeleton" style={{ width: "60px", height: "36px", borderRadius: "6px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div className="skeleton" style={{ width: "100px", height: "20px", borderRadius: "4px" }} />
                    <div className="skeleton" style={{ width: "120px", height: "28px", borderRadius: "4px" }} />
                  </div>
                  <div className="skeleton" style={{ width: "100%", height: "54px", borderRadius: "8px", marginBottom: "1rem" }} />
                  <div className="skeleton" style={{ width: "100%", height: "54px", borderRadius: "8px" }} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-not-found">
        <h2>Evento no encontrado</h2>
        <Button onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    );
  }

  const categoryLabels = {
    concert: "Concierto",
    sport: "Deporte",
    theater: "Teatro",
    festival: "Festival",
    other: "Otro",
  };

  const imageUrl = getImageUrl(event.image_url || event.image);
  const hasFunctions = event.functions && event.functions.length > 0;

  // Determine display values based on selection or main event
  const displayDate = selectedFunction
    ? selectedFunction.date
    : event.event_date || event.date;
  const displayTime = selectedFunction
    ? selectedFunction.time
    : event.event_time || event.time;
  const displayVenue = selectedFunction
    ? selectedFunction.venue_name || event.venue
    : event.venue_name || event.venue || "Coca-Cola Arena";
  const displayCity = selectedFunction
    ? selectedFunction.venue_city || event.location
    : event.venue_city || event.location || "Dubai, UAE";

  // Dynamic Map URL: Use backend provided URL or generate from Venue/City
  const displayMapUrl =
    selectedFunction?.map_url ||
    event.map_url ||
    (event.venue || event.location
      ? `https://maps.google.com/maps?q=${encodeURIComponent(displayVenue + " " + displayCity)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m13!1d3609.916812852277!2d55.27116857624641!3d25.205996020110305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43db066343df%3A0xa0a0a0a0a0a0a0a0!2sCoca-Cola%20Arena!5e0!3m2!1sen!2sae!4v1700000000000!5m2!1sen!2sae");

  return (
    <div
      className="event-detail-page"
      style={imageUrl ? { "--event-bg": `url("${imageUrl}")` } : {}}
    >
      <div className="event-detail-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <div className="event-detail-content layout-dual-column">
          {/* COLUMNA IZQUIERDA: Mapa y Metadatos */}
          <div className="event-left-column">
            {/* ── POSTER CON HEADER SUPERPUESTO (ESTILO CARRUSEL) ─────────────────── */}
            <div style={{
              width: "100%",
              height: "380px",
              borderRadius: "0",
              overflow: "hidden",
              position: "relative",
              border: "1px solid rgba(0,0,0,0.08)",
              marginBottom: "1rem",
              backgroundColor: "#f5f5f5"
            }}>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={event.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />
              )}

              {/* Barra superior Glassmorphism */}
              <div className="event-meta-header" style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                margin: 0,
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}>
                <div>
                  <h1 style={{ fontSize: "1.8rem", marginBottom: "0.2rem", fontWeight: 950, textTransform: "uppercase", letterSpacing: "-0.5px", color: "#fff" }}>
                    {event.name}
                  </h1>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                    <span><Icon name="calendar" size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }}/> {formatDate(displayDate)}</span>
                    {displayTime && (
                      <span><Icon name="clock" size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }}/> {formatTime(displayTime)} hrs</span>
                    )}
                    <span>
                      <Icon name="mapPin" size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }}/> {displayVenue}{" "}
                      {displayCity && displayCity !== displayVenue ? `, ${displayCity}` : ""}
                    </span>
                  </div>
                </div>

                {/* Redes Sociales al lado derecho como un botón de acción extra */}
                <div className="artist-socials" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px' }}>REDES:</span>
                   <a href="#instagram" onClick={e => e.preventDefault()} style={{ color: '#fff', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.7}><Icon name="instagram" size={18} /></a>
                   <a href="#facebook" onClick={e => e.preventDefault()} style={{ color: '#fff', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.7}><Icon name="facebook" size={18} /></a>
                   <a href="#twitter" onClick={e => e.preventDefault()} style={{ color: '#fff', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.7}><Icon name="twitter" size={18} /></a>
                </div>
              </div>
            </div>

            {/* ── MAPA DE ASIENTOS INTERACTIVO ─────────────────── */}
            <div className="event-map">
              <h3 className="section-label-premium">
                <Icon name="map" size={16} /> Mapa del Recinto (Zoomable)
              </h3>
              <div
                className={`seat-map-wrapper ${isDragging ? "dragging" : ""}`}
                onMouseDown={(e) => {
                  setIsDragging(true);
                  // Grab current screen coords relative to the current internal mapPos, adjusted for scale
                  setDragStart({
                    x: e.clientX,
                    y: e.clientY,
                    initialPos: { ...mapPos }
                  });
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  // Straight 1:1 pixel movement for better feel in translate-before-scale setup
                  const dx = e.clientX - dragStart.x;
                  const dy = e.clientY - dragStart.y;
                  setMapPos({
                    x: dragStart.initialPos.x + dx,
                    y: dragStart.initialPos.y + dy,
                  });
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <div
                  className="seat-map-content"
                  style={{
                    transform: `translate(-50%, -50%) translate(${mapPos.x}px, ${mapPos.y}px) scale(${mapScale})`,
                    cursor: isDragging ? "grabbing" : "grab",
                  }}
                >
                  <VenueMapSVG
                    zones={synchronizedZones}
                    selectedZoneId={isRouletteActive ? null : selectedSection?.id}
                    mapView={{ zoom: 1, pan: { x: 0, y: 0 } }}
                    onZoneSelect={(zoneId) => {
                      let actualSec = sortedSections.find(
                        (s) => s.id?.toString() === zoneId?.toString()
                      );
                      
                      // Fallback: Si no se encuentra sección real, crear una basada en la zona del mapa
                      if (!actualSec) {
                        const zone = synchronizedZones.find(z => z.id === zoneId);
                        if (zone) {
                          actualSec = {
                            id: zone.id,
                            name: zone.name,
                            price: zone.price
                          };
                        }
                      }

                      if (actualSec) {
                        setSelectedSection(actualSec);
                      }
                    }}
                    selectedSeats={selectedSeats}
                    onSeatToggle={toggleSeat}
                    busySeats={busySeats}
                    activeTab={activeTab}
                    rouletteActive={isRouletteActive}
                    winnerSeatId={winningSeatId}
                    activeScannerZoneId={activeScannerZoneId}
                    activeScannerSeatId={activeScannerSeatId}
                    showCrownTransition={showCrownTransition}
                    onRouletteComplete={handleRouletteComplete}
                  />
                </div>

                {/* Controles de Zoom */}
                <div className="map-controls">
                  <button
                    onClick={() =>
                      setMapScale((prev) => Math.min(prev + 0.3, 4))
                    }
                    title="Aumentar Zoom"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSection(null);
                      setMapScale(1.2);
                      setMapPos({ x: 0, y: 0 });
                    }}
                    title="Reiniciar Vista"
                  >
                    <Icon name="refreshCcw" size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setMapScale((prev) => Math.max(prev - 0.3, 0.5))
                    }
                    title="Alejar Zoom"
                  >
                    −
                  </button>
                </div>
              </div>
            </div>

            {/* ── UBICACIÓN EXACTA (MAPA REAL) ─────────────────── */}
            <div className="location-section">
              <h3 className="section-label-premium">
                <Icon name="mapPin" size={16} /> Ubicación Coca-Cola Arena
              </h3>
              <div
                className="google-mini-map"
                style={{
                  borderRadius: "0",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <iframe
                  title="Ubicación Estadio GNP Seguros"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{
                    border: 0,
                    filter:
                      "invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.2)",
                  }}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3763.154175971375!2d-99.0960131!3d19.405743400000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1fc241cd2cc61%3A0xd994597d3d690170!2sEstadio%20GNP%20Seguros!5e0!3m2!1ses-419!2smx!4v1772623971740!5m2!1ses-419!2smx"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <button
                className="google-maps-btn"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayVenue + " " + displayCity)}`,
                    "_blank",
                  )
                }
              >
                Abrir en Navegador GPS →
              </button>
            </div>

            <div className="event-description">
              <h2>Descripción</h2>
              <p>{event.description || "Sin descripción disponible"}</p>
            </div>

            {event.rules && event.rules.length > 0 ? (
              event.rules.map((rule, idx) => (
                <Accordion
                  key={rule.id || idx}
                  title={rule.title}
                  icon={rule.icon}
                  className={idx === 0 ? "mt-4" : "mt-2"}
                >
                  <p style={{ whiteSpace: "pre-line" }}>{rule.description}</p>
                </Accordion>
              ))
            ) : (
              <>
                <Accordion
                  title="Reglas de Acceso y Límites"
                  icon="alertTriangle"
                  className="mt-4"
                >
                  <p>
                    <strong>Límite de edad:</strong> Sin límite de edad (sujeto
                    a cambios por evento).
                  </p>
                  <p>
                    <strong>Pagan boleto a partir de:</strong> 3 años de edad.
                  </p>
                  <p>
                    <strong>Restricciones:</strong> Se prohíbe el ingreso de
                    alimentos y/o bebidas ajenos al inmueble. También se prohíbe
                    el acceso de objetos voluminosos, cámaras fotográficas o de
                    video profesionales.
                  </p>
                  <p>
                    <strong>Límite de acceso:</strong> Una vez iniciada la
                    función, se dará acceso a sala en un momento adecuado
                    determinado por el personal.
                  </p>
                  <p>
                    <strong>Límite de boletos:</strong> Máximo 10 boletos por
                    persona/transacción.
                  </p>
                </Accordion>

                <Accordion
                  title="Servicios y Duración"
                  icon="info"
                  className="mt-2"
                >
                  <p>
                    <strong>Servicios en el Inmueble:</strong> Barras de snacks
                    y bebidas, venta de mercancía oficial, sanitarios, stands
                    para toma de fotos.
                  </p>
                  <p>
                    <strong>Duración aproximada:</strong> 2 horas (puede variar
                    según el evento).
                  </p>
                  <p>
                    <strong>Accesibilidad:</strong> Contamos con zonas
                    designadas para sillas de ruedas. Por favor contacte al
                    personal a su llegada.
                  </p>
                </Accordion>
              </>
            )}

            {/* ── MERCANCÍA OFICIAL ─────────────────── */}
            <div className="event-merch-section" style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <h3 className="section-label-premium" style={{ marginBottom: '1rem' }}>
                <Icon name="shoppingBag" size={16} /> Mercancía Oficial
              </h3>
              <div className="merch-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                 {MOCK_MERCH.slice(0, 6).map(item => (
                    <MerchProductCard
                      key={item.id}
                      item={item}
                      onSelect={(cardColorIdx) => {
                        setSelectedMerchItem(item);
                        setMerchSize('M');
                        setMerchQty(1);
                        setMerchColorIdx(cardColorIdx);
                        setMerchGalleryIdx(0);
                      }}
                    />
                 ))}
              </div>

              {/* ── PRODUCT DETAIL MODAL (gallery left + info right) ── */}
              {selectedMerchItem && (() => {
                const activeColor = selectedMerchItem.colors[merchColorIdx] || selectedMerchItem.colors[0];
                const galleryImages = activeColor.images;
                const hasSize = ['Playera','Gorra','Hoodie','Bufanda'].includes(selectedMerchItem.type);
                return (
                  <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setSelectedMerchItem(null)}
                  >
                    <div
                      className="glass-card"
                      style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '24px', width: '860px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Close */}
                      <button onClick={() => setSelectedMerchItem(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

                      {/* LEFT — Image Gallery */}
                      <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '0', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                        {/* Main image */}
                        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                          <img
                            src={galleryImages[merchGalleryIdx] || galleryImages[0]}
                            alt={selectedMerchItem.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.25s' }}
                          />
                        </div>
                        {/* Thumbnails strip */}
                        {galleryImages.length > 1 && (
                          <div style={{ display: 'flex', height: '70px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {galleryImages.map((img, gi) => (
                              <div
                                key={gi}
                                onClick={() => setMerchGalleryIdx(gi)}
                                style={{ flex: 1, overflow: 'hidden', cursor: 'pointer', opacity: merchGalleryIdx === gi ? 1 : 0.45, transition: 'opacity 0.2s', borderRight: gi < galleryImages.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
                              >
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* RIGHT — Product Info */}
                      <div style={{ width: '340px', flexShrink: 0, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
                        <div>
                          <span style={{ fontSize: '0.6rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px' }}>{selectedMerchItem.type}</span>
                          <h2 style={{ color: '#fff', margin: '0.3rem 0 0', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', lineHeight: 1.2 }}>{selectedMerchItem.name}</h2>
                          <p style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: '0.6rem 0 0' }}>
                            ${selectedMerchItem.price.toLocaleString("es-MX")}
                            <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 400, marginLeft: '6px' }}>MXN</span>
                          </p>
                        </div>

                        {/* Color selector */}
                        <div>
                          <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 0.6rem' }}>
                            Color: <span style={{ color: '#fff' }}>{activeColor.name}</span>
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {selectedMerchItem.colors.map((c, ci) => (
                              <button
                                key={ci}
                                title={c.name}
                                onClick={() => { setMerchColorIdx(ci); setMerchGalleryIdx(0); }}
                                style={{
                                  width: '28px', height: '28px', borderRadius: '50%',
                                  background: c.hex.startsWith('linear') ? c.hex : c.hex,
                                  border: `2px solid ${merchColorIdx === ci ? '#fff' : '#444'}`,
                                  cursor: 'pointer', padding: 0, transition: 'border-color 0.15s',
                                  boxShadow: merchColorIdx === ci ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none'
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Size selector */}
                        {hasSize && (
                          <div>
                            <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 0.6rem' }}>Talla</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {['XS','S','M','L','XL','XXL'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => setMerchSize(s)}
                                  style={{
                                    minWidth: '44px', height: '44px', padding: '0 8px',
                                    border: `1px solid ${merchSize === s ? '#fff' : 'rgba(255,255,255,0.15)'}`,
                                    background: merchSize === s ? '#fff' : 'transparent',
                                    color: merchSize === s ? '#000' : '#aaa',
                                    fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.15s'
                                  }}
                                >{s}</button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity */}
                        <div>
                          <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 0.6rem' }}>Cantidad</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                            <button
                              onClick={() => setMerchQty(q => Math.max(1, q - 1))}
                              style={{ width: '40px', height: '40px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 900 }}
                            >−</button>
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', width: '48px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', borderLeft: 'none', borderRight: 'none', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{merchQty}</span>
                            <button
                              onClick={() => setMerchQty(q => q + 1)}
                              style={{ width: '40px', height: '40px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 900 }}
                            >+</button>
                            <span style={{ marginLeft: 'auto', color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>
                              ${(selectedMerchItem.price * merchQty).toLocaleString("es-MX")}
                            </span>
                          </div>
                        </div>

                        {/* Add to cart */}
                        <Button
                          variant="primary"
                          fullWidth
                          size="large"
                          style={{ fontWeight: 900, letterSpacing: '2px', marginTop: 'auto' }}
                          onClick={() => {
                            const colorLabel = activeColor.name;
                            const sizeLabel = hasSize ? ` | Talla ${merchSize}` : '';
                            addToCart(
                              {
                                id: `merch_${selectedMerchItem.id}_${merchColorIdx}`,
                                name: `${selectedMerchItem.name} (${colorLabel}${sizeLabel})`,
                                price: selectedMerchItem.price,
                                image: activeColor.images[0]
                              },
                              merchQty,
                              null,
                              { id: 'MERCH', name: `MERCH: ${selectedMerchItem.type}`, price: selectedMerchItem.price }
                            );
                            setSelectedMerchItem(null);
                            success(`¡${selectedMerchItem.name} agregado al carrito!`);
                            openCart();
                          }}
                        >
                          AÑADIR AL CARRITO
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          {/* COLUMNA DERECHA: Selector de Boletos */}
          <div className="event-right-column">
            <div className="ticket-selection-panel">
                  {/* Banner informativo suave para admins (opcional, no bloquea) */}
                  {(user?.role === "admin" || user?.role === "gestor") && (
                    <div style={{ 
                      background: 'rgba(212, 175, 55, 0.1)', 
                      border: '1px solid rgba(212, 175, 55, 0.3)', 
                      padding: '0.8rem', 
                      marginBottom: '1rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: '#d4af37'
                    }}>
                      <Icon name="shield" size={14} style={{ marginRight: '8px' }} />
                      Modo de prueba habilitado para {user.role.toUpperCase()}
                    </div>
                  )}
                  {/* Function Selector (if needed) */}
                  {hasFunctions && (
                    <div className="function-selector-compact">
                      <h3>FECHAS DISPONIBLES:</h3>
                      <div className="function-chips">
                        {event.functions.map((fn) => (
                          <button
                            key={fn.id}
                            onClick={() => setSelectedFunction(fn)}
                            className={`function-chip ${selectedFunction?.id === fn.id ? "active" : ""}`}
                          >
                            {new Date(fn.date).toLocaleDateString("es-MX", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            • {String(fn.time).substring(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="ticket-filters">
                    <div className="ticket-tabs">
                      <button
                        className={`ticket-tab ${activeTab === "lowest" ? "active" : ""}`}
                        onClick={() => setActiveTab("lowest")}
                      >
                        Precio más bajo
                      </button>
                      <button
                        className={`ticket-tab ${activeTab === "best" ? "active" : ""}`}
                        onClick={() => setActiveTab("best")}
                      >
                        Mejores asientos
                      </button>
                    </div>
                    <div className="ticket-results-count">
                      <span>Opciones Disponibles</span>
                      <Badge variant="primary">
                        Quedan {event.available_tickets}
                      </Badge>
                    </div>
                  </div>

                  <div className="ticket-options-list" key={activeTab}>
                    {sortedSections.map((tier, idx) => (
                      <div
                        key={tier.id || idx}
                        className={`ticket-option-row selectable ${selectedSection?.id === tier.id || (tier.isGeneral && !selectedSection) ? "selected" : ""}`}
                        onClick={() => setSelectedSection(tier)}
                      >
                        <div
                          className="ticket-minimap"
                          style={
                            tier.isGeneral
                              ? {}
                              : { backgroundColor: tier.color_hex || "#e4e4e7" }
                          }
                        >
                          {tier.isGeneral ? "GRAL" : `Z${idx + 1}`}
                        </div>
                        <div className="ticket-info">
                          <div className="ticket-section-title">
                            {tier.name}
                            {tier.badge_text && (
                              <Badge
                                className={`ticket-badge ${tier.badge_text.toLowerCase().includes("vip") ? "vip" : ""}`}
                              >
                                {tier.badge_text}
                              </Badge>
                            )}
                          </div>
                          <div className="ticket-type-desc">
                            Disponible: {tier.available}
                          </div>
                          <div className="ticket-price-val">
                            ${Number(tier.price).toLocaleString("es-MX")}{" "}
                            <span className="each">cada uno</span>
                          </div>
                        </div>
                        <div className="ticket-action">
                          <div
                            className={`mock-radio ${selectedSection?.id === tier.id || (tier.isGeneral && !selectedSection) ? "checked" : ""}`}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="purchase-sticky-bottom">
                    <div className="quantity-selector-compact">
                      <label>Boletos:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                        disabled={selectedSeats.length > 0} 
                        style={{ width: '36px', height: '32px', border: '1px solid rgba(255,255,255,0.12)', borderRight: 'none', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: 900, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseOver={e=>!selectedSeats.length && (e.currentTarget.style.background='rgba(255,255,255,0.08)')}
                        onMouseOut={e=>!selectedSeats.length && (e.currentTarget.style.background='rgba(255,255,255,0.03)')}
                      >
                        −
                      </button>
                      <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem', width: '36px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        {quantity}
                      </span>
                      <button 
                        onClick={() => setQuantity(q => Math.min(10, q + 1))} 
                        disabled={selectedSeats.length > 0} 
                        style={{ width: '36px', height: '32px', border: '1px solid rgba(255,255,255,0.12)', borderLeft: 'none', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: 900, borderTopRightRadius: '8px', borderBottomRightRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseOver={e=>!selectedSeats.length && (e.currentTarget.style.background='rgba(255,255,255,0.08)')}
                        onMouseOut={e=>!selectedSeats.length && (e.currentTarget.style.background='rgba(255,255,255,0.03)')}
                      >
                        +
                      </button>
                    </div>
                    </div>

                    <div className="total-preview">
                      <span className="total-label">
                        {selectedSeats.length > 0
                          ? `Asiento ${selectedSeats[selectedSeats.length - 1].split("-").slice(-2).join("-")}:`
                          : "Subtotal:"}
                      </span>
                      <span className="total-amount">
                        $
                        {(
                          (selectedSection
                            ? cleanPrice(selectedSection.price)
                            : cleanPrice(event.price || 0)) *
                          (selectedSeats.length > 0
                            ? selectedSeats.length
                            : quantity)
                        ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="medium"
                      fullWidth
                      className="buy-btn-premium"
                      style={{ height: '40px', fontSize: '0.75rem', color: '#000', fontWeight: 900, letterSpacing: '1px' }}
                      onClick={handleAddToCart}
                      disabled={event && event.available_tickets === 0}
                    >
                      <span style={{ color: '#fff', fontWeight: 950, display: 'inline-block' }}>COMPRAR BOLETO</span>
                    </Button>

                    <div className="lucky-action-container" style={{ marginTop: '0.85rem' }}>
                      <Button
                        variant="primary"
                        size="medium"
                        fullWidth
                        style={{ height: '40px', fontSize: '0.75rem', letterSpacing: '1px' }}
                        onClick={handleLuckySeat}
                        disabled={
                          event.available_tickets === 0 || isRouletteActive
                        }
                        className={`lucky-btn-premium-gold ${isRouletteActive ? "active" : ""}`}
                      >
                        {isRouletteActive
                          ? "ESCANEANDO RECINTO..."
                          : "RULETA LAIKA LUCKY SEAT ($400)"}
                        {isRouletteActive && (
                          <span className="scan-line"></span>
                        )}
                      </Button>
                      <button
                        className="prob-info-btn"
                        onClick={() => setShowProbModal(true)}
                        title="Ver probabilidades"
                      >
                        ?
                      </button>
                    </div>
                  </div>

                
            </div>
          </div>
        </div>

        {/* --- MODALES MOVIDOS AL NIVEL SUPERIOR DEL CONTENEDOR PARA EVITAR CONFLICTOS --- */}
        
        {/* MODAL DE PROBABILIDADES */}
        {showProbModal && (
          <div
            className="laika-modal-overlay"
            onClick={() => setShowProbModal(false)}
          >
            <div
              className="laika-data-sheet prob-modal-glass"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="data-sheet-header">
                <h3>[ LAIKA UNIT ASSIGNMENT - PROBABILITIES ]</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowProbModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="data-sheet-content">
                <div className="prob-row vip">
                  <span className="label">
                    NIVEL S (VIP/PLATINO):
                  </span>
                  <span className="value">15.0%</span>
                  <div className="prob-bar">
                    <div
                      className="fill"
                      style={{ width: "15%" }}
                    ></div>
                  </div>
                </div>
                <div className="prob-row gold">
                  <span className="label">NIVEL A (ZONA ORO):</span>
                  <span className="value">25.0%</span>
                  <div className="prob-bar">
                    <div
                      className="fill"
                      style={{ width: "25%" }}
                    ></div>
                  </div>
                </div>
                <div className="prob-row general">
                  <span className="label">
                    NIVEL B (GENERAL):
                  </span>
                  <span className="value">60.0%</span>
                  <div className="prob-bar">
                    <div
                      className="fill"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="data-sheet-footer">
                <p>* COSTO FIJO POR ASIGNACIÓN: $400.00 MXN</p>
                <p>
                  * EL SISTEMA BUSCA AUTOMÁTICAMENTE EL MEJOR LUGAR
                  DISPONIBLE EN EL NIVEL ASIGNADO.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE PAGO PARA LA RULETA */}
        {showRoulettePayment && (
          <div
            className="laika-modal-overlay"
            onClick={() =>
              !isProcessingPayment && setShowRoulettePayment(false)
            }
          >
            <div
              className={`laika-data-sheet payment-roulette-modal ${isProcessingPayment ? "processing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              {isProcessingPayment ? (
                <div className="payment-loading-state">
                  <div className="spinner-gold-container">
                    <div className="spinner-gold-outer"></div>
                    <div className="spinner-gold-inner"></div>
                    <Icon
                      name="zap"
                      size={32}
                      className="zap-icon-pulse"
                    />
                  </div>
                  <h3
                    className="glitch-text"
                    data-text="[ VALIDANDO ENERGÍA LAIKA ]"
                  >
                    [ VALIDANDO ENERGÍA LAIKA ]
                  </h3>
                  <p className="loading-subtext">
                    Sincronizando con la red de asignación de
                    asientos... No interrumpas el flujo.
                  </p>
                </div>
              ) : (
                <>
                  <div className="data-sheet-header">
                    <div className="header-badge">PREMIUM ACCESS</div>
                    <h3>[ LUCKY SEAT VAULT ]</h3>
                    <button
                      className="close-btn"
                      onClick={() => setShowRoulettePayment(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="data-sheet-content payment-horizontal-layout">
                    {/* COLUMNA IZQUIERDA: RESUMEN DE PRECIO */}
                    <div className="payment-col left-col">
                      <div className="price-tag-container">
                        <span className="price-label">COSTO DE ENTRADA</span>
                        <h2 className="price-value">$400.00</h2>
                        <span className="price-currency">MXN</span>
                      </div>
                      <div className="payment-security-labels">
                        <div className="security-item">
                          <Icon name="lock" size={12} />
                          <span>PAGO ENCRIPTADO 256-BIT</span>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA DERECHA: MÉTODOS Y ACCIÓN */}
                    <div className="payment-col right-col">
                      <h4 className="step-title">¿CÓMO QUIERES PAGAR?</h4>
                      
                      <div className="method-list">
                        <div 
                            className={`method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('card')}
                        >
                            <div className="radio-circle"></div>
                            <div style={{ flex: 1 }}>
                                <span className="method-label">Tarjeta crédito / débito</span>
                                <div className="card-icons">
                                      <svg width="20" height="12" viewBox="0 0 30 20"><rect width="30" height="20" rx="3" fill="#1A1F71"/><path d="M11 13l1-5h2l-1 5h-2zm7-5c-.6 0-1 .2-1.3.6l-.2-.5h-1.6l1.2 5h1.8l.2-1.3h2l.1 1.3h1.8l-.8-5h-1.3zm.2 1.3h-.7l.2 1.3h.6l-.1-1.3z" fill="white"/></svg>
                                      <svg width="20" height="12" viewBox="0 0 30 20"><rect width="30" height="20" rx="3" fill="#EB001B"/><circle cx="12" cy="10" r="7" fill="#EB001B"/><circle cx="18" cy="10" r="7" fill="#F79E1B" fillOpacity="0.8"/></svg>
                                </div>
                            </div>
                        </div>

                        {paymentMethod === 'card' && (
                            <div className="card-form-compact">
                                <input type="text" name="number" value={cardData.number} onChange={handleCardChange} placeholder="NÚMERO DE TARJETA" maxLength="16" />
                                <div className="form-row-compact">
                                    <input type="text" name="expiry" value={cardData.expiry} onChange={handleCardChange} placeholder="MM/YY" maxLength="5" />
                                    <input type="password" name="cvv" value={cardData.cvv} onChange={handleCardChange} placeholder="CVV" maxLength="3" />
                                </div>
                            </div>
                        )}

                        <div 
                            className={`method-card ${paymentMethod === 'oxxo' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('oxxo')}
                        >
                            <div className="radio-circle"></div>
                            <div style={{ flex: 1 }}>
                                <span className="method-label">Efectivo Oxxo</span>
                            </div>
                            <div className="oxxo-badge">OXXO PAY</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => confirmRoulettePayment(paymentMethod)}
                          disabled={isProcessingPayment}
                          className="pay-vault-confirm-btn"
                        >
                          {isProcessingPayment ? 'PROCESANDO...' : 'CONFIRMAR PAGO'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODAL DE COMPRA DIRECTA DE BOLETOS FAST-CHECKOUT */}
        {showDirectPayment && directTicketData && (
          <div
            className="laika-modal-overlay"
            onClick={() => !isProcessingPayment && setShowDirectPayment(false)}
          >
            <div
              className={'laika-data-sheet payment-roulette-modal ' + (isProcessingPayment ? 'processing' : '')}
              onClick={(e) => e.stopPropagation()}
            >
              {isProcessingPayment ? (
                <div className="payment-loading-state">
                  <div className="spinner-gold-container">
                    <div className="spinner-gold-outer"></div>
                    <div className="spinner-gold-inner"></div>
                    <Icon name="zap" size={32} className="zap-icon-pulse" />
                  </div>
                  <h3 className="glitch-text" data-text="[ PROCESANDO ORDEN ]">[ PROCESANDO ORDEN ]</h3>
                  <p className="loading-subtext">Reservando tus asientos en la red de Laika...</p>
                </div>
              ) : (
                <>
                  <div className="data-sheet-header">
                    <div className="header-badge">TICKET DIRECT ACCESS</div>
                    <h3>[ COMPRA DE BOLETOS ]</h3>
                    <button className="close-btn" onClick={() => setShowDirectPayment(false)}>×</button>
                  </div>
                  <div className="data-sheet-content payment-horizontal-layout">
                    <div className="payment-col left-col">
                      <div className="price-tag-container">
                        <span className="price-label">TOTAL A PAGAR</span>
                        <h2 className="price-value">${(cleanPrice(directTicketData?.section?.price || selectedSection?.price || 0) * (directTicketData?.quantity || 1)).toLocaleString("es-MX", { minimumFractionDigits: 0 })}</h2>
                        <span className="price-currency">MXN</span>
                      </div>
                      <div className="payment-security-labels" style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#888', background: '#111', padding: '10px', borderRadius: '8px' }}>
                          <div style={{ fontWeight: 800 }}>RESUMEN:</div>
                          <div>Evento: {directTicketData?.event?.name}</div>
                          <div>Sección: {directTicketData?.section?.name || "General"}</div>
                          <div>Asiento(s): {directTicketData?.seats?.length > 0 ? directTicketData.seats.map(s => s.split('-').slice(-2).join('-')).join(', ') : "General (Sin número)"}</div>
                          <div>Cantidad: {directTicketData?.quantity} ticket(s)</div>
                        </div>
                      </div>
                    </div>

                    <div className="payment-col right-col">
                      <h4 className="step-title">¿CÓMO QUIERES PAGAR?</h4>
                      <div className="method-list">
                        <div className={'method-card ' + (paymentMethod === 'card' ? 'active' : '')} onClick={() => setPaymentMethod('card')}>
                          <div className="radio-circle"></div>
                          <div style={{ flex: 1 }}>
                            <span className="method-label">Tarjeta crédito / débito</span>
                          </div>
                        </div>
                        {paymentMethod === 'card' && (
                          <div className="card-form-compact">
                            <input type="text" name="number" value={cardData.number} onChange={handleCardChange} placeholder="NÚMERO DE TARJETA" maxLength="16" />
                            <div className="form-row-compact">
                              <input type="text" name="expiry" value={cardData.expiry} onChange={handleCardChange} placeholder="MM/YY" maxLength="5" />
                              <input type="password" name="cvv" value={cardData.cvv} onChange={handleCardChange} placeholder="CVV" maxLength="3" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button variant="primary" fullWidth onClick={() => confirmDirectPayment(paymentMethod)} disabled={isProcessingPayment}>
                          {isProcessingPayment ? 'PROCESANDO...' : 'PAGAR BOLETO'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ANIMACIÓN PREMIUM GLOW TICKET (COMPRA EXITOSA) */}
        {showSuccessTicket && (
          <div className="laika-modal-overlay success-glow-overlay" onClick={() => setShowSuccessTicket(false)}>
            <div className="ticket-glowing-showcase" onClick={e => e.stopPropagation()}>
              <div className="success-banner">¡TRANSACCIÓN EXITOSA!</div>
              {customTicketDesign ? (
                <div style={{ position: 'relative', width: `${customTicketDesign.canvasSize.w}px`, height: `${customTicketDesign.canvasSize.h}px`, backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', maxWidth: '90vw' }}>
                  <div className="glow-border"></div>
                  {customTicketDesign.elements.map(el => {
                    const style = {
                      position: 'absolute',
                      left: `${el.x}px`, top: `${el.y}px`,
                      fontFamily: el.fontFamily || 'inherit',
                      fontWeight: el.fontWeight || 'normal',
                      cursor: 'default',
                      userSelect: 'none'
                    };

                    if (el.type === 'rect') {
                      return <div key={el.id} style={{ ...style, width: `${el.w}px`, height: `${el.h}px`, background: el.color }} />
                    }
                    if (el.type === 'dashed-line') {
                      return <div key={el.id} style={{ ...style, width: `${el.w}px`, height: `${el.h}px`, borderLeft: `${el.w}px dashed ${el.color}` }} />
                    }
                    if (el.type === 'text') {
                      let text = el.text;
                      if (text.includes("TÍTULO DEL EVENTO")) text = event.name;
                      if (text.includes("FECHA")) text = `FECHA: ${formatDate(displayDate)}`;
                      if (text.includes("HORA")) text = `HORA: ${formatTime(displayTime)} hrs`;
                      if (text.includes("$0.00")) text = `$${(directTicketData?.total || 1500).toLocaleString()}`;
                      if (text.includes("TALÓN")) text = `TALÓN CONTROL`;
                      
                      return <div key={el.id} style={{ ...style, fontSize: `${el.fontSize}px`, color: el.color, whiteSpace: 'pre-line' }}>{text}</div>
                    }
                    if (el.type === 'uploaded-image') {
                      return <div key={el.id} style={{ ...style }}><img src={el.src} style={{ width: `${el.w}px`, height: `${el.h}px`, objectFit: 'cover' }} alt="ticket-img" /></div>
                    }
                    if (el.type === 'barcode') {
                      return <div key={el.id} style={{ ...style, width: `${el.w}px`, height: `${el.h}px`, background: 'linear-gradient(to right, #000 5%, #fff 5%, #000 15%)', backgroundSize: '8px 100%' }} />
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="ticket-card-animated">
                  <div className="glow-border"></div>
                  <div className="ticket-content">
                    <div className="ticket-header">
                      <span className="badge-digital">DIGITAL PASS</span>
                      <h3>{directTicketData?.event?.name || event.name}</h3>
                    </div>
                    <div className="ticket-body">
                      <div className="row">
                        <span>SECCIÓN</span>
                        <strong style={{ color: '#EAB308' }}>{directTicketData?.section?.name || "General"}</strong>
                      </div>
                      <div className="row">
                        <span>ASIENTO</span>
                        <strong>{directTicketData?.seats?.length > 0 ? directTicketData.seats.map(s => s.split('-').slice(-2).join('-')).join(', ') : "General"}</strong>
                      </div>
                    </div>
                    <div className="ticket-footer">
                      <div className="qr-box-animated">
                        <Icon name="qrCode" size={100} color="#fff" />
                      </div>
                      <span className="scan-text">ESCANEAR ACCESO</span>
                    </div>
                  </div>
                </div>
              )}
              <Button variant="primary" className="mt-4" onClick={() => { setShowSuccessTicket(false); navigate('/profile'); }}>IR A MIS BOLETOS</Button>
            </div>
          </div>
        )}

        {/* MODAL DE GANADOR LUCY SEAT (PANTALLA FINAL DRAMÁTICA) */}
        {showWinnerModal && winningSeatInfo && (
          <div className="laika-modal-overlay">
            <div className="winner-announce-modal winner-horizontal-layout glass-card">
              <div className="winner-sparkles left"></div>
              <div className="winner-sparkles right"></div>

              {/* COLUMNA IZQUIERDA: MENSAJE DE ÉXITO */}
              <div className="layout-col left-col">
                <div className="status-label">ASIGNACIÓN EXITOSA</div>
                <h1 className="congrats-text">¡FELICIDADES!</h1>
                <p className="winner-subtext">
                  EL SISTEMA HA SELECCIONADO TU LUGAR PRIVILEGIADO
                </p>
              </div>

              {/* COLUMNA CENTRAL: EL BOLETO HERO */}
              <div className="layout-col center-col hero-ticket-container">
                <div className="winner-card-visual">
                  {(() => {
                    const zone = winningSeatInfo.zoneName.toUpperCase();
                    let themeClass = "golden-ticket-card";
                    let themeColor = "#EAB308"; // Default
                    if (zone.includes("BRONCE")) { themeClass += " bronze-theme"; themeColor = luckyConfig.themes.bronze; }
                    else if (zone.includes("PLATA")) { themeClass += " silver-theme"; themeColor = luckyConfig.themes.silver; }
                    else if (zone.includes("PLATINO")) { themeClass += " platinum-theme"; themeColor = luckyConfig.themes.platinum; }
                    else if (zone.includes("ORO")) { themeClass += " gold-theme"; themeColor = luckyConfig.themes.gold; }
                    
                    return (
                      <div className={themeClass} style={{ borderColor: themeColor }}>
                        <div className="golden-glow" style={{ background: `radial-gradient(circle, ${themeColor}22 0%, transparent 70%)` }}></div>
                        <div className="ticket-header">
                          <div className="ticket-title-row" style={{ color: themeColor }}>
                            <Icon name="sparkles" size={16} />
                            <span>LAIKA LUCKY SEAT</span>
                            <Icon name="sparkles" size={16} />
                          </div>
                        </div>
                        <div className="ticket-body">
                          <div className="seat-circle-large" style={{ borderColor: `${themeColor}44`, background: `radial-gradient(circle, ${themeColor}11 0%, transparent 80%)` }}>
                            <div className="seat-label-top">ASIENTO</div>
                            <span className="seat-number" style={{ color: themeColor }}>
                              {winningSeatInfo.name}
                            </span>
                          </div>
                        </div>
                        <div className="ticket-footer">
                          <div className="barcode-container">
                            <div className="barcode-mock" style={{ opacity: 0.5 }}></div>
                            <span className="barcode-num">
                              L-LK-{winningSeatInfo.id.toUpperCase().split('-').pop()}-{Math.floor(1000 + Math.random() * 9000)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* COLUMNA DERECHA: INFO Y ACCIÓN */}
              <div className="layout-col right-col">
                <div className="winner-details-panel">
                  <div className="detail-item">
                    <span className="label">ZONA DELIMITADA</span>
                    <h3 className="value zone-name">{winningSeatInfo.zoneName}</h3>
                  </div>
                  <div className="detail-item">
                    <span className="label">CÓDIGO DE ACCESO</span>
                    <h3 className="value barcode-num">
                      LS-{winningSeatInfo.id.toUpperCase().split('-').pop()}
                    </h3>
                  </div>
                </div>
                <div className="winner-actions">
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={() => {
                      setShowWinnerModal(false);
                      setWinningSeatId(null);
                      success("¡Asiento agregado con éxito!");
                      navigate("/profile");
                    }}
                    className="claim-btn-gold"
                  >
                    RECLAMAR MI LUGAR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <TicketPrinterOverlay
           isOpen={showPrinter}
           ticketData={printingData}
           isProcessing={isPrinterProcessing}
           onComplete={() => {
             setShowPrinter(false);
             setShowSuccessTicket(true);
           }}
        />
      </div>
    </div>
  );
};

export default EventDetail;
