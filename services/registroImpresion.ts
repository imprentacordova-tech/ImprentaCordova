/**
 * Calibración de registro de impresión — Imprenta Córdova
 * ======================================================
 *
 * POR QUÉ EXISTE
 * Las variantes `sri-sobre-preimpreso` y `comercial-recibo` imprimen los datos para que caigan
 * sobre las casillas de un formulario que YA está impreso. Eso exige que la hoja entre en la
 * impresora exactamente en la misma posición cada vez, y eso no depende del sistema: depende
 * de la impresora, de cómo se carga el papel y de la humedad del papel.
 *
 * La solución práctica no es adivinar márgenes desde el código: es poder CORRER el contenido
 * unos milímetros y ver el resultado en la hoja. Eso es lo que hace este módulo.
 *
 * CÓMO SE USA
 * En la página de impresión hay un panel (que no se imprime) con flechas: cada toque mueve el
 * contenido 0,5 mm. Se ajusta mirando una hoja de prueba hasta que los datos caigan en las
 * casillas, y el valor queda guardado por modelo.
 *
 * POR QUÉ POR MODELO
 * El medio oficio (160×220) y el recibo (160×110) se cargan distinto en la impresora y pueden
 * necesitar correcciones distintas. Guardar un solo valor global obligaría a recalibrar al
 * cambiar de trabajo.
 */

export interface Calibracion {
  /** Desplazamiento horizontal en milímetros. Positivo = a la derecha. */
  xMm: number;
  /** Desplazamiento vertical en milímetros. Positivo = hacia abajo. */
  yMm: number;
}

export const CALIBRACION_CERO: Calibracion = { xMm: 0, yMm: 0 };

/** Cuánto mueve cada toque. Medio milímetro es el grano útil en una impresora de oficina. */
export const PASO_MM = 0.5;

/**
 * Tope de seguridad. Si alguien deja apretada una flecha, el contenido se iría de la hoja y
 * parecería que la impresión "no funciona". Con 20 mm ya está claro que el problema es otro.
 */
export const LIMITE_MM = 20;

/** Redondeo a una décima: evita que se acumule error de coma flotante al sumar 0,5 muchas veces. */
export const redondearMm = (mm: number): number => Math.round(mm * 10) / 10;

/** Mantiene el valor dentro de los topes. Un valor no numérico cae en 0. */
export const limitarMm = (mm: number): number => {
  if (!Number.isFinite(mm)) return 0;
  return Math.max(-LIMITE_MM, Math.min(LIMITE_MM, redondearMm(mm)));
};

/** Aplica un desplazamiento, respetando los topes. */
export const moverCalibracion = (c: Calibracion, dxMm: number, dyMm: number): Calibracion => ({
  xMm: limitarMm(c.xMm + dxMm),
  yMm: limitarMm(c.yMm + dyMm),
});

export const esCalibracionCero = (c: Calibracion): boolean => c.xMm === 0 && c.yMm === 0;

/**
 * El `transform` a aplicar al documento. Devuelve `'none'` en cero para no generar una capa
 * de composición innecesaria (y para que el caso normal no cambie nada respecto de antes).
 *
 * Se usa `mm` de verdad, no píxeles: así el ajuste vale igual en pantalla y en la impresión,
 * y es el mismo número que se lee en el panel.
 */
export const transformCalibracion = (c: Calibracion): string =>
  esCalibracionCero(c) ? 'none' : `translate(${c.xMm}mm, ${c.yMm}mm)`;

/** Texto para el panel, con signo explícito. */
export const describirCalibracion = (c: Calibracion): string => {
  const signo = (v: number) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1));
  return `X ${signo(c.xMm)} mm · Y ${signo(c.yMm)} mm`;
};

const CLAVE_PREFIJO = 'cordova-calibracion-';

/** Clave de almacenamiento de un modelo. Se exporta para poder limpiarla desde afuera. */
export const claveCalibracion = (modelo: string): string => `${CLAVE_PREFIJO}${modelo}`;

/**
 * Lee la calibración guardada de un modelo.
 *
 * Nunca lanza: si no hay almacenamiento, si el JSON está corrupto o si los valores no son
 * números, devuelve cero. Un documento que no abre es peor que uno sin calibrar.
 */
export const cargarCalibracion = (modelo: string): Calibracion => {
  try {
    const crudo = globalThis.localStorage?.getItem(claveCalibracion(modelo));
    if (!crudo) return { ...CALIBRACION_CERO };
    const datos = JSON.parse(crudo) as Partial<Calibracion>;
    return { xMm: limitarMm(Number(datos?.xMm)), yMm: limitarMm(Number(datos?.yMm)) };
  } catch {
    return { ...CALIBRACION_CERO };
  }
};

/** Guarda la calibración de un modelo. Tampoco lanza si el almacenamiento está bloqueado. */
export const guardarCalibracion = (modelo: string, c: Calibracion): void => {
  try {
    globalThis.localStorage?.setItem(claveCalibracion(modelo), JSON.stringify(c));
  } catch {
    /* almacenamiento no disponible: se pierde el ajuste, no el documento */
  }
};

/** Borra la calibración de un modelo. */
export const borrarCalibracion = (modelo: string): void => {
  try {
    globalThis.localStorage?.removeItem(claveCalibracion(modelo));
  } catch {
    /* idem */
  }
};
