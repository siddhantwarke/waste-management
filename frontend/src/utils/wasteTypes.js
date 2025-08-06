// Waste types available in the system
export const WASTE_TYPES = [
  { 
    value: 'e-waste', 
    label: 'E-Waste (Electronics)', 
    key: 'e_waste_price',
    icon: 'fas fa-microchip',
    emoji: '📱',
    color: 'warning',
    bgColor: '#ffc107'
  },
  { 
    value: 'plastic', 
    label: 'Plastic', 
    key: 'plastic_price',
    icon: 'fas fa-bottle-water',
    emoji: '🍶',
    color: 'info',
    bgColor: '#0dcaf0'
  },
  { 
    value: 'paper', 
    label: 'Paper/Cardboard', 
    key: 'paper_price',
    icon: 'fas fa-newspaper',
    emoji: '📄',
    color: 'secondary',
    bgColor: '#6c757d'
  },
  { 
    value: 'metal', 
    label: 'Metal', 
    key: 'metal_price',
    icon: 'fas fa-cog',
    emoji: '🔧',
    color: 'dark',
    bgColor: '#212529'
  },
  { 
    value: 'glass', 
    label: 'Glass', 
    key: 'glass_price',
    icon: 'fas fa-wine-glass',
    emoji: '🍷',
    color: 'info',
    bgColor: '#6f42c1'
  }
];

// Helper function to get price field name from waste type
export const getPriceFieldName = (wasteType) => {
  const type = WASTE_TYPES.find(t => t.value === wasteType);
  return type ? type.key : null;
};

// Helper function to get waste type info by value
export const getWasteTypeInfo = (wasteType) => {
  const type = WASTE_TYPES.find(t => t.value === wasteType);
  return type || { 
    value: wasteType, 
    label: wasteType, 
    icon: 'fas fa-trash-alt', 
    emoji: '🗑️',
    color: 'secondary',
    bgColor: '#6c757d'
  };
};
