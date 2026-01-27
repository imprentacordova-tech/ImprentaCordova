
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Función para convertir número a letras
export const numeroALetras = (num: number): string => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const especiales = {
        11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
        16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
        21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro',
        25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve'
    };

    const getDecenas = (n: number) => {
        if (n < 10) return unidades[n];
        if (n === 10) return 'diez';
        if (n > 10 && n < 20) return especiales[n];
        if (n > 20 && n < 30) return especiales[n];

        const d = Math.floor(n / 10);
        const u = n % 10;
        if (u === 0) return decenas[d];
        return `${decenas[d]} y ${unidades[u]}`;
    };

    const getCentenas = (n: number) => {
        if (n < 100) return getDecenas(n);
        if (n === 100) return 'cien';
        const c = Math.floor(n / 100);
        const du = n % 100;
        if (du === 0) return centenas[c];
        return `${centenas[c]} ${getDecenas(du)}`;
    };

    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);

    const enteroEnLetras = getCentenas(entero);
    const textoFinal = `${enteroEnLetras.charAt(0).toUpperCase() + enteroEnLetras.slice(1)} con ${decimal.toString().padStart(2, '0')}/100 Dólares`;

    return textoFinal;
};

/**
 * Valida Cédula o RUC Ecuatoriano (Algoritmo Módulo 10)
 */
export const validarIdentificacionEC = (identificacion: string): boolean => {
    const id = identificacion.trim();
    if (!/^\d+$/.test(id)) return false;
    if (id.length !== 10 && id.length !== 13) return false;

    const provincia = parseInt(id.substring(0, 2));
    if (provincia < 1 || provincia > 24) return false;

    const digitoVerificador = parseInt(id.substring(9, 10));
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let total = 0;

    for (let i = 0; i < 9; i++) {
        let valor = parseInt(id.charAt(i)) * coeficientes[i];
        if (valor > 9) valor -= 9;
        total += valor;
    }

    const mod = total % 10;
    const val = mod === 0 ? 0 : 10 - mod;

    return val === digitoVerificador;
};

export const generateWhatsAppLink = (phone: string, message: string): string => {
    // Limpieza de número para formato internacional
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '593' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('593')) cleanPhone = '593' + cleanPhone;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
