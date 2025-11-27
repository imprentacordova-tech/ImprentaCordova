
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
