export interface ReferenceFigure {
  metric: string;
  optimal: string;
  warning: string;
  critical: string;
  unit: string;
}

export interface LibraryArticle {
  id: string;
  chapterNumber: 'I' | 'II';
  chapterTitle: string;
  species: 'peces' | 'cerdos';
  speciesLabel: string;
  topic: 'calidad_agua' | 'densidad' | 'fcr' | 'alimentacion' | 'bioseguridad' | 'sanidad' | 'costos';
  topicLabel: string;
  title: string;
  summary: string;
  content: string[];
  referenceFigures: ReferenceFigure[];
  commonErrors: string[];
  source: string;
  updatedAt: string;
  status: 'borrador' | 'aprobado';
}

export const LIBRARY_ARTICLES: LibraryArticle[] = [
  // =========================================================================
  // CAPÍTULO I: PISCICULTURA DE PRECISIÓN (Tilapia & Trucha)
  // =========================================================================
  {
    id: 'pisc-01-agua',
    chapterNumber: 'I',
    chapterTitle: 'I. Piscicultura de Precisión',
    species: 'peces',
    speciesLabel: 'Tilapia Roja & Nilótica',
    topic: 'calidad_agua',
    topicLabel: 'Calidad del Agua',
    title: 'Parámetros Físico-Químicos Críticos y Dinámica del Oxígeno Disuelto',
    summary: 'Guía técnica para el control de oxígeno, pH, nitritos y amonio no ionizado en estanques de tierra y geomembrana para cultivo de tilapia y trucha.',
    content: [
      'El oxígeno disuelto (OD) es el factor limitante número uno en piscicultura tropical. En sistemas semi-intensivos e intensivos, la concentración mínima de seguridad es de 4.0 mg/L al amanecer.',
      'El amonio total (TAN) se divide en ion amonio (NH4+) y amonio no ionizado (NH3 tóxico). A medida que el pH y la temperatura suben durante la tarde (por fotosíntesis fitoplanctónica), la fracción de NH3 tóxico se dispara peligrosamente superando los 0.02 mg/L.',
      'El disco Secchi debe mantenerse entre 25 y 35 cm. Valores inferiores a 20 cm indican bloom excesivo de microalgas con riesgo de anoxia nocturna severa; valores superiores a 40 cm denotan agua excesivamente clara sin productividad primaria.'
    ],
    referenceFigures: [
      { metric: 'Oxígeno Disuelto (Madrugada)', optimal: '≥ 5.0', warning: '3.0 – 4.5', critical: '< 2.5', unit: 'mg/L' },
      { metric: 'Amonio No Ionizado (NH3)', optimal: '< 0.02', warning: '0.02 – 0.05', critical: '> 0.08', unit: 'mg/L' },
      { metric: 'pH del Agua (2:00 PM)', optimal: '7.2 – 8.2', warning: '6.5 – 7.1 / 8.3 – 8.8', critical: '< 6.0 o > 9.2', unit: 'Escala pH' },
      { metric: 'Transparencia (Disco Secchi)', optimal: '28 – 35', warning: '20 – 27 / 36 – 45', critical: '< 18 o > 50', unit: 'cm' },
      { metric: 'Temperatura (Tilapia)', optimal: '26.0 – 29.5', warning: '23.0 – 25.5 / 30.0 – 32.0', critical: '< 20.0 o > 34.0', unit: '°C' }
    ],
    commonErrors: [
      'Medir el oxígeno únicamente al mediodía cuando las microalgas están fotosintetizando a tope, ignorando la caída nocturna crítica entre las 4:00 AM y 6:00 AM.',
      'Alimentar cuando el oxígeno en el fondo está por debajo de 3.0 mg/L, provocando digestión incompleta, aumento del FCR y mortalidad por estrés asfíctico.',
      'Confundir turbidez por arcilla en suspensión con floración algal útil; el uso del disco Secchi debe complementarse con observación del color del agua.'
    ],
    source: 'Manual de Buenas Prácticas en Acuicultura Continental (FAO / AGROSAVIA 2024)',
    updatedAt: '24 Sep 2026',
    status: 'aprobado'
  },
  {
    id: 'pisc-02-densidad',
    chapterNumber: 'I',
    chapterTitle: 'I. Piscicultura de Precisión',
    species: 'peces',
    speciesLabel: 'Tilapia & Cachama',
    topic: 'densidad',
    topicLabel: 'Densidad & Aforo',
    title: 'Capacidad de Carga Biológica y Cálculo de Volumen Útil según Aireación',
    summary: 'Protocolo de cálculo para determinar la densidad máxima segura por metro cúbico sin comprometer la ganancia diaria de peso ni causar enanismo por hacinamiento.',
    content: [
      'La capacidad de carga máxima en estanques de tierra rústicos sin aireación mecánica forzada no debe sobrepasar 2.5 a 3.0 kg de biomasa viva por metro cúbico de agua.',
      'La instalación de splashers o blowers de 1 HP por cada 1,000 m² de espejo de agua permite elevar el aforo técnico seguro hasta 8.0 a 10.0 kg/m³ con recambio moderado.',
      'En geomembrana circular con flujo circular (efecto té) y oxigenación líquida o difusores cerámicos se alcanzan densidades hiper-intensivas de 25.0 a 35.0 kg/m³.'
    ],
    referenceFigures: [
      { metric: 'Estanque Tierra Sin Aireación', optimal: '1.5 – 2.5', warning: '2.8 – 3.2', critical: '> 3.5', unit: 'kg/m³' },
      { metric: 'Estanque Tierra Con Splashers', optimal: '6.0 – 8.5', warning: '9.0 – 10.5', critical: '> 11.5', unit: 'kg/m³' },
      { metric: 'Geomembrana Intensiva', optimal: '18.0 – 28.0', warning: '29.0 – 33.0', critical: '> 36.0', unit: 'kg/m³' },
      { metric: 'Recambio Diario de Agua', optimal: '5 – 10', warning: '2 – 4', critical: '0 con alta carga', unit: '% volumen/día' }
    ],
    commonErrors: [
      'Sembrar alevinos calculando el estanque al 100% de la capacidad de cosecha final sin programar desdobles ni traslados a las 8 y 14 semanas.',
      'Calcular el volumen multiplicando largo por ancho por la profundidad de la corona, ignorando que la profundidad útil real suele ser 20 a 30 cm menor por taludes y lodos.',
      'Apagar la aireación durante la noche para ahorrar energía eléctrica, precisamente en el horario donde el consumo respiratorio es máximo.'
    ],
    source: 'Boletín Técnico de Aforo Piscícola — Secretaría de Agricultura & FEDEPESCA',
    updatedAt: '18 Sep 2026',
    status: 'aprobado'
  },
  {
    id: 'pisc-03-fcr',
    chapterNumber: 'I',
    chapterTitle: 'I. Piscicultura de Precisión',
    species: 'peces',
    speciesLabel: 'Tilapia Roja',
    topic: 'fcr',
    topicLabel: 'Factor de Conversión (FCR)',
    title: 'Optimización del FCR Ponderado y Curvas de Ganancia Diaria (GMD)',
    summary: 'Metodología para sostener un factor de conversión entre 1.15 y 1.35 mediante muestreos quincenales, control de sobrantes y ajuste por temperatura.',
    content: [
      'El Factor de Conversión Alimenticia (FCR) relaciona los kilogramos de concentrado suministrados frente a los kilogramos de peso vivo ganados. Cada incremento de 0.1 en el FCR representa un sobrecosto aproximado de $450 COP por kilo cosechado.',
      'La tasa de alimentación debe reducirse en un 30% si la temperatura del agua desciende por debajo de 24°C, y suspenderse si cae de 21°C debido a la ralentización del vaciado gástrico.',
      'El uso de bandejas testigo o marcos de monitoreo permite evaluar en 20 minutos si la ración asignada fue consumida en su totalidad o si existe sobrealimentación con hundimiento.'
    ],
    referenceFigures: [
      { metric: 'FCR Fase Alevinaje (1–30 g)', optimal: '0.90 – 1.05', warning: '1.10 – 1.20', critical: '> 1.25', unit: 'kg alim / kg pez' },
      { metric: 'FCR Fase Levante (30–180 g)', optimal: '1.15 – 1.28', warning: '1.30 – 1.40', critical: '> 1.45', unit: 'kg alim / kg pez' },
      { metric: 'FCR Fase Ceba (180–500 g)', optimal: '1.25 – 1.38', warning: '1.40 – 1.55', critical: '> 1.65', unit: 'kg alim / kg pez' },
      { metric: 'Ganancia Diaria (GMD Ceba)', optimal: '2.8 – 3.8', warning: '2.0 – 2.7', critical: '< 1.8', unit: 'g/pez/día' }
    ],
    commonErrors: [
      'Alimentar con horario fijo sin verificar el comportamiento del lote en la superficie.',
      'No reajustar la biomasa estimada tras detectar mortalidades de aves pescadoras o predadores, inflando artificialmente la ración diaria.',
      'Comprar concentrado económico con baja digestibilidad de proteína, lo que genera heces excesivas, ensucia el fondo y deteriora el FCR.'
    ],
    source: 'Centro de Investigación en Nutrición Acuícola Continental (CINAC)',
    updatedAt: '12 Sep 2026',
    status: 'aprobado'
  },
  {
    id: 'pisc-04-sanidad',
    chapterNumber: 'I',
    chapterTitle: 'I. Piscicultura de Precisión',
    species: 'peces',
    speciesLabel: 'Tilapia & Trucha',
    topic: 'sanidad',
    topicLabel: 'Sanidad & Bioseguridad',
    title: 'Protocolo de Encalado, Desinfección y Prevención de Streptococcus e Iridovirus',
    summary: 'Manejo profiláctico del suelo del estanque con cal agrícola y cal viva, cuarentena de semilla y diagnóstico precoz de patologías branquiales.',
    content: [
      'Entre cosechas consecutivas, el estanque debe drenarse por completo y exponerse al sol durante 5 a 8 días hasta que el lodo se agriete. Esta exposición oxida la materia orgánica y elimina esporas patógenas.',
      'Aplicación de cal viva (CaO) a razón de 100 a 150 g/m² sobre zonas húmedas para esterilizar el fondo, seguida de encalado con carbonato de calcio (CaCO3) a 150 g/m² para amortiguar la alcalinidad total (> 60 mg/L CaCO3).',
      'La presencia de nado errático en espiral, exoftalmia (ojo saltón) y congestión en la base de las aletas pectorales son síntomas patognomónicos de infección por Streptococcus agalactiae o iniae.'
    ],
    referenceFigures: [
      { metric: 'Días de Secado Solar del Fondo', optimal: '5 – 8', warning: '3 – 4', critical: '< 2 sin secar', unit: 'días' },
      { metric: 'Dosis Cal Viva (CaO) Fondo', optimal: '100 – 150', warning: '60 – 90', critical: '< 50', unit: 'g/m²' },
      { metric: 'Alcalinidad Total del Agua', optimal: '60 – 120', warning: '40 – 55', critical: '< 30', unit: 'mg/L CaCO3' },
      { metric: 'Mortalidad Diaria Normal', optimal: '< 0.05', warning: '0.06 – 0.15', critical: '> 0.25', unit: '% lote/día' }
    ],
    commonErrors: [
      'Llenar el estanque inmediatamente después de la cosecha anterior sin desinfectar con cal ni secar el fondo.',
      'Suministrar antibióticos al voleo sin antibiograma veterinario ni respetar los tiempos de retiro antes de la venta a plaza comercial.',
      'Compartir chinchorros y redes de muestreo entre estanques enfermos y estanques sanos sin desinfección con yodo o cloro al 2%.'
    ],
    source: 'Instituto Colombiano Agropecuario (ICA) — Manual Sanitario Acuícola 2025',
    updatedAt: '05 Sep 2026',
    status: 'borrador'
  },

  // =========================================================================
  // CAPÍTULO II: PORCICULTURA DE PRECISIÓN (Cerdos Levante & Ceba)
  // =========================================================================
  {
    id: 'porc-01-fases',
    chapterNumber: 'II',
    chapterTitle: 'II. Porcicultura de Precisión',
    species: 'cerdos',
    speciesLabel: 'Porcinos en Levante & Ceba',
    topic: 'alimentacion',
    topicLabel: 'Alimentación por Fases',
    title: 'Nutrición por Fases de Crecimiento: Precebo, Levante y Engorde Terminal',
    summary: 'Curvas de consumo voluntario, formulación de proteína digestible y manejo del comedero seco-húmedo para alcanzar 115 kg en 150 días de vida.',
    content: [
      'La transición de leche materna a alimento seco en precebo (lechones de 6 a 22 kg) requiere dietas de alta digestibilidad con plasma porcino, suero de leche y aminoácidos sintéticos (Lisina digestible > 1.25%).',
      'En la fase de levante (25 a 55 kg), el potencial de deposición de tejido magro es máximo. Limitar el consumo en esta fase deprime la conformación muscular y alarga los días a matadero.',
      'Durante la ceba terminal (55 a 115 kg), la eficiencia energética se prioriza; el comedero seco-húmedo reduce el desperdicio de alimento en un 8 a 12% comparado con tolvas secas convencionales.'
    ],
    referenceFigures: [
      { metric: 'Consumo Precebo (12–25 kg)', optimal: '0.90 – 1.30', warning: '0.70 – 0.85', critical: '< 0.65', unit: 'kg/cerdo/día' },
      { metric: 'Consumo Levante (25–55 kg)', optimal: '1.80 – 2.30', warning: '1.50 – 1.75', critical: '< 1.40', unit: 'kg/cerdo/día' },
      { metric: 'Consumo Ceba (55–115 kg)', optimal: '2.70 – 3.30', warning: '2.30 – 2.60', critical: '< 2.10', unit: 'kg/cerdo/día' },
      { metric: 'Ganancia Diaria Ceba (GMD)', optimal: '850 – 1020', warning: '700 – 840', critical: '< 650', unit: 'g/día' }
    ],
    commonErrors: [
      'Servir alimento en el suelo o permitir que las tolvas acumulen alimento fermentado y húmedo en las esquinas.',
      'Suministrar agua con bajo caudal en chupón (menos de 1.5 L/min en ceba), lo que restringe el consumo voluntario de concentrado.',
      'Mezclar cerdos de pesos dispares (> 5 kg de diferencia en precebo), generando dominancia y animales retrasados.'
    ],
    source: 'Asociación Colombiana de Porcicultores (Porkcolombia) — Guía Técnica 2025',
    updatedAt: '20 Sep 2026',
    status: 'aprobado'
  },
  {
    id: 'porc-02-bioseguridad',
    chapterNumber: 'II',
    chapterTitle: 'II. Porcicultura de Precisión',
    species: 'cerdos',
    speciesLabel: 'Granja Porcícola Integral',
    topic: 'bioseguridad',
    topicLabel: 'Bioseguridad & Sanidad',
    title: 'Vacío Sanitario, Manejo de Pediluvios y Control de Vacunación contra Micoplasma',
    summary: 'Implementación del sistema Todo Adentro - Todo Afuera (All-in / All-out), desinfección con espumígenos y control de enfermedades respiratorias.',
    content: [
      'El sistema All-in / All-out exige desalojar por completo cada sala o galpón, lavar con hidrolavadora a presión, aplicar detergente desengrasante, desinfectar con glutaraldehído o amonio cuaternario y mantener un descanso sanitario de al menos 5 días.',
      'Los pediluvios a la entrada de cada nave deben contener solución desinfectante limpia, renovándose cada 48 horas como máximo para evitar la neutralización por lodo orgánico.',
      'El complejo respiratorio porcino (causado por Mycoplasma hyopneumoniae y Pasteurella multocida) se previene vacunando lechones a la semana 1 y 3 de vida, combinado con ventilación constante.'
    ],
    referenceFigures: [
      { metric: 'Días Vacío Sanitario por Nave', optimal: '5 – 7', warning: '3 – 4', critical: '< 2 días', unit: 'días descanso' },
      { metric: 'Renovación Solución Pediluvios', optimal: 'Cada 24 – 48', warning: 'Cada 72', critical: '> 4 días sucios', unit: 'horas' },
      { metric: 'Mortalidad Acumulada Precebo', optimal: '< 2.0', warning: '2.5 – 3.5', critical: '> 4.5', unit: '% fase' },
      { metric: 'Mortalidad Acumulada Ceba', optimal: '< 1.5', warning: '1.8 – 2.8', critical: '> 3.5', unit: '% fase' }
    ],
    commonErrors: [
      'Ingresar animales nuevos a un lote existente sin haber cumplido mínimo 21 días en corral de cuarentena perimetral.',
      'Mantener pediluvios con agua turbia y estiércol acumulado, lo que actúa como reservorio de bacterias en lugar de barrera.',
      'Permitir el ingreso de camiones de transporte de ganado o compradores directamente a la zona limpia de la granja.'
    ],
    source: 'Manual de Bioseguridad en Granjas Porcinas — ICA & Porkcolombia',
    updatedAt: '15 Sep 2026',
    status: 'aprobado'
  },
  {
    id: 'porc-03-ambiente',
    chapterNumber: 'II',
    chapterTitle: 'II. Porcicultura de Precisión',
    species: 'cerdos',
    speciesLabel: 'Porcinos en Galpón',
    topic: 'densidad',
    topicLabel: 'Ambiente & Espacio',
    title: 'Densidad por Metro Cuadrado, Ventilación y Mitigación del Estrés Calórico',
    summary: 'Espacio vital por animal según kilogramos de peso, manejo de cortinas laterales y control de amoníaco ambiental (NH3) en galpón.',
    content: [
      'El hacinamiento en corrales porcinos incrementa peleas, mordeduras de cola (canibalismo), úlceras gástricas y deprime la conversión alimenticia en más de un 15%.',
      'El espacio libre de piso requerido aumenta según el peso vivo: 0.35 m² en precebo (hasta 25 kg), 0.65 m² en levante (hasta 55 kg) y 1.0 m² en ceba terminal (hasta 115 kg).',
      'En climas cálidos (> 28°C), el cerdo no transpira por glándulas sudoríparas. Requiere sistemas de nebulización intermitente y ventiladores para evitar el jadeo agudo y muerte súbita por golpe de calor.'
    ],
    referenceFigures: [
      { metric: 'Área Corral Precebo (hasta 25 kg)', optimal: '0.35 – 0.40', warning: '0.30 – 0.34', critical: '< 0.28', unit: 'm²/cerdo' },
      { metric: 'Área Corral Ceba (hasta 115 kg)', optimal: '0.95 – 1.10', warning: '0.80 – 0.90', critical: '< 0.75', unit: 'm²/cerdo' },
      { metric: 'Amoníaco en Aire (NH3 Galpón)', optimal: '< 10', warning: '11 – 20', critical: '> 25', unit: 'ppm' },
      { metric: 'Temperatura Zona Termoneutra (Ceba)', optimal: '18 – 22', warning: '24 – 27', critical: '> 30', unit: '°C' }
    ],
    commonErrors: [
      'Aumentar la cantidad de animales por corral sin considerar el área útil neta ocupada por comederos y bebederos.',
      'Cerrar herméticamente las cortinas por miedo al frío, provocando acumulación asfixiante de amoníaco y condensación de humedad.',
      'Descuidar la limpieza de estercoleros y fosas de purín debajo de las rejillas slats.'
    ],
    source: 'Centro de Investigación en Zootecnia Porcina — Universidad Nacional de Colombia',
    updatedAt: '01 Sep 2026',
    status: 'borrador'
  },
  {
    id: 'porc-04-costos',
    chapterNumber: 'II',
    chapterTitle: 'II. Porcicultura de Precisión',
    species: 'cerdos',
    speciesLabel: 'Porcinos Comercial',
    topic: 'costos',
    topicLabel: 'Costos de Producción',
    title: 'Estructura de Costos del Kilo de Cerdo en Pie y Punto de Equilibrio',
    summary: 'Análisis de sensibilidad económica: costo de materias primas (maíz y soya representan el 74% del gasto total) y márgenes de rentabilidad.',
    content: [
      'El alimento balanceado representa entre el 70% y el 78% del costo total de producir un cerdo en pie. Por tanto, cada gramo de concentrado ahorrado por mejora del FCR impacta de forma directa la rentabilidad neta.',
      'El FCR acumulado granja (desde desteto a beneficio) debe mantenerse por debajo de 2.55 kg alimento / kg peso vivo.',
      'El costo de la semilla (lechón desteto de 6 kg o 21 días) oscila entre el 15% y el 18% del costo total. La mano de obra representa el 6% al 8%, y la energía/fármacos el 3% al 5%.'
    ],
    referenceFigures: [
      { metric: 'FCR Global Acumulado (Desteto a Ceba)', optimal: '2.35 – 2.50', warning: '2.55 – 2.70', critical: '> 2.85', unit: 'kg alim / kg cerdo' },
      { metric: 'Participación Alimento en Costo Total', optimal: '70 – 74', warning: '75 – 79', critical: '> 82', unit: '% costo total' },
      { metric: 'Días a Faena (Meta 115 kg)', optimal: '145 – 155', warning: '160 – 175', critical: '> 185', unit: 'días vida' },
      { metric: 'Rendimiento en Canal Fría', optimal: '78 – 82', warning: '75 – 77', critical: '< 74', unit: '%' }
    ],
    commonErrors: [
      'Comprar concentrado fijándose únicamente en el precio por bulto de 40 kg en lugar de calcular el costo por kilogramo de carne producido ($/kg).',
      'Extender la permanencia del cerdo más allá de los 115–120 kg cuando la tasa de conversión se deteriora drásticamente por deposición de grasa dorsal.',
      'No registrar los costos de energía de bombeo ni los gastos de flete y transporte a planta de beneficio.'
    ],
    source: 'Observatorio Económico Porcícola Nacional — Informe Anual 2026',
    updatedAt: '22 Sep 2026',
    status: 'aprobado'
  }
];
